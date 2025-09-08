# PDF Chatbot - Professional RAG System

A cloud-native PDF chatbot that allows users to upload PDFs into isolated workspaces and chat with them using advanced RAG (Retrieval-Augmented Generation) technology.

## Features

- 🔐 **Secure Authentication** - Email OTP authentication via Supabase
- 📁 **Workspace Management** - Create isolated workspaces for different document collections
- 📄 **Smart PDF Processing** - Client-side PDF rendering with page snapshots and text extraction
- 🧠 **Advanced RAG System** - Vector embeddings with Gemini for semantic search
- 💬 **Intelligent Chat** - Context-aware responses with source citations
- 🔍 **Duplicate Detection** - Automatic detection of similar content
- 📊 **Usage Limits** - Free tier limits to manage resources
- 🎨 **Professional UI** - Clean, modern interface similar to ChatGPT/Gemini

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Supabase (PostgreSQL with pgvector)
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth
- **AI/ML**: Google Gemini API (chat & embeddings)
- **PDF Processing**: PDF.js (client-side)
- **Hosting**: Vercel

## Free Tier Limits

- 3 workspaces per user
- 5 PDFs per workspace
- 50 pages per PDF
- 10MB max file size
- 100 messages per day
- 100MB storage per user

## Setup Instructions

### Prerequisites

1. [Node.js](https://nodejs.org/) (v18 or higher)
2. [Supabase Account](https://supabase.com)
3. [Google AI Studio Account](https://makersuite.google.com) for Gemini API
4. [Vercel Account](https://vercel.com) (optional, for deployment)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd PDF-Chatbot
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Go to SQL Editor and run the migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_vector_search.sql`
3. Go to Storage and create a bucket named `pdf-pages`
4. Set the bucket to public (or configure RLS policies)
5. Copy your project URL and keys from Settings > API

### 3. Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com)
2. Create an API key
3. Make sure you have access to:
   - `gemini-1.5-flash` model
   - `text-embedding-004` model

### 4. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables:
   - Add all variables from `.env.local`
5. Click "Deploy"

### 3. Configure Supabase URLs

1. After deployment, copy your Vercel URL
2. In Supabase Dashboard:
   - Go to Authentication > URL Configuration
   - Add your Vercel URL to "Redirect URLs"
   - Update "Site URL" to your Vercel URL

## Usage Guide

### 1. Sign Up / Login
- Enter your email
- Check email for verification code
- Enter the 6-digit code

### 2. Create Workspace
- Click "New Workspace"
- Enter a name
- Click "Create"

### 3. Upload PDFs
- Open a workspace
- Switch to "Documents" tab
- Click "Upload PDF"
- Select file (max 10MB, 50 pages)
- Wait for processing

### 4. Chat with Documents
- Switch to "Chat" tab
- Type your questions
- Get AI responses with citations

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│  Supabase   │────▶│   Gemini    │
│   (Vercel)  │     │ (Database)  │     │    (API)    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│   PDF.js    │     │  pgvector   │
│ (Client)    │     │  (Search)   │
└─────────────┘     └─────────────┘
```

## Security

- Row Level Security (RLS) on all tables
- Workspace isolation
- Service role key only on server
- Input validation and sanitization
- Rate limiting

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Support

For issues or questions, please open a GitHub issue.
