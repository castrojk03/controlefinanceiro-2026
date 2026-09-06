-- ============================================================
-- CONTROLE FINANCEIRO — 02 de 03 · SEGURANÇA (RLS)
-- ============================================================
-- Liga Row Level Security nas tabelas novas e cria as políticas.
-- Aplicar DEPOIS de 01-estrutura.sql.
--
-- Sem isto, as tabelas novas ficam acessíveis a qualquer requisição
-- com a chave anon — que é pública por natureza.
-- ============================================================


-- ------------------------------------------------------------
-- Modelo de acesso
-- ------------------------------------------------------------
-- John é o dono (user_id). Amanda entra como membro compartilhado
-- com papel 'admin', o que lhe dá paridade total de uso.
--
-- A função has_shared_access(dono, usuario, papel_minimo) já existe
-- desde o schema original e é reaproveitada aqui.
--
-- Regra única para todas as tabelas: enxerga e altera quem é o dono
-- OU tem acesso compartilhado como admin.
-- ------------------------------------------------------------

ALTER TABLE public.lancamentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.limites      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulacoes   ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------
-- LANCAMENTOS
-- ------------------------------------------------------------

CREATE POLICY "ver lancamentos proprios ou compartilhados"
ON public.lancamentos FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "criar lancamentos proprios ou compartilhados"
ON public.lancamentos FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "alterar lancamentos proprios ou compartilhados"
ON public.lancamentos FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "apagar lancamentos proprios ou compartilhados"
ON public.lancamentos FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);


-- ------------------------------------------------------------
-- RECORRENCIAS
-- ------------------------------------------------------------

CREATE POLICY "ver recorrencias proprias ou compartilhadas"
ON public.recorrencias FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "criar recorrencias proprias ou compartilhadas"
ON public.recorrencias FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "alterar recorrencias proprias ou compartilhadas"
ON public.recorrencias FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "apagar recorrencias proprias ou compartilhadas"
ON public.recorrencias FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);


-- ------------------------------------------------------------
-- FATURAS
-- ------------------------------------------------------------

CREATE POLICY "ver faturas proprias ou compartilhadas"
ON public.faturas FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "criar faturas proprias ou compartilhadas"
ON public.faturas FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "alterar faturas proprias ou compartilhadas"
ON public.faturas FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "apagar faturas proprias ou compartilhadas"
ON public.faturas FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);


-- ------------------------------------------------------------
-- LIMITES
-- ------------------------------------------------------------

CREATE POLICY "ver limites proprios ou compartilhados"
ON public.limites FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "criar limites proprios ou compartilhados"
ON public.limites FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "alterar limites proprios ou compartilhados"
ON public.limites FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "apagar limites proprios ou compartilhados"
ON public.limites FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);


-- ------------------------------------------------------------
-- SIMULACOES
-- ------------------------------------------------------------

CREATE POLICY "ver simulacoes proprias ou compartilhadas"
ON public.simulacoes FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "criar simulacoes proprias ou compartilhadas"
ON public.simulacoes FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "alterar simulacoes proprias ou compartilhadas"
ON public.simulacoes FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "apagar simulacoes proprias ou compartilhadas"
ON public.simulacoes FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);


-- ============================================================
-- FIM · 02 de 03
-- Próximo: 03-dados-iniciais.sql (áreas e categorias)
-- ============================================================
