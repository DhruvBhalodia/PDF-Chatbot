'use client'

import { create } from 'zustand'
import { nanoid } from 'nanoid'
import { ToastMessage } from '@/components/ui/Toast'

interface ToastStore {
  toasts: ToastMessage[]
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => 
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: nanoid() }]
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    })),
  clearToasts: () => set({ toasts: [] })
}))

export function useToast() {
  const { addToast, removeToast, clearToasts, toasts } = useToastStore()

  return {
    toasts,
    toast: {
      success: (title: string, description?: string) =>
        addToast({ type: 'success', title, description }),
      error: (title: string, description?: string) =>
        addToast({ type: 'error', title, description }),
      warning: (title: string, description?: string) =>
        addToast({ type: 'warning', title, description }),
      info: (title: string, description?: string) =>
        addToast({ type: 'info', title, description })
    },
    dismiss: removeToast,
    dismissAll: clearToasts
  }
}
