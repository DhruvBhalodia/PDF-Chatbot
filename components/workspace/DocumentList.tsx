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
      <div className="text-center text-gray-500 text-sm py-4">
        No documents uploaded yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition group"
        >
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {doc.title}
              </h4>
              <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                <span>{doc.page_count} pages</span>
                <span>{formatBytes(doc.byte_size)}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`inline-flex px-1.5 py-0.5 text-xs rounded ${
                  doc.status === 'indexed' 
                    ? 'bg-green-100 text-green-700'
                    : doc.status === 'ready'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {doc.status}
                </span>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
