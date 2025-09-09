const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Replace this with your actual workspace ID
const WORKSPACE_ID = '39165702-e99e-4e6b-9eee-0c59747b0815' // Resume workspace

async function testWorkspace() {
  console.log(`🔍 Testing workspace: ${WORKSPACE_ID}\n`)
  
  // Check documents in this workspace
  console.log('📄 Documents in workspace:')
  const { data: documents, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('workspace_id', WORKSPACE_ID)
  
  if (docError) {
    console.error('Error:', docError)
  } else if (documents && documents.length > 0) {
    documents.forEach(doc => {
      console.log(`  - ${doc.title} (Status: ${doc.status}, ID: ${doc.id})`)
    })
    
    // Check pages for each document
    for (const doc of documents) {
      console.log(`\n📑 Pages for ${doc.title}:`)
      const { data: pages } = await supabase
        .from('pages')
        .select('page_number, text')
        .eq('document_id', doc.id)
      
      if (pages && pages.length > 0) {
        pages.forEach(page => {
          const preview = page.text ? page.text.substring(0, 100) : 'NO TEXT'
          console.log(`    Page ${page.page_number}: ${preview}...`)
        })
      }
    }
  } else {
    console.log('  No documents found in this workspace!')
  }
  
  // Test vector search manually
  console.log('\n🔍 Testing vector search:')
  try {
    // Create a simple embedding (all zeros for testing)
    const testEmbedding = new Array(768).fill(0)
    
    const { data, error } = await supabase.rpc('match_chunks', {
      query_embedding: testEmbedding,
      workspace_id: WORKSPACE_ID,
      match_threshold: 0.0, // Very low threshold to get any results
      match_count: 5
    })
    
    if (error) {
      console.error('Vector search error:', error)
    } else if (data && data.length > 0) {
      console.log(`  Found ${data.length} chunks`)
      data.forEach(chunk => {
        console.log(`    - ${chunk.text.substring(0, 50)}...`)
      })
    } else {
      console.log('  No chunks found via vector search')
    }
  } catch (err) {
    console.error('Vector search failed:', err.message)
  }
}

testWorkspace().catch(console.error)
