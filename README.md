# PDF Chatbot (Cloud-First)

Cloud-native PDF RAG chatbot: upload PDFs into isolated workspaces, render page snapshots, embed text with Gemini, retrieve context, and chat with persistent memory.

- Hosting/API: Vercel (Next.js)
- Auth/DB/Vector/Storage: Supabase
- LLM/Embeddings: Gemini

See docs/ for requirements, architecture, tasks, and prompt design.

Next steps
- Confirm plan
- Scaffold Next.js app
- Set up Supabase schema and RLS
- Implement client ingestion and embedding API
- Build RAG chat with streaming

Note: All services run in the cloud; no local state.
