import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import WorkspaceView from '@/components/workspace/WorkspaceView'

interface PageProps {
  params: {
    id: string
  }
}

export default async function WorkspacePage({ params }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return notFound()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!workspace) return notFound()

  const { data: isMember } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!isMember) return notFound()

  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('workspace_id', params.id)
    .order('created_at', { ascending: false })

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('workspace_id', params.id)
    .order('created_at', { ascending: true })
    .limit(50)

  return (
    <WorkspaceView
      workspace={workspace}
      documents={documents || []}
      messages={messages || []}
      userId={user.id}
    />
  )
}
