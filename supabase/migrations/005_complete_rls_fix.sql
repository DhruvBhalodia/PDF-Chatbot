-- TEMPORARY: Disable RLS to diagnose the issue
-- We'll re-enable with proper policies

-- First, let's drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can update their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can delete their own workspaces" ON workspaces;

DROP POLICY IF EXISTS "Users can view memberships" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can insert members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can update members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can delete members" ON workspace_members;

DROP POLICY IF EXISTS "Users can view documents in owned workspaces" ON documents;
DROP POLICY IF EXISTS "Users can create documents in owned workspaces" ON documents;
DROP POLICY IF EXISTS "Users can update documents in owned workspaces" ON documents;
DROP POLICY IF EXISTS "Users can delete documents in owned workspaces" ON documents;

DROP POLICY IF EXISTS "Users can view pages" ON pages;
DROP POLICY IF EXISTS "Users can insert pages" ON pages;
DROP POLICY IF EXISTS "Users can update pages" ON pages;
DROP POLICY IF EXISTS "Users can delete pages" ON pages;

-- Temporarily disable RLS to test
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE chunks DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Now re-enable with VERY simple policies
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Super simple workspace policies
CREATE POLICY "Anyone can do anything with workspaces"
  ON workspaces FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Super simple workspace_members policies  
CREATE POLICY "Anyone can do anything with workspace_members"
  ON workspace_members FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Super simple document policies
CREATE POLICY "Anyone can do anything with documents"
  ON documents FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Super simple page policies
CREATE POLICY "Anyone can do anything with pages"
  ON pages FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
