const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugContent() {
  console.log('🔍 Debugging PDF Content...\n')
  
  // Check documents
  console.log('📄 Documents:')
  const { data: documents, error: docError } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (docError) {
    console.error('Error fetching documents:', docError)
  } else if (documents && documents.length > 0) {
    documents.forEach(doc => {
      console.log(`  - ${doc.title} (${doc.status}) - Workspace: ${doc.workspace_id}`)
    })
  } else {
    console.log('  No documents found')
  }
  
  // Check pages and their text content
  console.log('\n📑 Pages with text:')
  const { data: pages, error: pageError } = await supabase
    .from('pages')
    .select('id, document_id, page_number, text')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (pageError) {
    console.error('Error fetching pages:', pageError)
  } else if (pages && pages.length > 0) {
    pages.forEach(page => {
      const textPreview = page.text ? page.text.substring(0, 100) : 'NO TEXT'
      console.log(`  - Page ${page.page_number}: ${textPreview}...`)
      console.log(`    Text length: ${page.text ? page.text.length : 0} characters`)
    })
  } else {
    console.log('  No pages found')
  }
  
  // Check chunks
  console.log('\n🔢 Embeddings/Chunks:')
  const { data: chunks, error: chunkError } = await supabase
    .from('chunks')
    .select('id, page_id, text')
    .limit(5)
  
  if (chunkError) {
    console.error('Error fetching chunks:', chunkError)
  } else if (chunks && chunks.length > 0) {
    console.log(`  Found ${chunks.length} chunks with embeddings`)
  } else {
    console.log('  No chunks/embeddings found')
  }
  
  // Check workspaces
  console.log('\n🏢 Workspaces:')
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('id, name')
    .limit(5)
  
  if (wsError) {
    console.error('Error fetching workspaces:', wsError)
  } else if (workspaces && workspaces.length > 0) {
    workspaces.forEach(ws => {
      console.log(`  - ${ws.name} (${ws.id})`)
    })
  } else {
    console.log('  No workspaces found')
  }
  
  console.log('\n💡 Debugging Tips:')
  console.log('1. If pages have "NO TEXT", the PDF text extraction failed')
  console.log('2. If no chunks exist, embeddings were not generated')
  console.log('3. Make sure document status is "ready" or "indexed"')
  console.log('4. Check that workspace IDs match between documents and your current workspace')
}

debugContent().catch(console.error)
