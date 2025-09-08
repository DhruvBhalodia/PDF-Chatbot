import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, message } = await request.json()
    
    if (!workspaceId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check workspace access
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single()

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check daily usage limit
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const { data: usage } = await supabase
      .from('usage_daily')
      .select('api_calls')
      .eq('yyyymmdd', today)
      .eq('user_id', user.id)
      .single()

    if (usage && usage.api_calls >= 100) {
      return NextResponse.json({ 
        error: 'Daily limit reached (100 messages). Please try again tomorrow.' 
      }, { status: 429 })
    }

    // Get all documents in workspace for context
    const { data: documents } = await serviceSupabase
      .from('documents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'ready')

    let context = ''
    if (documents && documents.length > 0) {
      context = `You have access to the following PDF documents in this workspace:\n`
      for (const doc of documents) {
        context += `- ${doc.title} (${doc.page_count} pages)\n`
      }
      context += `\nPlease answer the user's question based on these documents. If you don't have specific information about the content, let them know you have the document but need more specific text extraction to answer detailed questions.`
    } else {
      context = 'No documents have been uploaded to this workspace yet.'
    }

    const chatModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const prompt = `You are a helpful assistant for a PDF chatbot application.

Context: ${context}

User Question: ${message}

Please provide a helpful response. If the user is asking about specific content from the PDFs, explain that the documents are uploaded but detailed text extraction is still being implemented.`

    const result = await chatModel.generateContent(prompt)
    const response = result.response.text()

    // Save messages
    await serviceSupabase.from('messages').insert({
      workspace_id: workspaceId,
      user_id: user.id,
      role: 'user',
      content: { text: message },
      token_count: message.split(' ').length
    })

    await serviceSupabase.from('messages').insert({
      workspace_id: workspaceId,
      user_id: null,
      role: 'assistant',
      content: { text: response },
      token_count: response.split(' ').length
    })

    // Update usage
    await serviceSupabase.from('usage_daily').upsert({
      yyyymmdd: today,
      user_id: user.id,
      api_calls: (usage?.api_calls || 0) + 1
    }, {
      onConflict: 'yyyymmdd,user_id'
    })

    return NextResponse.json({ response })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process message' },
      { status: 500 }
    )
  }
}
