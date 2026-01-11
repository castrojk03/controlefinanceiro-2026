-- Remove the insecure public policy
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.invitations;

-- Create a secure function to lookup invitation by token (no auth required, but only returns specific invitation)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(lookup_token TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role access_role,
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  owner_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.email,
    i.role,
    i.expires_at,
    i.accepted_at,
    i.owner_id
  FROM public.invitations i
  WHERE i.token = lookup_token
    AND i.expires_at > NOW()
    AND i.accepted_at IS NULL;
END;
$$;

-- Create secure function for owner to get shared member emails
CREATE OR REPLACE FUNCTION public.get_shared_member_emails(owner_uuid UUID)
RETURNS TABLE (
  member_id UUID,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() != owner_uuid THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  RETURN QUERY
  SELECT 
    sm.member_id,
    p.email
  FROM public.shared_members sm
  JOIN public.profiles p ON p.id = sm.member_id
  WHERE sm.owner_id = owner_uuid;
END;
$$;