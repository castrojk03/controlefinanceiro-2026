-- ============================================================
-- CONTROLE FINANCEIRO — ORIGENS DE RECEITA
-- ============================================================
-- Receita não tem área de custo: ela tem uma ORIGEM. Salário não é
-- "Habitação" nem "Lazer" — é "Salário John".
--
-- A estrutura espelha a aba Geral da planilha, que separa:
--   Receitas Fixas       → salários, VT, VR, VA
--   Receitas Variáveis   → tributadas (nota fiscal) e não tributadas
--
-- Guardar essa distinção serve a duas coisas:
--   · o Plano de Contas do Breno manda excluir renda incerta da previsão,
--     e o sistema passa a saber quais são sem depender de memória
--   · sendo MEI, separa o que passa por nota do que não passa
-- ============================================================


CREATE TYPE tipo_origem AS ENUM ('fixa', 'variavel');


CREATE TABLE public.origens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  nome        TEXT NOT NULL,
  tipo        tipo_origem NOT NULL DEFAULT 'fixa',
  tributada   BOOLEAN NOT NULL DEFAULT FALSE,
  responsavel responsavel_pessoa NOT NULL DEFAULT 'casal',
  cor         TEXT NOT NULL DEFAULT '#4E8F6E',

  ativa       BOOLEAN NOT NULL DEFAULT TRUE,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, nome)
);

COMMENT ON COLUMN public.origens.tipo IS
  'fixa = entra todo mês e dá para contar com ela; variavel = incerta, '
  'fica fora da previsão do Plano de Contas.';
COMMENT ON COLUMN public.origens.tributada IS
  'Passa por nota fiscal. Relevante para o MEI.';


-- Lançamentos e recorrências de entrada apontam para a origem
ALTER TABLE public.lancamentos
  ADD COLUMN IF NOT EXISTS origem_id UUID REFERENCES public.origens(id) ON DELETE SET NULL;

ALTER TABLE public.recorrencias
  ADD COLUMN IF NOT EXISTS origem_id UUID REFERENCES public.origens(id) ON DELETE SET NULL;

CREATE INDEX idx_lanc_origem ON public.lancamentos (user_id, origem_id)
  WHERE origem_id IS NOT NULL;


CREATE TRIGGER trg_origens_updated
  BEFORE UPDATE ON public.origens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ------------------------------------------------------------
-- SEGURANÇA
-- ------------------------------------------------------------

ALTER TABLE public.origens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ver origens proprias ou compartilhadas"
ON public.origens FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "criar origens proprias ou compartilhadas"
ON public.origens FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "alterar origens proprias ou compartilhadas"
ON public.origens FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);

CREATE POLICY "apagar origens proprias ou compartilhadas"
ON public.origens FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_shared_access(user_id, auth.uid(), 'admin')
);


-- ------------------------------------------------------------
-- DADOS INICIAIS · da planilha do John
-- ------------------------------------------------------------

DO $$
DECLARE
  dono UUID := 'SEU_USER_ID';
BEGIN

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = dono) THEN
    RAISE EXCEPTION 'Usuário % não existe.', dono;
  END IF;

  INSERT INTO public.origens (user_id, nome, tipo, tributada, responsavel) VALUES
    -- Receitas fixas
    (dono, 'Salário John',           'fixa',     FALSE, 'john'),
    (dono, 'Salário Amanda',         'fixa',     FALSE, 'amanda'),
    (dono, 'VT - John',              'fixa',     FALSE, 'john'),
    (dono, 'VR - Amanda',            'fixa',     FALSE, 'amanda'),
    (dono, 'VA - Amanda',            'fixa',     FALSE, 'amanda'),

    -- Variáveis tributadas
    (dono, 'Notas Fiscais emitidas', 'variavel', TRUE,  'john'),

    -- Variáveis não tributadas
    (dono, 'Resgate de investimentos','variavel', FALSE, 'casal'),
    (dono, 'Férias',                 'variavel', FALSE, 'casal'),
    (dono, '13º Salário',            'variavel', FALSE, 'casal'),
    (dono, 'Bônus',                  'variavel', FALSE, 'casal'),
    (dono, 'Empréstimo',             'variavel', FALSE, 'casal'),
    (dono, 'Outros',                 'variavel', FALSE, 'casal')
  ON CONFLICT (user_id, nome) DO NOTHING;

  RAISE NOTICE 'Origens cadastradas: %',
    (SELECT COUNT(*) FROM public.origens WHERE user_id = dono);

END $$;


-- ============================================================
-- CONFERÊNCIA
-- ============================================================
-- SELECT nome, tipo, tributada, responsavel
-- FROM public.origens
-- WHERE user_id = 'SEU_USER_ID'
-- ORDER BY tipo, nome;
-- ============================================================
