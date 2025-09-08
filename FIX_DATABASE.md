# Database Fix Instructions

If you're getting errors with the chat functionality, follow these steps:

## Quick Fix

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `scripts/fix-database.sql`
4. Click "Run" to execute the SQL

This will:
- Ensure pgvector extension is enabled
- Fix the match_chunks function
- Set up proper permissions

## Alternative: Use Simple Chat

If the vector search is still not working, the app will automatically fall back to using direct text search from your PDFs. This means:
- Chat will still work
- Responses will be based on the first few pages of each document
- Once you generate embeddings, vector search will automatically be used

## To Generate Embeddings

After uploading PDFs:
1. The system will attempt to generate embeddings automatically
2. If this fails, you can manually trigger it by re-uploading the document
3. Check the document status - it should change from "ready" to "indexed" when embeddings are generated

## Verify Everything Works

Run the verification script:
```bash
npm run verify
```

This will check your database setup and report any issues.
