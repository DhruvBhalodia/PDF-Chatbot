-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop and recreate the match_chunks function to fix any issues
DROP FUNCTION IF EXISTS match_chunks CASCADE;

CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(768),
  workspace_id uuid,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  page_id uuid,
  text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.page_id,
    c.text,
    1 - (c.embedding <=> query_embedding) as similarity
  FROM chunks c
  JOIN pages p ON c.page_id = p.id
  JOIN documents d ON p.document_id = d.id
  WHERE 
    d.workspace_id = match_chunks.workspace_id
    AND (d.status = 'indexed' OR d.status = 'ready')
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_ivfflat 
ON chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION match_chunks TO anon;
GRANT EXECUTE ON FUNCTION match_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION match_chunks TO service_role;
