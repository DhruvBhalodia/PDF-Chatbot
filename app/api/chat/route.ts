import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const SYSTEM_PROMPT = `You are a professional assistant specialized in analyzing and answering questions about PDFs. 
You can analyze both text content and images from PDF pages.
Provide comprehensive, detailed answers based on the document content provided.
Be thorough in your analysis while maintaining accuracy.

Rules:
- Use ALL the provided context (text and/or images) to give complete answers
- If images are provided, analyze them carefully for any text, diagrams, or visual information
- When analyzing resumes or documents, provide detailed feedback covering all aspects
- Include specific examples and quotes from the text when relevant
- For evaluation questions, provide structured analysis with strengths, weaknesses, and suggestions
- If the pages appear to be scanned or image-based, mention this and still provide analysis based on what you can see
- Cite sources at the END of your response, not inline
- If asked to analyze quality, provide professional assessment with actionable feedback`

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, message } = await request.json()
    
    console.log('Chat request:', { workspaceId, message })
    
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

    // First check if there are any chunks for documents in this workspace
    const { data: workspaceDocs } = await serviceSupabase
      .from('documents')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('status', 'indexed')
    
    const hasChunks = workspaceDocs && workspaceDocs.length > 0
    
    console.log('Workspace has indexed documents:', hasChunks)
    
    let chunks = null
    let searchError = null
    
    // Only try vector search if indexed documents exist for this workspace
    if (hasChunks) {
      console.log('Attempting vector search for workspace...')
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
        console.log('Vector search result:', chunks?.length || 0, 'chunks found')
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
      console.log('Using fallback: direct page text search')
      const { data: documents } = await serviceSupabase
        .from('documents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .in('status', ['ready', 'indexed'])
      
      console.log('Found documents:', documents?.length || 0, 'in workspace:', workspaceId)
      
      if (documents && documents.length > 0) {
        for (const doc of documents) {
          const { data: pages } = await serviceSupabase
            .from('pages')
            .select('*')
            .eq('document_id', doc.id)
            .limit(3) // Get first 3 pages for context
          
          if (pages && pages.length > 0) {
            for (const page of pages) {
              sources.add(`[${doc.title}, Page ${page.page_number}]`)
              
              // Include both text and image URL for comprehensive analysis
              if (page.text && page.text.length > 10) {
                // Send more text for better context (2000 chars instead of 500)
                const textContent = page.text.substring(0, 2000)
                context += `\n\n---\nSource: ${doc.title}, Page ${page.page_number}\n`
                context += `Text content:\n${textContent}${page.text.length > 2000 ? '...' : ''}\n`
              } else {
                context += `\n\n---\nSource: ${doc.title}, Page ${page.page_number}\n`
                context += `[This page appears to be image-based or scanned content]\n`
              }
              
              // Add image URL for Gemini Vision
              if (page.image_url) {
                context += `Page snapshot available at: ${page.image_url}\n`
              }
            }
          }
        }
      }
    }

    const chatModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })
    
    const prompt = context && context.length > 0 
      ? `${SYSTEM_PROMPT}

Context from documents:
${context}

User Question: ${message}

Please provide a helpful answer based on the context above.`
      : `You are a helpful assistant. The user has uploaded PDFs to this workspace but is asking: "${message}". 
      
Based on the available document titles: ${sources.size > 0 ? Array.from(sources).join(', ') : 'documents in the workspace'}, provide a helpful response. If you cannot answer the specific question, explain what kind of information is available in the documents.`

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
