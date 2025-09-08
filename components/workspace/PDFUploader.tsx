'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Loader2, FileText, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatBytes, generateFingerprint } from '@/lib/utils'

interface PDFUploaderProps {
  workspaceId: string
  onClose: () => void
  onSuccess: () => void
}

export default function PDFUploader({ workspaceId, onClose, onSuccess }: PDFUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
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

  const processPDF = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError('')

    try {
      setStatus('Loading PDF library...')
      
      // Dynamic import of PDF.js to avoid worker issues
      const pdfjsLib = await import('pdfjs-dist')
      
      // Use a simpler worker setup
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
      
      setStatus('Creating document record...')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: fileBuffer }).promise
      const numPages = pdf.numPages

      if (numPages > 50) {
        throw new Error('PDF must have 50 pages or less (Free plan limit)')
      }

      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          workspace_id: workspaceId,
          title: file.name,
          byte_size: file.size,
          page_count: numPages,
          status: 'processing'
        })
        .select()
        .single()

      if (docError) throw docError

      setStatus('Processing pages...')
      const pages = []

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        setProgress(Math.round((pageNum / numPages) * 50))
        
        const page = await pdf.getPage(pageNum)
        
        const viewport = page.getViewport({ scale: 2.0 })
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')!
        canvas.height = viewport.height
        canvas.width = viewport.width

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85)
        })

        const textContent = await page.getTextContent()
        const text = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .trim()

        const imageName = `${document.id}/page-${pageNum}.jpg`
        setStatus(`Uploading page ${pageNum}/${numPages}...`)
        
        const { error: uploadError } = await supabase.storage
          .from('pdf-pages')
          .upload(imageName, blob, {
            contentType: 'image/jpeg',
            upsert: false
          })

        if (uploadError && !uploadError.message.includes('already exists')) {
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('pdf-pages')
          .getPublicUrl(imageName)

        pages.push({
          document_id: document.id,
          page_number: pageNum,
          image_url: publicUrl,
          text: text || '',
          tokens: text ? text.split(' ').length : 0,
          fingerprint64: generateFingerprint(text || `page-${pageNum}`)
        })
      }

      setStatus('Saving page data...')
      setProgress(75)

      const { error: pagesError } = await supabase
        .from('pages')
        .insert(pages)

      if (pagesError) throw pagesError

      setStatus('Finalizing...')
      setProgress(90)

      const { error: updateError } = await supabase
        .from('documents')
        .update({ status: 'ready' })
        .eq('id', document.id)

      if (updateError) throw updateError

      setStatus('Generating embeddings...')
      setProgress(95)

      const embeddingResponse = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: document.id })
      })

      if (!embeddingResponse.ok) {
        console.error('Failed to generate embeddings')
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
              <p className="text-sm text-gray-500">Maximum 10MB, 50 pages</p>
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
                Upload and Process
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
