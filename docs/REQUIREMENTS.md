# PDF Chatbot (Cloud-First) — Requirements

## Vision
A professional, cloud-native PDF RAG chatbot that lets users upload multiple PDFs into isolated workspaces and chat with them. It extracts page text and creates visual snapshots for image-heavy pages, builds embeddings with Gemini, retrieves the most relevant context, and answers with high accuracy. The system keeps full, persistent memory per workspace (not session-based), detects similar/duplicate content within a workspace, and operates entirely on cloud services with zero local dependencies.

## Cloud Stack (Free Tier)
- Hosting/API: Vercel (Next.js App Router + API Routes)
- Auth/DB/Vector/Storage: Supabase (Auth, Postgres + pgvector, Storage) with RLS
- LLM + Embeddings: Google AI Studio (Gemini 1.5 for chat; text-embedding-004 for embeddings)
- Client PDF parsing/render: pdf.js in-browser (page snapshots via canvas)

## Functional Requirements
1. Authentication and Users
   - Email OTP or OAuth via Supabase Auth
   - Secure JWT-based sessions usable in serverless API routes
2. Workspaces
   - Create, list, rename, delete workspaces
   - Per-workspace isolation via Row Level Security (RLS)
   - Optional members/roles (owner, editor, reader)
3. PDF Upload & Processing
   - Multiple PDFs per workspace
   - Client-side extraction:
     - Render each page to a PNG/JPEG snapshot (pdf.js + canvas)
     - Extract per-page text content with pdf.js text layer
   - Upload snapshots to Supabase Storage and text to DB
   - Optional client-side OCR for image-only pages (Tesseract.js toggle)
   - Server-side ingestion pipeline:
     - Chunk per-page text
     - Generate text embeddings via Gemini text-embedding-004
     - Upsert vectors into pgvector table scoped to workspace
     - Compute lightweight fingerprint to detect similar/duplicate pages
4. Retrieval-Augmented Generation (RAG)
   - Top-k similarity search over workspace vectors
   - Context window builder merges text chunks and references to page snapshots
   - Specialized, task-specific prompt prefix for PDF QA
   - Gemini 1.5 model for generation with streaming responses
5. Chat Experience
   - UI similar to ChatGPT/Gemini with side panel of workspaces and documents
   - Persistent chat history per workspace (not per session)
   - Message threading and attachments (images from snapshots when needed)
   - Markdown rendering with code blocks
   - Source citations with page numbers and snapshot links
6. Similarity/Duplicate Detection
   - Detect highly similar pages within the same workspace
   - Option to auto-skip embedding duplicates to save quota
   - Show dedup summary to user
7. Limits and Governance (Free Tier Friendly)
   - Max workspaces per user (default 3)
   - Max PDFs per workspace (default 5)
   - Max file size per PDF (default 10 MB)
   - Max pages per PDF (default 50)
   - Daily API calls per user (default 100)
   - Storage quota per user (default 100 MB)
   - Configurable via environment variables and DB config table
8. Administration
   - Basic usage dashboard: counts, storage usage, last activity
   - Soft-delete and background cleanup hooks

## Non-Functional Requirements
- Security: RLS everywhere, strict bucket policies, server-held Gemini key
- Performance: ingestion < 30s per 50-page PDF under typical load; chat TTFB < 2s
- Reliability: idempotent ingestion; resumable uploads; retries on transient errors
- Observability: structured logs for ingestion and chat; minimal metrics via DB tables
- Accessibility: keyboard navigation and high-contrast theme
- Internationalization-ready UI

## Acceptance Criteria
- All services run in the cloud (Vercel + Supabase + Gemini). No local state.
- New user can sign up, create workspace, upload PDFs, see snapshots, chat with persistent memory.
- RAG uses embeddings and returns accurate, cited answers.
- Quotas enforced; descriptive errors when limits are hit.
- Deployable on free tiers with documented setup steps.
