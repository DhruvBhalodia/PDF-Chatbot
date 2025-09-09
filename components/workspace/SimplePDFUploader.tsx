'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2, FileText, CheckCircle } from 'lucide-react'
import { generateFingerprint, formatBytes } from '@/lib/utils'
import * as pdfjsLib from 'pdfjs-dist'

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
}

interface SimplePDFUploaderProps {
  workspaceId: string
  onSuccess: () => void
  onClose: () => void
}

export default function SimplePDFUploader({ workspaceId, onSuccess, onClose }: SimplePDFUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a PDF file')
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)
    setError('')
  }

  const processPDFPages = async (file: File): Promise<{ pages: Array<{ text: string, pageNumber: number, imageBlob: Blob }>, pageCount: number }> => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const pageCount = pdf.numPages
    const pages = []

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i)
      
      // Try to extract text
      let pageText = ''
      try {
        const textContent = await page.getTextContent()
        pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim()
      } catch (err) {
        console.log(`Could not extract text from page ${i}`);
      }
      
      // Create page snapshot image
      const viewport = page.getViewport({ scale: 1.5 })
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise

      const imageBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85)
      })
      
      pages.push({ 
        text: pageText || `[Page ${i} - Image/Scanned Content]`, 
        pageNumber: i,
        imageBlob
      })
    }

    return { pages, pageCount }
  }

  const processPDF = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError('')

    try {
      setStatus('Processing PDF pages...')
      setProgress(5)
      
      // Process PDF pages (extract text and create snapshots)
      const { pages: extractedPages, pageCount } = await processPDFPages(file)
      
      if (!extractedPages || extractedPages.length === 0) {
        throw new Error('Could not process PDF. The document may be empty.')
      }
      
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create document record
      setStatus('Creating document...')
      setProgress(10)
      
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          workspace_id: workspaceId,
          title: file.name,
          byte_size: file.size,
          page_count: pageCount,
          status: 'processing'
        })
        .select()
        .single()

      if (docError) throw docError

      // Upload page snapshots
      setStatus('Uploading page snapshots...')
      const pageRecords = []
      
      for (let i = 0; i < extractedPages.length; i++) {
        const page = extractedPages[i]
        setProgress(30 + (i / extractedPages.length) * 40)
        
        const imageName = `${document.id}/page-${page.pageNumber}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('pdf-pages')
          .upload(imageName, page.imageBlob, {
            contentType: 'image/jpeg',
            upsert: true
          })

        if (uploadError && !uploadError.message.includes('already exists')) {
          console.error(`Failed to upload page ${page.pageNumber}:`, uploadError)
        }

        const { data: { publicUrl } } = supabase.storage
          .from('pdf-pages')
          .getPublicUrl(imageName)
        
        pageRecords.push({
          document_id: document.id,
          page_number: page.pageNumber,
          image_url: publicUrl,
          text: page.text,
          tokens: page.text.split(' ').length,
          fingerprint64: generateFingerprint(page.text || `page-${page.pageNumber}`)
        })
      }
      
      const { error: pageError } = await supabase
        .from('pages')
        .insert(pageRecords)

      if (pageError) throw pageError

      // Update document status
      setStatus('Finalizing...')
      setProgress(90)

      const { error: updateError } = await supabase
        .from('documents')
        .update({ 
          status: 'ready',
          page_count: pageCount
        })
        .eq('id', document.id)

      if (updateError) throw updateError

      // Generate embeddings
      setStatus('Generating embeddings...')
      setProgress(95)

      try {
        const embeddingResponse = await fetch('/api/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: document.id })
        })

        if (!embeddingResponse.ok) {
          console.warn('Embeddings generation failed, but document uploaded successfully')
        }
      } catch (err) {
        console.warn('Could not generate embeddings:', err)
      }

      setProgress(100)
      setStatus('Upload complete!')
      
      setTimeout(() => {
        onSuccess()
      }, 1000)

    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload PDF')
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Upload PDF</h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!file ? (
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition"
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Click to select PDF file</p>
              <p className="text-sm text-gray-500">Maximum 10MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-600">{formatBytes(file.size)}</p>
                </div>
                {!uploading && (
                  <button
                    onClick={() => setFile(null)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {uploading && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  {progress < 100 ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  <p className="text-sm text-gray-600">{status}</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {!uploading && (
              <button
                onClick={processPDF}
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:opacity-90 transition"
              >
                Upload PDF
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
