'use client'

import { FileText, Trash2, Calendar, Hash } from 'lucide-react'
import { formatBytes, formatDistanceToNow } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface DocumentListProps {
  documents: any[]
  workspaceId: string
}

export default function DocumentList({ documents, workspaceId }: DocumentListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    
    setDeleting(documentId)
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (error) throw error
      window.location.reload()
    } catch (err) {
      console.error('Delete error:', err)
      setDeleting(null)
    }
  }

  if (documents.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No documents uploaded yet
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 truncate">
                  {doc.title}
                </h4>
                <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {doc.page_count} pages
                  </span>
                  <span>{formatBytes(doc.byte_size)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(doc.created_at)}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDelete(doc.id)}
              disabled={deleting === doc.id}
              className="p-1 hover:bg-red-100 rounded transition disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
          <div className="mt-2">
            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
              doc.status === 'ready' 
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {doc.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
