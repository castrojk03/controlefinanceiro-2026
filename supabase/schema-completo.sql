-- Schema completo do Controle Financeiro
-- Gerado a partir das migrations versionadas, na ordem cronológica.
-- Aplicar num projeto Supabase novo, de uma vez, pelo SQL Editor.

-- ======================================================================
-- 20260105233359_5129a207-9bab-43d7-967a-4f6562a4a97b.sql
-- ======================================================================
-- Tabela de perfis (vinculada ao auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tabela de contas bancárias
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  balance NUMERIC(12,2) DEFAULT 0,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accounts"
ON public.accounts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own accounts"
ON public.accounts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own accounts"
ON public.accounts FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own accounts"
ON public.accounts FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Tabela de cartões
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  last_digits TEXT,
  color TEXT NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  credit_limit NUMERIC(12,2) DEFAULT 0,
  due_day INTEGER CHECK (due_day BETWEEN 1 AND 31),
  closing_day INTEGER CHECK (closing_day BETWEEN 1 AND 31),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cards"
ON public.cards FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own cards"
ON public.cards FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cards"
ON public.cards FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own cards"
ON public.cards FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Tabela de áreas
CREATE TABLE public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own areas"
ON public.areas FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own areas"
ON public.areas FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own areas"
ON public.areas FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own areas"
ON public.areas FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Tabela de categorias
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  area_id UUID REFERENCES public.areas(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own categories"
ON public.categories FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own categories"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own categories"
ON public.categories FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own categories"
ON public.categories FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Tabela de receitas
CREATE TABLE public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  value NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL,
  origin TEXT,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own incomes"
ON public.incomes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own incomes"
ON public.incomes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own incomes"
ON public.incomes FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own incomes"
ON public.incomes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Tabela de despesas
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  value NUMERIC(12,2) NOT NULL,
  date DATE NOT NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'paid',
  payment_date DATE,
  recurrence_type TEXT DEFAULT 'none',
  recurrence_start_date DATE,
  recurrence_end_date DATE,
  recurrence_installments INTEGER,
  recurrence_frequency TEXT,
  parent_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE,
  installment_number INTEGER,
  total_installments INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses"
ON public.expenses FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own expenses"
ON public.expenses FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own expenses"
ON public.expenses FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own expenses"
ON public.expenses FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Tabela de faturas
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'open',
  total_amount NUMERIC(12,2) DEFAULT 0,
  paid_date DATE,
  paid_from_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================================================
-- 20260105233417_3df29e4b-2e0b-4324-9c90-b29c930468e8.sql
-- ======================================================================
-- Habilitar RLS na tabela invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own invoices"
ON public.invoices FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own invoices"
ON public.invoices FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own invoices"
ON public.invoices FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ======================================================================
-- 20260106001203_59962b82-6122-4bd3-96c4-fe0a9a721da6.sql
-- ======================================================================
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

-- ======================================================================
-- 20260111004026_d7221d3d-5831-4053-86d3-9ad67e07ea87.sql
-- ======================================================================
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

-- ======================================================================
-- 20260111004606_fab86e92-93a7-4cf6-9275-d43bb035ec77.sql
-- ======================================================================
-- Atualizar a função get_shared_member_emails para buscar email de auth.users
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
    u.email::TEXT
  FROM public.shared_members sm
  JOIN auth.users u ON u.id = sm.member_id
  WHERE sm.owner_id = owner_uuid;
END;
$$;

-- Remover coluna email da tabela profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Criar trigger para auto-criar profile quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at)
  VALUES (NEW.id, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar o trigger (remover se existir primeiro)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ======================================================================
-- 20260111005918_170470c6-97cc-4150-89bc-3759f94a27bc.sql
-- ======================================================================
-- ============================================
-- DATABASE VALIDATION TRIGGERS AND CONSTRAINTS
-- ============================================

-- Function to sanitize text inputs (removes dangerous characters)
CREATE OR REPLACE FUNCTION public.sanitize_text(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF input IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN TRIM(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(input, '<script[^>]*>.*?</script>', '', 'gi'),
          'javascript:', '', 'gi'
        ),
        'on\w+\s*=', '', 'gi'
      ),
      '<[^>]*>', '', 'g'
    )
  );
END;
$$;

-- Function to validate monetary values
CREATE OR REPLACE FUNCTION public.validate_monetary_value()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check for positive values in incomes
  IF TG_TABLE_NAME = 'incomes' AND NEW.value <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser positivo';
  END IF;
  
  -- Check for positive values in expenses
  IF TG_TABLE_NAME = 'expenses' AND NEW.value <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser positivo';
  END IF;
  
  -- Check maximum value
  IF NEW.value > 999999999.99 THEN
    RAISE EXCEPTION 'Valor máximo excedido (999.999.999,99)';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to validate card credit limit
CREATE OR REPLACE FUNCTION public.validate_card_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Credit cards must have a limit > 0
  IF NEW.type = 'Crédito' AND (NEW.credit_limit IS NULL OR NEW.credit_limit <= 0) THEN
    RAISE EXCEPTION 'Cartão de crédito deve ter limite maior que zero';
  END IF;
  
  -- Validate day ranges
  IF NEW.due_day IS NOT NULL AND (NEW.due_day < 1 OR NEW.due_day > 31) THEN
    RAISE EXCEPTION 'Dia de vencimento deve estar entre 1 e 31';
  END IF;
  
  IF NEW.closing_day IS NOT NULL AND (NEW.closing_day < 1 OR NEW.closing_day > 31) THEN
    RAISE EXCEPTION 'Dia de fechamento deve estar entre 1 e 31';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to sanitize and validate descriptions
CREATE OR REPLACE FUNCTION public.sanitize_descriptions()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Sanitize description field if it exists
  IF TG_TABLE_NAME IN ('incomes', 'expenses') THEN
    NEW.description := public.sanitize_text(NEW.description);
    
    -- Validate length
    IF LENGTH(NEW.description) > 200 THEN
      RAISE EXCEPTION 'Descrição deve ter no máximo 200 caracteres';
    END IF;
  END IF;
  
  -- Sanitize origin for incomes
  IF TG_TABLE_NAME = 'incomes' AND NEW.origin IS NOT NULL THEN
    NEW.origin := public.sanitize_text(NEW.origin);
    
    IF LENGTH(NEW.origin) > 200 THEN
      RAISE EXCEPTION 'Origem deve ter no máximo 200 caracteres';
    END IF;
  END IF;
  
  -- Sanitize name for accounts, cards, areas, categories
  IF TG_TABLE_NAME IN ('accounts', 'cards', 'areas', 'categories') THEN
    NEW.name := public.sanitize_text(NEW.name);
    
    IF LENGTH(NEW.name) > 100 THEN
      RAISE EXCEPTION 'Nome deve ter no máximo 100 caracteres';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to validate date ranges
CREATE OR REPLACE FUNCTION public.validate_date_range()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  date_year INTEGER;
BEGIN
  -- Validate main date
  IF NEW.date IS NOT NULL THEN
    date_year := EXTRACT(YEAR FROM NEW.date::DATE);
    IF date_year < 2000 OR date_year > 2100 THEN
      RAISE EXCEPTION 'Data deve estar entre 2000 e 2100';
    END IF;
  END IF;
  
  -- Validate payment date
  IF TG_TABLE_NAME = 'expenses' AND NEW.payment_date IS NOT NULL THEN
    date_year := EXTRACT(YEAR FROM NEW.payment_date::DATE);
    IF date_year < 2000 OR date_year > 2100 THEN
      RAISE EXCEPTION 'Data de pagamento deve estar entre 2000 e 2100';
    END IF;
  END IF;
  
  -- Validate recurrence dates
  IF TG_TABLE_NAME = 'expenses' THEN
    IF NEW.recurrence_start_date IS NOT NULL THEN
      date_year := EXTRACT(YEAR FROM NEW.recurrence_start_date::DATE);
      IF date_year < 2000 OR date_year > 2100 THEN
        RAISE EXCEPTION 'Data de início da recorrência deve estar entre 2000 e 2100';
      END IF;
    END IF;
    
    IF NEW.recurrence_end_date IS NOT NULL THEN
      date_year := EXTRACT(YEAR FROM NEW.recurrence_end_date::DATE);
      IF date_year < 2000 OR date_year > 2100 THEN
        RAISE EXCEPTION 'Data de fim da recorrência deve estar entre 2000 e 2100';
      END IF;
    END IF;
    
    -- End date must be after start date
    IF NEW.recurrence_start_date IS NOT NULL AND NEW.recurrence_end_date IS NOT NULL THEN
      IF NEW.recurrence_end_date <= NEW.recurrence_start_date THEN
        RAISE EXCEPTION 'Data de fim deve ser após data de início';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for incomes
DROP TRIGGER IF EXISTS validate_income_value ON public.incomes;
CREATE TRIGGER validate_income_value
  BEFORE INSERT OR UPDATE ON public.incomes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_monetary_value();

DROP TRIGGER IF EXISTS sanitize_income_descriptions ON public.incomes;
CREATE TRIGGER sanitize_income_descriptions
  BEFORE INSERT OR UPDATE ON public.incomes
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_descriptions();

DROP TRIGGER IF EXISTS validate_income_dates ON public.incomes;
CREATE TRIGGER validate_income_dates
  BEFORE INSERT OR UPDATE ON public.incomes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_date_range();

-- Create triggers for expenses
DROP TRIGGER IF EXISTS validate_expense_value ON public.expenses;
CREATE TRIGGER validate_expense_value
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_monetary_value();

DROP TRIGGER IF EXISTS sanitize_expense_descriptions ON public.expenses;
CREATE TRIGGER sanitize_expense_descriptions
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_descriptions();

DROP TRIGGER IF EXISTS validate_expense_dates ON public.expenses;
CREATE TRIGGER validate_expense_dates
  BEFORE INSERT OR UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_date_range();

-- Create triggers for cards
DROP TRIGGER IF EXISTS validate_card ON public.cards;
CREATE TRIGGER validate_card
  BEFORE INSERT OR UPDATE ON public.cards
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_card_limit();

DROP TRIGGER IF EXISTS sanitize_card_name ON public.cards;
CREATE TRIGGER sanitize_card_name
  BEFORE INSERT OR UPDATE ON public.cards
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_descriptions();

-- Create triggers for accounts
DROP TRIGGER IF EXISTS sanitize_account_name ON public.accounts;
CREATE TRIGGER sanitize_account_name
  BEFORE INSERT OR UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_descriptions();

-- Create triggers for areas
DROP TRIGGER IF EXISTS sanitize_area_name ON public.areas;
CREATE TRIGGER sanitize_area_name
  BEFORE INSERT OR UPDATE ON public.areas
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_descriptions();

-- Create triggers for categories
DROP TRIGGER IF EXISTS sanitize_category_name ON public.categories;
CREATE TRIGGER sanitize_category_name
  BEFORE INSERT OR UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_descriptions();

-- ======================================================================
-- 20260111010006_8d974623-34a2-4bf2-90ae-9c4a80262090.sql
-- ======================================================================
-- Fix search_path for all validation functions

CREATE OR REPLACE FUNCTION public.validate_monetary_value()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Check for positive values in incomes
  IF TG_TABLE_NAME = 'incomes' AND NEW.value <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser positivo';
  END IF;
  
  -- Check for positive values in expenses
  IF TG_TABLE_NAME = 'expenses' AND NEW.value <= 0 THEN
    RAISE EXCEPTION 'Valor deve ser positivo';
  END IF;
  
  -- Check maximum value
  IF NEW.value > 999999999.99 THEN
    RAISE EXCEPTION 'Valor máximo excedido (999.999.999,99)';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_card_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Credit cards must have a limit > 0
  IF NEW.type = 'Crédito' AND (NEW.credit_limit IS NULL OR NEW.credit_limit <= 0) THEN
    RAISE EXCEPTION 'Cartão de crédito deve ter limite maior que zero';
  END IF;
  
  -- Validate day ranges
  IF NEW.due_day IS NOT NULL AND (NEW.due_day < 1 OR NEW.due_day > 31) THEN
    RAISE EXCEPTION 'Dia de vencimento deve estar entre 1 e 31';
  END IF;
  
  IF NEW.closing_day IS NOT NULL AND (NEW.closing_day < 1 OR NEW.closing_day > 31) THEN
    RAISE EXCEPTION 'Dia de fechamento deve estar entre 1 e 31';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sanitize_descriptions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Sanitize description field if it exists
  IF TG_TABLE_NAME IN ('incomes', 'expenses') THEN
    NEW.description := public.sanitize_text(NEW.description);
    
    -- Validate length
    IF LENGTH(NEW.description) > 200 THEN
      RAISE EXCEPTION 'Descrição deve ter no máximo 200 caracteres';
    END IF;
  END IF;
  
  -- Sanitize origin for incomes
  IF TG_TABLE_NAME = 'incomes' AND NEW.origin IS NOT NULL THEN
    NEW.origin := public.sanitize_text(NEW.origin);
    
    IF LENGTH(NEW.origin) > 200 THEN
      RAISE EXCEPTION 'Origem deve ter no máximo 200 caracteres';
    END IF;
  END IF;
  
  -- Sanitize name for accounts, cards, areas, categories
  IF TG_TABLE_NAME IN ('accounts', 'cards', 'areas', 'categories') THEN
    NEW.name := public.sanitize_text(NEW.name);
    
    IF LENGTH(NEW.name) > 100 THEN
      RAISE EXCEPTION 'Nome deve ter no máximo 100 caracteres';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_date_range()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  date_year INTEGER;
BEGIN
  -- Validate main date
  IF NEW.date IS NOT NULL THEN
    date_year := EXTRACT(YEAR FROM NEW.date::DATE);
    IF date_year < 2000 OR date_year > 2100 THEN
      RAISE EXCEPTION 'Data deve estar entre 2000 e 2100';
    END IF;
  END IF;
  
  -- Validate payment date
  IF TG_TABLE_NAME = 'expenses' AND NEW.payment_date IS NOT NULL THEN
    date_year := EXTRACT(YEAR FROM NEW.payment_date::DATE);
    IF date_year < 2000 OR date_year > 2100 THEN
      RAISE EXCEPTION 'Data de pagamento deve estar entre 2000 e 2100';
    END IF;
  END IF;
  
  -- Validate recurrence dates
  IF TG_TABLE_NAME = 'expenses' THEN
    IF NEW.recurrence_start_date IS NOT NULL THEN
      date_year := EXTRACT(YEAR FROM NEW.recurrence_start_date::DATE);
      IF date_year < 2000 OR date_year > 2100 THEN
        RAISE EXCEPTION 'Data de início da recorrência deve estar entre 2000 e 2100';
      END IF;
    END IF;
    
    IF NEW.recurrence_end_date IS NOT NULL THEN
      date_year := EXTRACT(YEAR FROM NEW.recurrence_end_date::DATE);
      IF date_year < 2000 OR date_year > 2100 THEN
        RAISE EXCEPTION 'Data de fim da recorrência deve estar entre 2000 e 2100';
      END IF;
    END IF;
    
    -- End date must be after start date
    IF NEW.recurrence_start_date IS NOT NULL AND NEW.recurrence_end_date IS NOT NULL THEN
      IF NEW.recurrence_end_date <= NEW.recurrence_start_date THEN
        RAISE EXCEPTION 'Data de fim deve ser após data de início';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ======================================================================
-- 20260111010055_901d79d9-6789-4666-9719-15ecb7d8f388.sql
-- ======================================================================
-- Fix sanitize_text function search_path
CREATE OR REPLACE FUNCTION public.sanitize_text(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF input IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN TRIM(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(input, '<script[^>]*>.*?</script>', '', 'gi'),
          'javascript:', '', 'gi'
        ),
        'on\w+\s*=', '', 'gi'
      ),
      '<[^>]*>', '', 'g'
    )
  );
END;
$$;

-- ======================================================================
-- 20260113011133_efc928e6-8235-46ac-9bcb-4221bd8e77fa.sql
-- ======================================================================
-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create budgets table
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  budgeted_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- One budget per category per month
  UNIQUE(user_id, category_id, month, year)
);

-- Enable Row Level Security
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own budgets" 
ON public.budgets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budgets" 
ON public.budgets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets" 
ON public.budgets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets" 
ON public.budgets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_budgets_user_month_year ON public.budgets(user_id, month, year);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_budgets_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Validation trigger for month/year values
CREATE OR REPLACE FUNCTION public.validate_budget()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.month < 1 OR NEW.month > 12 THEN
    RAISE EXCEPTION 'Month must be between 1 and 12';
  END IF;
  IF NEW.year < 2000 OR NEW.year > 2100 THEN
    RAISE EXCEPTION 'Year must be between 2000 and 2100';
  END IF;
  IF NEW.budgeted_amount < 0 THEN
    RAISE EXCEPTION 'Budgeted amount cannot be negative';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_budget_trigger
BEFORE INSERT OR UPDATE ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.validate_budget();

-- ======================================================================
-- 20260201234040_c285e26b-00c2-4159-882e-07e520a74760.sql
-- ======================================================================
-- Fix sanitize_descriptions trigger to handle expenses table correctly
-- The issue is that expenses table doesn't have an 'origin' field

CREATE OR REPLACE FUNCTION public.sanitize_descriptions()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Sanitize description field for incomes and expenses
  IF TG_TABLE_NAME IN ('incomes', 'expenses') THEN
    NEW.description := public.sanitize_text(NEW.description);
    
    -- Validate length
    IF LENGTH(NEW.description) > 200 THEN
      RAISE EXCEPTION 'Descrição deve ter no máximo 200 caracteres';
    END IF;
  END IF;
  
  -- Sanitize origin ONLY for incomes (expenses doesn't have origin field)
  IF TG_TABLE_NAME = 'incomes' THEN
    IF NEW.origin IS NOT NULL THEN
      NEW.origin := public.sanitize_text(NEW.origin);
      
      IF LENGTH(NEW.origin) > 200 THEN
        RAISE EXCEPTION 'Origem deve ter no máximo 200 caracteres';
      END IF;
    END IF;
  END IF;
  
  -- Sanitize name for accounts, cards, areas, categories
  IF TG_TABLE_NAME IN ('accounts', 'cards', 'areas', 'categories') THEN
    NEW.name := public.sanitize_text(NEW.name);
    
    IF LENGTH(NEW.name) > 100 THEN
      RAISE EXCEPTION 'Nome deve ter no máximo 100 caracteres';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
