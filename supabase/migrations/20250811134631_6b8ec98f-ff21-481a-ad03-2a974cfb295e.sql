-- Security hardening: prevent privilege escalation on community_members
-- 1) Drop permissive policies that allow setting member_type='manager' by non-admins
DROP POLICY IF EXISTS "Join community for self or admin" ON public.community_members;
DROP POLICY IF EXISTS "Update/Delete own membership or admin" ON public.community_members;
DROP POLICY IF EXISTS "Delete membership own or admin" ON public.community_members;

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- 2) Recreate strict policies
-- View policy remains unchanged and should already exist: "View own memberships or admin"

-- Inserts: users can only insert their own membership and never as manager; admins can insert any
CREATE POLICY "Members insert non-manager for self"
ON public.community_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND member_type::text <> 'manager'
);

CREATE POLICY "Admins insert any membership"
ON public.community_members
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- Updates: users can only update their own non-manager membership; admins can update any
CREATE POLICY "Members update own non-manager membership"
ON public.community_members
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() AND member_type::text <> 'manager'
)
WITH CHECK (
  user_id = auth.uid() AND member_type::text <> 'manager'
);

CREATE POLICY "Admins update memberships"
ON public.community_members
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
);

-- Deletes: users can delete their own membership only if not a manager; admins can delete any
CREATE POLICY "Members delete own non-manager membership"
ON public.community_members
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() AND member_type::text <> 'manager'
);

CREATE POLICY "Admins delete memberships"
ON public.community_members
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role)
);
