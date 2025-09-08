import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const SYSTEM_PROMPT = `You are a professional assistant specialized in answering questions about PDFs. 
Use only the provided context from the documents to answer questions. 
When unsure, say you don't know. Prefer precise, cited answers.
Cite sources using [Document Name, Page X] format.
Optimize for correctness over verbosity.

Rules:
- Use retrieved chunks only; do not hallucinate
- Aggregate across documents when needed
- Show concise bullet points when listing
- Include short rationale for conflicts and choose the most authoritative source
- If no relevant context is found, politely say you cannot find that information in the documents`

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

    const { data: member } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

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

    // First check if there are any documents with embeddings
    const { data: hasEmbeddings } = await serviceSupabase
      .from('chunks')
      .select('id', { count: 'exact', head: true })
      .limit(1)
    
    let chunks = null
    let searchError = null
    
    // Only try vector search if embeddings exist
    if (hasEmbeddings !== null) {
      try {
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
        const embeddingResult = await model.embedContent(message)
        const queryEmbedding = embeddingResult.embedding.values

        const result = await serviceSupabase.rpc(
          'match_chunks',
          {
            query_embedding: queryEmbedding,
            workspace_id: workspaceId,
            match_threshold: 0.7,
            match_count: 10
          }
        )
        chunks = result.data
        searchError = result.error
      } catch (err) {
        console.error('Vector search error:', err)
        // Continue without vector search
      }
    }

    if (searchError) {
      console.error('Search error details:', searchError)
      // Don't throw, continue with fallback
    }

    let context = ''
    const sources = new Set()

    if (chunks && chunks.length > 0) {
      // Use vector search results
      for (const chunk of chunks) {
        const { data: page } = await serviceSupabase
          .from('pages')
          .select('page_number, document_id')
          .eq('id', chunk.page_id)
          .single()

        if (page) {
          const { data: doc } = await serviceSupabase
            .from('documents')
            .select('title')
            .eq('id', page.document_id)
            .single()

          if (doc) {
            sources.add(`[${doc.title}, Page ${page.page_number}]`)
            context += `\n\n---\nSource: ${doc.title}, Page ${page.page_number}\n${chunk.text}`
          }
        }
      }
    } else {
      // Fallback: Use direct page text if no embeddings
      const { data: documents } = await serviceSupabase
        .from('documents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('status', 'ready')
      
      if (documents && documents.length > 0) {
        for (const doc of documents) {
          const { data: pages } = await serviceSupabase
            .from('pages')
            .select('*')
            .eq('document_id', doc.id)
            .limit(3) // Get first 3 pages for context
          
          if (pages && pages.length > 0) {
            for (const page of pages) {
              if (page.text && page.text.length > 10) {
                sources.add(`[${doc.title}, Page ${page.page_number}]`)
                const preview = page.text.substring(0, 500)
                context += `\n\n---\nSource: ${doc.title}, Page ${page.page_number}\n${preview}...`
              }
            }
          }
        }
      }
    }

    const chatModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const prompt = `${SYSTEM_PROMPT}

Context from documents:
${context || 'No relevant context found in the uploaded documents.'}

User Question: ${message}

Please provide a helpful answer based on the context above. If the context doesn't contain relevant information, say so clearly.`

    const result = await chatModel.generateContent(prompt)
    const response = result.response.text()

    const finalResponse = sources.size > 0 
      ? `${response}\n\n**Sources:** ${Array.from(sources).join(', ')}`
      : response

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
      content: { text: finalResponse },
      token_count: finalResponse.split(' ').length
    })

    await serviceSupabase.from('usage_daily').upsert({
      yyyymmdd: today,
      user_id: user.id,
      api_calls: (usage?.api_calls || 0) + 1
    }, {
      onConflict: 'yyyymmdd,user_id'
    })

    return NextResponse.json({ response: finalResponse })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process message' },
      { status: 500 }
    )
  }
}
