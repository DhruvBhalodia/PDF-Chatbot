import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WorkspaceList from '@/components/dashboard/WorkspaceList'

export default async function WorkspacesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select(`
      *,
      workspace_members!inner(role)
    `)
    .eq('workspace_members.user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Workspaces</h1>
        <p className="text-gray-600 mt-2">Manage and access all your PDF workspaces</p>
      </div>
      
      <WorkspaceList 
        workspaces={workspaces || []} 
        userId={user.id} 
      />
    </div>
  )
}
