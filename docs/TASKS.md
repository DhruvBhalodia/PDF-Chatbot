# Tasks and Milestones

## M0 — Planning (you are here)
- Deliver cloud-first requirements, architecture, prompt design
- Approval gate

## M1 — Scaffolding
- Next.js (TS, App Router, Tailwind) project on Vercel
- Supabase client integration
- Basic auth (email OTP)
- Workspace CRUD UI and API

## M2 — Schema & RLS
- Create tables, indexes, and pgvector
- Add RLS policies for workspace isolation
- Seed minimal roles and limits config

## M3 — Client Ingestion
- pdf.js integration
- Page rendering to PNG/JPEG
- Text extraction per page
- Storage uploads + DB metadata writes
- Document status lifecycle

## M4 — Embedding & Vectorization
- Chunking strategy (by tokens with overlap)
- Gemini text-embedding-004 integration
- Upsert vectors to pgvector
- Dedup via 64-bit fingerprint

## M5 — RAG & Chat
- Top-k vector retrieval filtered by workspace
- Context builder + citations
- Gemini 1.5 streaming responses
- Message persistence and long-term memory

## M6 — Limits & Governance
- Enforce quotas for uploads and chats
- Usage counters and error surfaces
- Admin summary page

## M7 — Polish & Deploy
- Loading states, error UX, responsive UI
- Finalize docs and deployment steps
- Approval gate

## Deliverables per Milestone
- Working code, minimal and comment-free per user rules
- Git commits at each checkpoint
