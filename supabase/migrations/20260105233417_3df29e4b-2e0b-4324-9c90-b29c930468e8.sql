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