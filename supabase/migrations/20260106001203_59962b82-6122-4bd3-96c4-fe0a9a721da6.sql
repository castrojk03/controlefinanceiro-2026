-- Create enum for access roles
CREATE TYPE public.access_role AS ENUM ('viewer', 'editor', 'admin');

-- Create shared_members table to track shared access
CREATE TABLE public.shared_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role access_role NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (owner_id, member_id)
);

-- Create invitations table for pending invites
CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role access_role NOT NULL DEFAULT 'viewer',
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.shared_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Function to check if user has shared access with minimum role
CREATE OR REPLACE FUNCTION public.has_shared_access(_owner_id UUID, _user_id UUID, _min_role access_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shared_members
    WHERE owner_id = _owner_id
      AND member_id = _user_id
      AND (
        (_min_role = 'viewer') OR
        (_min_role = 'editor' AND role IN ('editor', 'admin')) OR
        (_min_role = 'admin' AND role = 'admin')
      )
  )
$$;

-- Function to get owner_id for current user (returns own id or shared owner's id)
CREATE OR REPLACE FUNCTION public.get_effective_owner_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT owner_id FROM public.shared_members WHERE member_id = auth.uid() LIMIT 1),
    auth.uid()
  )
$$;

-- RLS policies for shared_members
CREATE POLICY "Owners can view their shared members"
ON public.shared_members FOR SELECT
USING (owner_id = auth.uid() OR member_id = auth.uid());

CREATE POLICY "Owners can insert shared members"
ON public.shared_members FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update shared members"
ON public.shared_members FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete shared members"
ON public.shared_members FOR DELETE
USING (owner_id = auth.uid());

-- RLS policies for invitations
CREATE POLICY "Owners can view their invitations"
ON public.invitations FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Anyone can view invitation by token"
ON public.invitations FOR SELECT
USING (true);

CREATE POLICY "Owners can insert invitations"
ON public.invitations FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update invitations"
ON public.invitations FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Invited user can accept invitation"
ON public.invitations FOR UPDATE
USING (LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "Owners can delete invitations"
ON public.invitations FOR DELETE
USING (owner_id = auth.uid());

-- Update RLS policies for accounts to include shared access
DROP POLICY IF EXISTS "Users can view own accounts" ON public.accounts;
CREATE POLICY "Users can view own or shared accounts"
ON public.accounts FOR SELECT
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'viewer'));

DROP POLICY IF EXISTS "Users can insert own accounts" ON public.accounts;
CREATE POLICY "Users can insert own or shared accounts"
ON public.accounts FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can update own accounts" ON public.accounts;
CREATE POLICY "Users can update own or shared accounts"
ON public.accounts FOR UPDATE
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can delete own accounts" ON public.accounts;
CREATE POLICY "Users can delete own or shared accounts"
ON public.accounts FOR DELETE
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'admin'));

-- Update RLS policies for cards
DROP POLICY IF EXISTS "Users can view own cards" ON public.cards;
CREATE POLICY "Users can view own or shared cards"
ON public.cards FOR SELECT
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'viewer'));

DROP POLICY IF EXISTS "Users can insert own cards" ON public.cards;
CREATE POLICY "Users can insert own or shared cards"
ON public.cards FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can update own cards" ON public.cards;
CREATE POLICY "Users can update own or shared cards"
ON public.cards FOR UPDATE
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can delete own cards" ON public.cards;
CREATE POLICY "Users can delete own or shared cards"
ON public.cards FOR DELETE
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'admin'));

-- Update RLS policies for areas
DROP POLICY IF EXISTS "Users can view own areas" ON public.areas;
CREATE POLICY "Users can view own or shared areas"
ON public.areas FOR SELECT
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'viewer'));

DROP POLICY IF EXISTS "Users can insert own areas" ON public.areas;
CREATE POLICY "Users can insert own or shared areas"
ON public.areas FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can update own areas" ON public.areas;
CREATE POLICY "Users can update own or shared areas"
ON public.areas FOR UPDATE
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can delete own areas" ON public.areas;
CREATE POLICY "Users can delete own or shared areas"
ON public.areas FOR DELETE
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'admin'));

-- Update RLS policies for categories
DROP POLICY IF EXISTS "Users can view own categories" ON public.categories;
CREATE POLICY "Users can view own or shared categories"
ON public.categories FOR SELECT
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'viewer'));

DROP POLICY IF EXISTS "Users can insert own categories" ON public.categories;
CREATE POLICY "Users can insert own or shared categories"
ON public.categories FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can update own categories" ON public.categories;
CREATE POLICY "Users can update own or shared categories"
ON public.categories FOR UPDATE
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can delete own categories" ON public.categories;
CREATE POLICY "Users can delete own or shared categories"
ON public.categories FOR DELETE
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'admin'));

-- Update RLS policies for incomes
DROP POLICY IF EXISTS "Users can view own incomes" ON public.incomes;
CREATE POLICY "Users can view own or shared incomes"
ON public.incomes FOR SELECT
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'viewer'));

DROP POLICY IF EXISTS "Users can insert own incomes" ON public.incomes;
CREATE POLICY "Users can insert own or shared incomes"
ON public.incomes FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Users can update own incomes" ON public.incomes;
CREATE POLICY "Users can update own or shared incomes"
ON public.incomes FOR UPDATE
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Users can delete own incomes" ON public.incomes;
CREATE POLICY "Users can delete own or shared incomes"
ON public.incomes FOR DELETE
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'admin'));

-- Update RLS policies for expenses
DROP POLICY IF EXISTS "Users can view own expenses" ON public.expenses;
CREATE POLICY "Users can view own or shared expenses"
ON public.expenses FOR SELECT
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'viewer'));

DROP POLICY IF EXISTS "Users can insert own expenses" ON public.expenses;
CREATE POLICY "Users can insert own or shared expenses"
ON public.expenses FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Users can update own expenses" ON public.expenses;
CREATE POLICY "Users can update own or shared expenses"
ON public.expenses FOR UPDATE
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Users can delete own expenses" ON public.expenses;
CREATE POLICY "Users can delete own or shared expenses"
ON public.expenses FOR DELETE
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'admin'));

-- Update RLS policies for invoices
DROP POLICY IF EXISTS "Users can view own invoices" ON public.invoices;
CREATE POLICY "Users can view own or shared invoices"
ON public.invoices FOR SELECT
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'viewer'));

DROP POLICY IF EXISTS "Users can insert own invoices" ON public.invoices;
CREATE POLICY "Users can insert own or shared invoices"
ON public.invoices FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Users can update own invoices" ON public.invoices;
CREATE POLICY "Users can update own or shared invoices"
ON public.invoices FOR UPDATE
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'editor'));

DROP POLICY IF EXISTS "Users can delete own invoices" ON public.invoices;
CREATE POLICY "Users can delete own or shared invoices"
ON public.invoices FOR DELETE
USING (user_id = auth.uid() OR public.has_shared_access(user_id, auth.uid(), 'admin'));