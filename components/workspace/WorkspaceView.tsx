'use client'

import { useState } from 'react'
import { FileText, Plus } from 'lucide-react'
import PDFUploader from './PDFUploader'
import ChatInterface from './ChatInterface'
import DocumentList from './DocumentList'

interface WorkspaceViewProps {
  workspace: any
  documents: any[]
  messages: any[]
  userId: string
}

export default function WorkspaceView({ workspace, documents, messages, userId }: WorkspaceViewProps) {
  const [showUploader, setShowUploader] = useState(false)

  return (
    <div className="flex h-screen">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{workspace.name}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Documents
            </h3>
          </div>
          <button
            onClick={() => setShowUploader(true)}
            disabled={documents.length >= 5}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Upload PDF
          </button>
          {documents.length >= 5 && (
            <p className="text-xs text-red-600 mt-2 text-center">
              Maximum 5 PDFs per workspace (Free plan)
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <DocumentList
            documents={documents}
            workspaceId={workspace.id}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        <ChatInterface
          workspace={workspace}
          documents={documents}
          initialMessages={messages}
          userId={userId}
        />
      </div>

      {showUploader && (
        <PDFUploader
          workspaceId={workspace.id}
          onClose={() => setShowUploader(false)}
          onSuccess={() => {
            setShowUploader(false)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}
