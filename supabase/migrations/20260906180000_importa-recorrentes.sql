-- ============================================================
-- CONTROLE FINANCEIRO — IMPORTAÇÃO DE CONTAS RECORRENTES
-- ============================================================
-- Importa as contas fixas da planilha (aba Geral), usando a coluna de
-- dezembro como valor de referência — é o que indica recorrência.
--
-- Definido com o John em 06/09/2026:
--   · todas vencem dia 10
--   · todas saem da conta "Nubank - PF"
--   · Empréstimo Keyla entra sem prazo, R$ 300
--   · Netflix e Amazon Prime ficam FORA (serão agrupadas depois)
--   · Spotify entra a R$ 21,90 (valor a confirmar)
--
-- Cria a regra E os lançamentos dos próximos 24 meses, como faz a tela.
-- Pode rodar mais de uma vez: ignora o que já existe.
-- ============================================================

DO $$
DECLARE
  dono            UUID := 'SEU_USER_ID';
  id_conta        UUID;
  id_habitacao    UUID;
  id_assinaturas  UUID;
  id_emprestimos  UUID;

  nova_regra      UUID;
  data_ocorrencia DATE;
  i               INTEGER;

  -- descrição, valor, variável, área, categoria
  contas CONSTANT TEXT[][] := ARRAY[
    ['Financiamento',              '2160.00', 'nao', 'hab', 'Financiamento'],
    ['Condomínio',                  '750.00', 'nao', 'hab', 'Condomínio'],
    ['Condomínio - Parcelamento',   '309.40', 'nao', 'hab', 'Condomínio - Parcelamento'],
    ['Conta de Energia',             '80.00', 'sim', 'hab', 'Conta de Energia'],
    ['Conta de Gás',                '155.00', 'sim', 'hab', 'Conta de Gás'],
    ['Internet',                    '311.00', 'nao', 'hab', 'Internet'],
    ['TotalPass - John',             '89.90', 'nao', 'ass', 'TotalPass'],
    ['TotalPass - Amanda',          '109.90', 'nao', 'ass', 'TotalPass'],
    ['Spotify',                      '21.90', 'nao', 'ass', 'Spotify'],
    ['Empréstimo - Keyla',          '300.00', 'nao', 'emp', 'Empréstimo']
  ];
BEGIN

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = dono) THEN
    RAISE EXCEPTION 'Usuário % não existe. Confira o SEU_USER_ID no topo.', dono;
  END IF;

  -- ----------------------------------------------------------
  -- A conta de origem: precisa ser exatamente uma
  -- ----------------------------------------------------------
  SELECT id INTO id_conta
  FROM public.accounts
  WHERE user_id = dono AND name = 'Nubank - PF';

  IF id_conta IS NULL THEN
    RAISE EXCEPTION
      'Conta "Nubank - PF" não encontrada. Cadastradas: %',
      (SELECT string_agg(name, ' · ') FROM public.accounts WHERE user_id = dono);
  END IF;

  SELECT id INTO id_habitacao   FROM public.areas WHERE user_id = dono AND name = 'Habitação';
  SELECT id INTO id_assinaturas FROM public.areas WHERE user_id = dono AND name = 'Assinaturas';
  SELECT id INTO id_emprestimos FROM public.areas WHERE user_id = dono AND name = 'Emprestimos e Parcelamentos';

  -- ----------------------------------------------------------
  -- Uma regra por conta, com 24 meses de ocorrências
  -- ----------------------------------------------------------
  FOR i IN 1 .. array_length(contas, 1) LOOP
    DECLARE
      v_descricao TEXT    := contas[i][1];
      v_valor     NUMERIC := contas[i][2]::NUMERIC;
      v_variavel  BOOLEAN := contas[i][3] = 'sim';
      v_area      UUID;
      v_categoria UUID;
    BEGIN
      v_area := CASE contas[i][4]
                  WHEN 'hab' THEN id_habitacao
                  WHEN 'ass' THEN id_assinaturas
                  ELSE id_emprestimos
                END;

      SELECT id INTO v_categoria
      FROM public.categories
      WHERE user_id = dono AND area_id = v_area AND name = contas[i][5];

      -- Já importada numa execução anterior? Pula.
      IF EXISTS (
        SELECT 1 FROM public.recorrencias
        WHERE user_id = dono AND descricao = v_descricao AND encerrada_em IS NULL
      ) THEN
        RAISE NOTICE 'Pulando "%": já existe.', v_descricao;
        CONTINUE;
      END IF;

      INSERT INTO public.recorrencias (
        user_id, tipo, descricao, valor, valor_variavel,
        area_id, categoria_id, conta_id, responsavel,
        frequencia, intervalo, dia_do_mes,
        inicio, fim_tipo, materializado_ate
      ) VALUES (
        dono, 'saida', v_descricao, v_valor, v_variavel,
        v_area, v_categoria, id_conta, 'casal',
        'mensal', 1, 10,
        DATE '2026-09-10', 'nunca',
        DATE '2026-09-10' + INTERVAL '23 months'
      )
      RETURNING id INTO nova_regra;

      -- Materializa 24 ocorrências, sempre no dia 10
      FOR data_ocorrencia IN
        SELECT (DATE '2026-09-10' + (n || ' months')::INTERVAL)::DATE
        FROM generate_series(0, 23) AS n
      LOOP
        INSERT INTO public.lancamentos (
          user_id, tipo, descricao, valor, valor_previsto, data,
          area_id, categoria_id, conta_id, responsavel,
          status, origem, recorrencia_id
        ) VALUES (
          dono, 'saida', v_descricao, v_valor, v_valor, data_ocorrencia,
          v_area, v_categoria, id_conta, 'casal',
          'previsto', 'manual', nova_regra
        );
      END LOOP;

      RAISE NOTICE 'Importada: % — R$ % %',
        v_descricao, v_valor, CASE WHEN v_variavel THEN '(variável)' ELSE '' END;
    END;
  END LOOP;

  RAISE NOTICE '---';
  RAISE NOTICE 'Total: % recorrências, % lançamentos.',
    (SELECT COUNT(*) FROM public.recorrencias WHERE user_id = dono),
    (SELECT COUNT(*) FROM public.lancamentos  WHERE user_id = dono);

END $$;


-- ============================================================
-- CONFERÊNCIA
-- ============================================================
-- SELECT r.descricao, r.valor, r.valor_variavel, a.name AS area,
--        c.name AS conta, COUNT(l.id) AS ocorrencias
-- FROM public.recorrencias r
-- LEFT JOIN public.areas    a ON a.id = r.area_id
-- LEFT JOIN public.accounts c ON c.id = r.conta_id
-- LEFT JOIN public.lancamentos l ON l.recorrencia_id = r.id
-- WHERE r.user_id = 'SEU_USER_ID'
-- GROUP BY r.descricao, r.valor, r.valor_variavel, a.name, c.name
-- ORDER BY a.name, r.descricao;
-- ============================================================
