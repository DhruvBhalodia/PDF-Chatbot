import { createClient } from '@/lib/supabase/server'
import WorkspaceList from '@/components/dashboard/WorkspaceList'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Workspaces</h1>
            <p className="text-gray-600 mt-2">Select a workspace to start chatting with your PDFs</p>
          </div>
          <Link
            href="/dashboard/workspace/new"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition"
          >
            <Plus className="w-5 h-5" />
            New Workspace
          </Link>
        </div>

        <WorkspaceList workspaces={workspaces || []} />
      </div>
    </div>
  )
}
