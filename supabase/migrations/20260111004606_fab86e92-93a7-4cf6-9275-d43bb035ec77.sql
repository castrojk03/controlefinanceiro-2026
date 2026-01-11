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