import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { chunkText } from '@/lib/utils'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json()
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('*')
      .eq('document_id', documentId)
      .order('page_number')

    if (pagesError) throw pagesError
    if (!pages || pages.length === 0) {
      return NextResponse.json({ error: 'No pages found' }, { status: 404 })
    }

    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
    const chunks = []

    for (const page of pages) {
      if (!page.text || page.text.trim().length === 0) continue

      const pageChunks = chunkText(page.text, 800, 100)
      
      for (let i = 0; i < pageChunks.length; i++) {
        const chunkText = pageChunks[i]
        
        try {
          const result = await model.embedContent(chunkText)
          const embedding = result.embedding.values

          chunks.push({
            page_id: page.id,
            seq: i,
            text: chunkText,
            embedding
          })
        } catch (err) {
          console.error('Embedding error:', err)
        }
      }
    }

    if (chunks.length > 0) {
      const { error: insertError } = await supabase
        .from('chunks')
        .insert(chunks)

      if (insertError) throw insertError
    }

    const { error: updateError } = await supabase
      .from('documents')
      .update({ status: 'indexed' })
      .eq('id', documentId)

    if (updateError) throw updateError

    return NextResponse.json({ 
      success: true, 
      chunks: chunks.length 
    })

  } catch (error: any) {
    console.error('Embeddings API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate embeddings' },
      { status: 500 }
    )
  }
}
