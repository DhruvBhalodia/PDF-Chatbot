'use client'

import { useState } from 'react'
import { FileText, Plus, MessageSquare, Upload } from 'lucide-react'
import PDFUploader from './SimplePDFUploader'
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
  const [selectedView, setSelectedView] = useState<'chat' | 'documents'>('chat')

  return (
    <div className="flex h-screen">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{workspace.name}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setSelectedView('chat')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              selectedView === 'chat'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Chat
          </button>
          <button
            onClick={() => setSelectedView('documents')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              selectedView === 'documents'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Documents
          </button>
        </div>

        {selectedView === 'documents' && (
          <>
            <div className="p-4">
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

            <div className="flex-1 overflow-y-auto">
              <DocumentList
                documents={documents}
                workspaceId={workspace.id}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedView === 'chat' ? (
          <ChatInterface
            workspace={workspace}
            documents={documents}
            initialMessages={messages}
            userId={userId}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Document Management</h3>
              <p className="text-gray-600">
                Upload and manage your PDF documents here
              </p>
            </div>
          </div>
        )}
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
