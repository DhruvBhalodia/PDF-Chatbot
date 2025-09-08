'use client'

import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
}

interface ToastProps {
  message: ToastMessage
  onClose: (id: string) => void
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
}

const colors = {
  success: 'bg-green-50 text-green-900 border-green-200',
  error: 'bg-red-50 text-red-900 border-red-200',
  warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
  info: 'bg-blue-50 text-blue-900 border-blue-200'
}

const iconColors = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600'
}

export function Toast({ message, onClose }: ToastProps) {
  const Icon = icons[message.type]
  
  useEffect(() => {
    if (message.duration !== 0) {
      const timer = setTimeout(() => {
        onClose(message.id)
      }, message.duration || 5000)
      
      return () => clearTimeout(timer)
    }
  }, [message.id, message.duration, onClose])

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${colors[message.type]} shadow-lg`}>
      <Icon className={`w-5 h-5 mt-0.5 ${iconColors[message.type]}`} />
      <div className="flex-1">
        <p className="font-medium">{message.title}</p>
        {message.description && (
          <p className="text-sm opacity-90 mt-1">{message.description}</p>
        )}
      </div>
      <button
        onClick={() => onClose(message.id)}
        className="p-1 hover:bg-black/10 rounded transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts }: { toasts: ToastMessage[] }) {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  useEffect(() => {
    setMessages(toasts)
  }, [toasts])

  const handleClose = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id))
  }

  if (messages.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {messages.map(message => (
        <Toast key={message.id} message={message} onClose={handleClose} />
      ))}
    </div>
  )
}
