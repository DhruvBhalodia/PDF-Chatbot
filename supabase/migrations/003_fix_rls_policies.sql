-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Owners can update their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Owners can delete their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Members can view workspace membership" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can manage members" ON workspace_members;

-- Create simplified policies for workspaces
CREATE POLICY "Users can view their own workspaces"
  ON workspaces FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own workspaces"
  ON workspaces FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own workspaces"
  ON workspaces FOR DELETE
  USING (owner_id = auth.uid());

-- Create simplified policies for workspace_members
CREATE POLICY "Users can view memberships"
  ON workspace_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Workspace owners can insert members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can update members"
  ON workspace_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

CREATE POLICY "Workspace owners can delete members"
  ON workspace_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspaces
      WHERE workspaces.id = workspace_id
      AND workspaces.owner_id = auth.uid()
    )
  );

-- Also create a view to simplify workspace access
CREATE OR REPLACE VIEW user_workspaces AS
SELECT DISTINCT w.*
FROM workspaces w
LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
WHERE w.owner_id = auth.uid() OR wm.user_id = auth.uid();
