'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Loader2, FileText, CheckCircle } from 'lucide-react'
import { generateFingerprint, formatBytes } from '@/lib/utils'
import * as pdfjsLib from 'pdfjs-dist'

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
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

  const extractTextFromPDF = async (file: File): Promise<{ text: string, pageCount: number }> => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const pageCount = pdf.numPages
    let fullText = ''

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      fullText += pageText + '\n\n'
    }

    return { text: fullText.trim(), pageCount }
  }

  const processPDF = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError('')

    try {
      setStatus('Extracting text from PDF...')
      setProgress(5)
      
      // Extract text from PDF
      const { text: extractedText, pageCount } = await extractTextFromPDF(file)
      
      if (!extractedText || extractedText.length < 10) {
        throw new Error('Could not extract text from PDF. The document may be empty or contain only images.')
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

      // Upload the PDF file directly
      setStatus('Uploading PDF...')
      setProgress(30)
      
      const pdfPath = `${document.id}/original.pdf`
      const { error: uploadError } = await supabase.storage
        .from('pdf-pages')
        .upload(pdfPath, file, {
          contentType: 'application/pdf',
          upsert: false
        })

      if (uploadError && !uploadError.message.includes('already exists')) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pdf-pages')
        .getPublicUrl(pdfPath)

      // Create page record with extracted text
      setStatus('Saving extracted text...')
      setProgress(70)
      
      const { error: pageError } = await supabase
        .from('pages')
        .insert({
          document_id: document.id,
          page_number: 1,
          image_url: publicUrl,
          text: extractedText,
          tokens: extractedText.split(' ').length,
          fingerprint64: generateFingerprint(extractedText)
        })

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
