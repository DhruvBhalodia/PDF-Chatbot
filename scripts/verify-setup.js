const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifySetup() {
  console.log('🔍 Verifying PDF Chatbot Setup...\n')
  
  let errors = []
  let warnings = []
  
  // Check database tables
  console.log('📊 Checking database tables...')
  const tables = ['workspaces', 'documents', 'pages', 'chunks', 'messages', 'workspace_members']
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
      if (error) {
        errors.push(`Table ${table}: ${error.message}`)
      } else {
        console.log(`✅ Table ${table} exists`)
      }
    } catch (err) {
      errors.push(`Table ${table}: ${err.message}`)
    }
  }
  
  // Check RPC functions
  console.log('\n📡 Checking RPC functions...')
  try {
    const { error } = await supabase.rpc('match_chunks', {
      query_embedding: new Array(768).fill(0),
      workspace_id: '00000000-0000-0000-0000-000000000000',
      match_threshold: 0.7,
      match_count: 5
    })
    
    if (error && !error.message.includes('No rows')) {
      warnings.push(`RPC match_chunks: ${error.message}`)
    } else {
      console.log('✅ RPC function match_chunks exists')
    }
  } catch (err) {
    errors.push(`RPC match_chunks: ${err.message}`)
  }
  
  // Check storage buckets
  console.log('\n📦 Checking storage buckets...')
  try {
    const { data, error } = await supabase.storage.listBuckets()
    if (error) {
      errors.push(`Storage: ${error.message}`)
    } else {
      const hasPdfPages = data.some(b => b.name === 'pdf-pages')
      if (hasPdfPages) {
        console.log('✅ Storage bucket pdf-pages exists')
      } else {
        errors.push('Storage bucket pdf-pages not found')
      }
    }
  } catch (err) {
    errors.push(`Storage: ${err.message}`)
  }
  
  // Check environment variables
  console.log('\n🔐 Checking environment variables...')
  const envVars = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'GEMINI_API_KEY': process.env.GEMINI_API_KEY
  }
  
  for (const [key, value] of Object.entries(envVars)) {
    if (!value) {
      errors.push(`Missing environment variable: ${key}`)
    } else {
      console.log(`✅ ${key} is set`)
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📋 VERIFICATION SUMMARY')
  console.log('='.repeat(50))
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All checks passed! Your PDF Chatbot is ready to use.')
  } else {
    if (errors.length > 0) {
      console.log('\n❌ ERRORS (must fix):')
      errors.forEach(e => console.log(`  - ${e}`))
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (should review):')
      warnings.forEach(w => console.log(`  - ${w}`))
    }
  }
  
  console.log('\n📝 Next steps:')
  console.log('1. Run: npm run dev')
  console.log('2. Open: http://localhost:3000')
  console.log('3. Sign up/Login with email OTP')
  console.log('4. Create a workspace')
  console.log('5. Upload a PDF')
  console.log('6. Start chatting with your documents!')
}

verifySetup().catch(console.error)
