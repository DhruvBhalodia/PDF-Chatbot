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
    d.workspace_id = workspace_id
    AND d.status = 'indexed'
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_chunks_embedding_ivfflat 
ON chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
