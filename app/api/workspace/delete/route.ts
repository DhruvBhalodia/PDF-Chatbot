import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('id')
    
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 })
    }

    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is owner of the workspace
    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!member || member.role !== 'owner') {
      return NextResponse.json({ error: 'Only workspace owner can delete workspace' }, { status: 403 })
    }

    // Get all documents in workspace to delete their storage files
    const { data: documents } = await serviceSupabase
      .from('documents')
      .select('id')
      .eq('workspace_id', workspaceId)

    // Delete storage files for each document
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        try {
          // List all files for this document
          const { data: files } = await serviceSupabase.storage
            .from('pdf-pages')
            .list(doc.id)
          
          if (files && files.length > 0) {
            const filePaths = files.map(file => `${doc.id}/${file.name}`)
            await serviceSupabase.storage
              .from('pdf-pages')
              .remove(filePaths)
          }
        } catch (err) {
          console.error(`Failed to delete storage for document ${doc.id}:`, err)
        }
      }
    }

    // Delete in correct order to respect foreign key constraints
    // 1. Delete chunks (references pages)
    const { error: chunksError } = await serviceSupabase
      .from('chunks')
      .delete()
      .in('page_id', 
        serviceSupabase
          .from('pages')
          .select('id')
          .in('document_id', documents?.map(d => d.id) || [])
      )

    if (chunksError) console.error('Error deleting chunks:', chunksError)

    // 2. Delete pages (references documents)
    const { error: pagesError } = await serviceSupabase
      .from('pages')
      .delete()
      .in('document_id', documents?.map(d => d.id) || [])

    if (pagesError) console.error('Error deleting pages:', pagesError)

    // 3. Delete messages (references workspace)
    const { error: messagesError } = await serviceSupabase
      .from('messages')
      .delete()
      .eq('workspace_id', workspaceId)

    if (messagesError) console.error('Error deleting messages:', messagesError)

    // 4. Delete documents (references workspace)
    const { error: documentsError } = await serviceSupabase
      .from('documents')
      .delete()
      .eq('workspace_id', workspaceId)

    if (documentsError) console.error('Error deleting documents:', documentsError)

    // 5. Delete workspace members
    const { error: membersError } = await serviceSupabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)

    if (membersError) console.error('Error deleting members:', membersError)

    // 6. Finally delete the workspace
    const { error: workspaceError } = await serviceSupabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId)

    if (workspaceError) {
      throw new Error('Failed to delete workspace')
    }

    return NextResponse.json({ success: true, message: 'Workspace deleted successfully' })

  } catch (error: any) {
    console.error('Delete workspace error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete workspace' },
      { status: 500 }
    )
  }
}
