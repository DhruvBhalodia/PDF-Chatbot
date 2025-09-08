# Architecture (Cloud-First)

## Components
- Web + API: Next.js (App Router) on Vercel
- Identity: Supabase Auth
- Database: Supabase Postgres + pgvector
- Object Storage: Supabase Storage (bucket: pdf-pages)
- LLM + Embeddings: Google AI Studio (Gemini)
- Client Parsing/Rendering: pdf.js in the browser

## High-Level Flow
1) User uploads one or more PDFs to a workspace
2) Client renders page snapshots and extracts text (pdf.js)
3) Client uploads images to Supabase Storage and metadata/text to DB
4) API route chunks text, embeds with Gemini, writes vectors to pgvector
5) On chat, API retrieves top-k chunks, composes a PDF-specific prompt, calls Gemini, streams response

## Data Model (Supabase)
- users
  - id, email, name, created_at
- workspaces
  - id, owner_id, name, plan, created_at
- workspace_members
  - workspace_id, user_id, role, created_at
- documents
  - id, workspace_id, title, byte_size, page_count, sha256, status, created_at
- pages
  - id, document_id, page_number, image_url, text, tokens, fingerprint64, created_at
- chunks
  - id, page_id, seq, text, embedding vector, created_at
- messages
  - id, workspace_id, user_id, role, content_json, token_count, created_at
- usage_daily
  - yyyymmdd, user_id, api_calls, tokens_in, tokens_out, created_at

Notes
- pgvector enabled on database; embedding column uses the model’s dimension
- RLS policies ensure user can only access rows for workspaces they belong to

## Storage
- Bucket: pdf-pages
  - Path: {workspace_id}/{document_id}/page-{n}.png
  - Public read for signed URLs only; uploads via authenticated client

## API Routes (Vercel)
- POST /api/workspaces
- GET  /api/workspaces
- POST /api/documents/init-upload
  - Returns storage targets and DB placeholders
- POST /api/documents/ingest
  - Finalize: chunk text, embed, upsert vectors, set document status=ready
- POST /api/chat (SSE streaming)
  - Input: workspace_id, message
  - Steps: rate-limit -> retrieve top-k -> compose prompt -> Gemini -> stream
- GET  /api/messages?workspace_id=...

## Ingestion Pipeline
- Client
  - Parse PDF via pdf.js
  - For each page: render to PNG/JPEG, extract text
  - Upload image to Storage; send text + metadata to /init-upload or directly to DB via RPC
- Server
  - Chunk text per page (token-aware)
  - Embed with Gemini text-embedding-004
  - Upsert chunks with vectors into pgvector
  - Compute 64-bit fingerprint for dedup; mark or skip similar pages

## Retrieval and Prompting
- Vector search: cosine distance over pgvector filtered by workspace_id
- Context builder: merge top chunks, attach page refs and snapshot URLs
- Prompt prefix: PDF QA specialist guidelines; factual, cited, concise
- Gemini model: gemini-1.5-pro or gemini-1.5-flash depending on latency/cost

## Security & RLS
- Tables scoped by workspace; membership table used in USING policies
- Service role key used server-side only
- Signed URLs for images; short TTL

## Rate Limiting & Quotas
- usage_daily table for counters
- Limits enforced per user on:
  - Workspaces, documents, pages, bytes, chats/day

## Observability
- Structured JSON logs from API routes
- Simple admin queries in Supabase Studio

## Deployment Targets
- Vercel for Next.js site and API routes
- Supabase project with SQL migrations for schema, RLS, and policies
