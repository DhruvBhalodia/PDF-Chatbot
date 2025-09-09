'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FolderOpen, FileText, Calendar, Trash2, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/utils'

interface Workspace {
  id: string
  name: string
  plan: string
  created_at: string
}

interface WorkspaceListProps {
  workspaces: Workspace[]
  userId: string
}

export default function WorkspaceList({ workspaces, userId }: WorkspaceListProps) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (e: React.MouseEvent, workspaceId: string, workspaceName: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm(`Are you sure you want to delete the workspace "${workspaceName}"? This will permanently delete all documents, chats, and data associated with this workspace.`)) {
      return
    }
    
    setDeleting(workspaceId)
    setError(null)
    
    try {
      const response = await fetch(`/api/workspace/delete?id=${workspaceId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete workspace')
      }
      
      // Success - refresh the page to show updated list
      window.location.reload()
    } catch (error: any) {
      setError(error.message || 'Failed to delete workspace')
      setDeleting(null)
    }
  }
  if (workspaces.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces yet</h3>
        <p className="text-gray-600 mb-6">Create your first workspace to start uploading and chatting with PDFs</p>
        <Link
          href="/dashboard/workspace/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition"
        >
          Create Workspace
        </Link>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workspaces.map((workspace) => (
        <div
          key={workspace.id}
          className="relative bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow group"
        >
          <Link
            href={`/dashboard/workspace/${workspace.id}`}
            className="block"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FolderOpen className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase">{workspace.plan}</span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{workspace.name}</h3>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDistanceToNow(workspace.created_at)}</span>
              </div>
            </div>
          </Link>
          
          <button
            onClick={(e) => handleDelete(e, workspace.id, workspace.name)}
            disabled={deleting === workspace.id}
            className="absolute top-4 right-4 p-2 bg-red-50 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 transition disabled:opacity-50"
            title="Delete workspace"
          >
            {deleting === workspace.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      ))}
      </div>
    </>
  )
}
