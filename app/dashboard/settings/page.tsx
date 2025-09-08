'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Mail, Calendar, Database, AlertCircle, Check } from 'lucide-react'
import { formatDate, formatBytes } from '@/lib/utils'
import { useToast } from '@/hooks/useToast'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      
      setUser(user)
      setDisplayName(user.user_metadata?.full_name || '')
      
      const { data: workspaces } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)
      
      const { data: documents } = await supabase
        .from('documents')
        .select('byte_size')
        .in('workspace_id', workspaces?.map(w => w.workspace_id) || [])
      
      const totalSize = documents?.reduce((sum, doc) => sum + (doc.byte_size || 0), 0) || 0
      
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
      const { data: usage } = await supabase
        .from('usage_daily')
        .select('api_calls')
        .eq('yyyymmdd', today)
        .eq('user_id', user.id)
        .single()
      
      setStats({
        workspaceCount: workspaces?.length || 0,
        documentCount: documents?.length || 0,
        totalStorage: totalSize,
        apiCallsToday: usage?.api_calls || 0
      })
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!user) return
    
    setUpdating(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName }
      })
      
      if (error) throw error
      
      showToast('Profile updated successfully', 'success')
      await loadUserData()
    } catch (error: any) {
      showToast(error.message || 'Failed to update profile', 'error')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account and preferences</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{user?.email}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Created
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{formatDate(user?.created_at)}</span>
              </div>
            </div>
            
            <button
              onClick={handleUpdateProfile}
              disabled={updating}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Statistics</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-primary" />
                <span className="text-sm text-gray-600">Workspaces</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{stats?.workspaceCount || 0}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-primary" />
                <span className="text-sm text-gray-600">Documents</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{stats?.documentCount || 0}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-primary" />
                <span className="text-sm text-gray-600">Storage Used</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900">
                {formatBytes(stats?.totalStorage || 0)}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-primary" />
                <span className="text-sm text-gray-600">API Calls Today</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.apiCallsToday || 0}/100
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Limits</h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">100 API calls per day</p>
                <p className="text-sm text-gray-600">Rate limit for free tier</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">10MB max file size</p>
                <p className="text-sm text-gray-600">Maximum PDF size per upload</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Unlimited workspaces</p>
                <p className="text-sm text-gray-600">Create as many workspaces as needed</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">Free Tier Account</p>
              <p className="text-sm text-yellow-800 mt-1">
                You're using the free tier with limited API calls. Upgrade for unlimited access and additional features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
