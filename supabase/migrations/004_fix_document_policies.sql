-- Drop existing problematic policies
DROP POLICY IF EXISTS "Members can create documents in their workspaces" ON documents;
DROP POLICY IF EXISTS "Members can view documents in their workspaces" ON documents;
DROP POLICY IF EXISTS "Members can update documents in their workspaces" ON documents;
DROP POLICY IF EXISTS "Members can delete documents in their workspaces" ON documents;

DROP POLICY IF EXISTS "Members can view pages" ON pages;
DROP POLICY IF EXISTS "Members can manage pages" ON pages;

-- Create simpler document policies
CREATE POLICY "Users can view documents in owned workspaces"
  ON documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = documents.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents in owned workspaces"
  ON documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = documents.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update documents in owned workspaces"
  ON documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = documents.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete documents in owned workspaces"
  ON documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = documents.workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- Create simpler page policies
CREATE POLICY "Users can view pages"
  ON pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN workspaces w ON w.id = d.workspace_id
      WHERE d.id = pages.document_id
      AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pages"
  ON pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN workspaces w ON w.id = d.workspace_id
      WHERE d.id = pages.document_id
      AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pages"
  ON pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN workspaces w ON w.id = d.workspace_id
      WHERE d.id = pages.document_id
      AND w.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete pages"
  ON pages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN workspaces w ON w.id = d.workspace_id
      WHERE d.id = pages.document_id
      AND w.owner_id = auth.uid()
    )
  );
