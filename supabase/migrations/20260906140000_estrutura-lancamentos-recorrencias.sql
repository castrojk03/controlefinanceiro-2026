-- ============================================================
-- CONTROLE FINANCEIRO — 01 de 03 · ESTRUTURA
-- ============================================================
-- Cria os tipos, as tabelas novas e ajusta as existentes.
-- Aplicar ANTES de 02-seguranca.sql e 03-dados-iniciais.sql.
--
-- Seguro rodar: todas as tabelas do banco estão vazias (verificado em 06/09/2026).
-- ============================================================


-- ------------------------------------------------------------
-- TIPOS
-- ------------------------------------------------------------

CREATE TYPE tipo_lancamento     AS ENUM ('entrada', 'saida');
CREATE TYPE status_lancamento   AS ENUM ('previsto', 'pendente', 'pago');
CREATE TYPE origem_lancamento   AS ENUM ('agente', 'manual');
CREATE TYPE responsavel_pessoa  AS ENUM ('john', 'amanda', 'casal');
CREATE TYPE frequencia_recorr   AS ENUM ('diaria', 'semanal', 'mensal', 'anual');
CREATE TYPE fim_recorrencia     AS ENUM ('nunca', 'data', 'ocorrencias');
CREATE TYPE status_fatura       AS ENUM ('aberta', 'fechada', 'parcial', 'paga');
CREATE TYPE situacao_simulacao  AS ENUM ('pensando', 'comprada', 'descartada');
CREATE TYPE classificacao_area  AS ENUM ('fixo', 'prioridade', 'estilo_vida');


-- ------------------------------------------------------------
-- AREAS · ganha a classificação 50-35-15
-- ------------------------------------------------------------

ALTER TABLE public.areas
  ADD COLUMN IF NOT EXISTS classificacao classificacao_area;

COMMENT ON COLUMN public.areas.classificacao IS
  'Balde do método 50-35-15, usado na tela de Relatórios.';


-- ------------------------------------------------------------
-- RECORRENCIAS · a regra que gera lançamentos (Plano de Contas)
-- ------------------------------------------------------------

CREATE TABLE public.recorrencias (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  tipo              tipo_lancamento NOT NULL,
  descricao         TEXT NOT NULL,
  valor             NUMERIC(12,2) NOT NULL,
  valor_variavel    BOOLEAN NOT NULL DEFAULT FALSE,

  area_id           UUID REFERENCES public.areas(id)      ON DELETE SET NULL,
  categoria_id      UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  conta_id          UUID REFERENCES public.accounts(id)   ON DELETE SET NULL,
  cartao_id         UUID REFERENCES public.cards(id)      ON DELETE SET NULL,
  responsavel       responsavel_pessoa NOT NULL DEFAULT 'casal',

  -- Padrão de repetição (espelha o quadro do Google Calendar)
  frequencia        frequencia_recorr NOT NULL DEFAULT 'mensal',
  intervalo         INTEGER NOT NULL DEFAULT 1 CHECK (intervalo BETWEEN 1 AND 99),
  dias_semana       INTEGER[],            -- 0=dom … 6=sáb, quando frequencia='semanal'
  dia_do_mes        INTEGER CHECK (dia_do_mes BETWEEN 1 AND 31),

  inicio            DATE NOT NULL,
  fim_tipo          fim_recorrencia NOT NULL DEFAULT 'nunca',
  fim_data          DATE,
  fim_ocorrencias   INTEGER CHECK (fim_ocorrencias > 0),

  encerrada_em      DATE,                 -- encerra sem apagar histórico
  materializado_ate DATE,                 -- até onde já gerou lançamentos

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Coerência entre fim_tipo e o campo correspondente
  CONSTRAINT fim_coerente CHECK (
    (fim_tipo = 'nunca'       AND fim_data IS NULL AND fim_ocorrencias IS NULL) OR
    (fim_tipo = 'data'        AND fim_data IS NOT NULL) OR
    (fim_tipo = 'ocorrencias' AND fim_ocorrencias IS NOT NULL)
  )
);

COMMENT ON TABLE public.recorrencias IS
  'A regra, não a ocorrência. Recorrência e variabilidade são eixos independentes: '
  'aluguel é recorrente-fixo, conta de energia é recorrente-variável.';


-- ------------------------------------------------------------
-- LANCAMENTOS · entradas e saídas, reais ou previstas
-- Substitui incomes + expenses
-- ------------------------------------------------------------

CREATE TABLE public.lancamentos (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  tipo               tipo_lancamento NOT NULL,
  descricao          TEXT NOT NULL,
  valor              NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  valor_previsto     NUMERIC(12,2),        -- o esperado, para planejado × executado
  data               DATE NOT NULL,        -- competência: quando aconteceu ou vence

  area_id            UUID REFERENCES public.areas(id)      ON DELETE SET NULL,
  categoria_id       UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  conta_id           UUID REFERENCES public.accounts(id)   ON DELETE SET NULL,
  cartao_id          UUID REFERENCES public.cards(id)      ON DELETE SET NULL,
  fatura_id          UUID,                 -- FK adicionada depois de criar faturas

  status             status_lancamento NOT NULL DEFAULT 'previsto',
  data_pagamento     DATE,
  responsavel        responsavel_pessoa NOT NULL DEFAULT 'casal',

  -- Procedência: os três ícones saem destes dois campos
  origem             origem_lancamento NOT NULL DEFAULT 'manual',
  editado_em         TIMESTAMPTZ,

  -- Vínculo com a regra que o gerou
  recorrencia_id     UUID REFERENCES public.recorrencias(id) ON DELETE SET NULL,
  desligado_da_regra BOOLEAN NOT NULL DEFAULT FALSE,

  parcela_numero     INTEGER CHECK (parcela_numero > 0),
  parcela_total      INTEGER CHECK (parcela_total > 0),

  tarefa_google_id   TEXT,                 -- tarefa correspondente na lista FINANCEIRO

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT parcela_coerente CHECK (
    (parcela_numero IS NULL AND parcela_total IS NULL) OR
    (parcela_numero IS NOT NULL AND parcela_total IS NOT NULL
     AND parcela_numero <= parcela_total)
  ),
  CONSTRAINT pago_tem_data CHECK (
    status <> 'pago' OR data_pagamento IS NOT NULL
  )
);

COMMENT ON COLUMN public.lancamentos.origem IS
  'agente = 🤖 · manual = ⚡. Combinado com editado_em (✎), cobre os três estados '
  'sem inventar um quarto.';
COMMENT ON COLUMN public.lancamentos.desligado_da_regra IS
  'Editado individualmente. Regenerar a recorrência não sobrescreve esta linha.';
COMMENT ON COLUMN public.lancamentos.valor IS
  'Sempre positivo. O sinal vem do campo tipo.';


-- ------------------------------------------------------------
-- FATURAS · substitui invoices, com pagamento parcial e ajuste
-- ------------------------------------------------------------

CREATE TABLE public.faturas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cartao_id           UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,

  mes                 INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano                 INTEGER NOT NULL CHECK (ano BETWEEN 2000 AND 2100),

  status              status_fatura NOT NULL DEFAULT 'aberta',
  total               NUMERIC(12,2) NOT NULL DEFAULT 0,   -- soma no fechamento
  total_ajustado      NUMERIC(12,2),                      -- o que o banco cobrou
  saldo_anterior      NUMERIC(12,2) NOT NULL DEFAULT 0,   -- restante da fatura passada
  valor_pago          NUMERIC(12,2) NOT NULL DEFAULT 0,

  fechada_em          DATE,
  data_pagamento      DATE,
  conta_pagamento_id  UUID REFERENCES public.accounts(id) ON DELETE SET NULL,

  -- Rastro da edição pós-fechamento (exige re-autenticação na interface)
  editada_em          TIMESTAMPTZ,
  editada_por         UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (cartao_id, mes, ano)
);

COMMENT ON TABLE public.faturas IS
  'Fatura fechada é fato imutável: os lançamentos apontam para ela via '
  'lancamentos.fatura_id, gravado no fechamento. Sem isso, editar a data de uma '
  'despesa a faria migrar de fatura sozinha.';

-- Agora que faturas existe, fecha a referência
ALTER TABLE public.lancamentos
  ADD CONSTRAINT lancamentos_fatura_fk
  FOREIGN KEY (fatura_id) REFERENCES public.faturas(id) ON DELETE SET NULL;


-- ------------------------------------------------------------
-- LIMITES · teto de referência, substitui budgets
-- ------------------------------------------------------------

CREATE TABLE public.limites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  area_id       UUID NOT NULL REFERENCES public.areas(id)      ON DELETE CASCADE,
  categoria_id  UUID          REFERENCES public.categories(id) ON DELETE CASCADE,

  valor         NUMERIC(12,2) NOT NULL CHECK (valor >= 0),

  -- Nulos = permanente. Preenchidos = exceção daquele mês.
  mes           INTEGER CHECK (mes BETWEEN 1 AND 12),
  ano           INTEGER CHECK (ano BETWEEN 2000 AND 2100),

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT mes_ano_juntos CHECK (
    (mes IS NULL AND ano IS NULL) OR (mes IS NOT NULL AND ano IS NOT NULL)
  )
);

-- Um limite permanente por área (ou por categoria dentro dela)
CREATE UNIQUE INDEX limite_permanente_unico
  ON public.limites (user_id, area_id, COALESCE(categoria_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE mes IS NULL;

-- Uma exceção por área/categoria por mês
CREATE UNIQUE INDEX limite_mensal_unico
  ON public.limites (user_id, area_id, COALESCE(categoria_id, '00000000-0000-0000-0000-000000000000'::uuid), mes, ano)
  WHERE mes IS NOT NULL;

COMMENT ON TABLE public.limites IS
  'Referência de gastos, não trava: nada bloqueia lançamento. Permanente por '
  'padrão; com mes/ano preenchidos, sobrepõe aquele mês.';


-- ------------------------------------------------------------
-- SIMULACOES · compras em estudo
-- ------------------------------------------------------------

CREATE TABLE public.simulacoes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  descricao          TEXT NOT NULL,
  area_id            UUID REFERENCES public.areas(id)      ON DELETE SET NULL,
  categoria_id       UUID REFERENCES public.categories(id) ON DELETE SET NULL,

  situacao           situacao_simulacao NOT NULL DEFAULT 'pensando',
  cenarios           JSONB NOT NULL DEFAULT '[]'::jsonb,
  cenario_escolhido  INTEGER,
  lancamento_id      UUID REFERENCES public.lancamentos(id) ON DELETE SET NULL,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.simulacoes IS
  'Tabela à parte de propósito: simulação não vaza para relatório, saldo ou fatura '
  'se alguma consulta esquecer o filtro. Cenários em jsonb porque são estrutura '
  'livre e descartável.';


-- ------------------------------------------------------------
-- ÍNDICES · o que as telas consultam de fato
-- ------------------------------------------------------------

-- Tela inicial, calendário e painéis: sempre por período
CREATE INDEX idx_lanc_user_data      ON public.lancamentos (user_id, data DESC);
-- Bloco "próximos 7 dias" e revisão de pendentes
CREATE INDEX idx_lanc_status         ON public.lancamentos (user_id, status, data);
-- Tela de Faturas
CREATE INDEX idx_lanc_fatura         ON public.lancamentos (fatura_id) WHERE fatura_id IS NOT NULL;
-- Regenerar recorrência
CREATE INDEX idx_lanc_recorrencia    ON public.lancamentos (recorrencia_id) WHERE recorrencia_id IS NOT NULL;
-- Limites e relatórios por área
CREATE INDEX idx_lanc_area           ON public.lancamentos (user_id, area_id, data);
-- Aviso de pendências do agente na tela inicial
CREATE INDEX idx_lanc_agente_pend    ON public.lancamentos (user_id)
  WHERE origem = 'agente' AND (status = 'pendente' OR area_id IS NULL);

CREATE INDEX idx_recorr_ativas       ON public.recorrencias (user_id) WHERE encerrada_em IS NULL;
CREATE INDEX idx_faturas_cartao      ON public.faturas (user_id, cartao_id, ano DESC, mes DESC);
CREATE INDEX idx_simul_situacao      ON public.simulacoes (user_id, situacao);


-- ------------------------------------------------------------
-- updated_at automático
-- ------------------------------------------------------------

CREATE TRIGGER trg_lancamentos_updated
  BEFORE UPDATE ON public.lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_recorrencias_updated
  BEFORE UPDATE ON public.recorrencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_faturas_updated
  BEFORE UPDATE ON public.faturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_limites_updated
  BEFORE UPDATE ON public.limites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_simulacoes_updated
  BEFORE UPDATE ON public.simulacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ------------------------------------------------------------
-- Sanitização de texto, reaproveitando o que já existe
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sanitizar_lancamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.descricao := public.sanitize_text(NEW.descricao);

  IF LENGTH(NEW.descricao) > 200 THEN
    RAISE EXCEPTION 'Descrição deve ter no máximo 200 caracteres';
  END IF;

  IF NEW.valor > 999999999.99 THEN
    RAISE EXCEPTION 'Valor máximo excedido';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lancamentos_sanitiza
  BEFORE INSERT OR UPDATE ON public.lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.sanitizar_lancamento();

CREATE TRIGGER trg_recorrencias_sanitiza
  BEFORE INSERT OR UPDATE ON public.recorrencias
  FOR EACH ROW EXECUTE FUNCTION public.sanitizar_lancamento();


-- ------------------------------------------------------------
-- REMOVE O QUE FOI SUBSTITUÍDO
-- ------------------------------------------------------------
-- Seguro: verificado em 06/09/2026 que as três estão com 0 linhas.

DROP TABLE IF EXISTS public.budgets  CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.incomes  CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;


-- ============================================================
-- FIM · 01 de 03
-- Próximo: 02-seguranca.sql (RLS)
-- ============================================================
