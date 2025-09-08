'use client'

import Link from 'next/link'
import { FolderOpen, FileText, Calendar, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/utils'

interface Workspace {
  id: string
  name: string
  plan: string
  created_at: string
}

interface WorkspaceListProps {
  workspaces: Workspace[]
}

export default function WorkspaceList({ workspaces }: WorkspaceListProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workspaces.map((workspace) => (
        <Link
          key={workspace.id}
          href={`/dashboard/workspace/${workspace.id}`}
          className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
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
      ))}
    </div>
  )
}
