-- ============================================================
-- CONTROLE FINANCEIRO — 03 de 03 · DADOS INICIAIS
-- ============================================================
-- Semeia as 10 áreas e suas categorias, a partir da planilha real
-- do John (Controle Financeiro - 2026.xlsx), não de uma lista genérica.
--
-- Aplicar DEPOIS de 01-estrutura.sql e 02-seguranca.sql.
--
-- ANTES DE RODAR: substitua SEU_USER_ID abaixo pelo id da sua conta.
-- Para descobrir:  SELECT id, email FROM auth.users;
--
-- O id vai fixo porque o SQL Editor roda como administrador do banco,
-- sem sessão de usuário — auth.uid() volta nulo nele.
--
-- Pode rodar mais de uma vez sem duplicar: ignora o que já existe.
-- ============================================================

DO $$
DECLARE
  dono UUID := 'SEU_USER_ID';
  id_habitacao   UUID;
  id_alimentacao UUID;
  id_saude       UUID;
  id_transporte  UUID;
  id_educacao    UUID;
  id_pessoais    UUID;
  id_lazer       UUID;
  id_assinaturas UUID;
  id_emprestimos UUID;
  id_cnpj        UUID;
BEGIN

  -- Confere que o usuário existe antes de criar qualquer coisa
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = dono) THEN
    RAISE EXCEPTION 'Usuário % não existe em auth.users.', dono;
  END IF;

  -- ----------------------------------------------------------
  -- ÁREAS · com a classificação 50-35-15
  -- ----------------------------------------------------------
  -- fixo         = o que não dá para cortar sem mudar de vida
  -- prioridade   = o que constrói futuro (dívida, investimento)
  -- estilo_vida  = o que é escolha do dia a dia

  INSERT INTO public.areas (user_id, name, color, classificacao) VALUES
    (dono, 'Habitação',                   '#3B6E8F', 'fixo'),
    (dono, 'Alimentação',                 '#4E8F6E', 'fixo'),
    (dono, 'Saúde',                       '#8F5A5A', 'fixo'),
    (dono, 'Transporte',                  '#8F7A3B', 'fixo'),
    (dono, 'Educação',                    '#6E5A8F', 'prioridade'),
    (dono, 'Despesas Pessoais',           '#8F6E4E', 'estilo_vida'),
    (dono, 'Lazer',                       '#8F4E7A', 'estilo_vida'),
    (dono, 'Assinaturas',                 '#5A7A8F', 'estilo_vida'),
    (dono, 'Emprestimos e Parcelamentos', '#7A4E4E', 'prioridade'),
    (dono, 'Contas CNPJ',                 '#4E6E7A', 'fixo')
  ON CONFLICT DO NOTHING;

  SELECT id INTO id_habitacao   FROM public.areas WHERE user_id = dono AND name = 'Habitação';
  SELECT id INTO id_alimentacao FROM public.areas WHERE user_id = dono AND name = 'Alimentação';
  SELECT id INTO id_saude       FROM public.areas WHERE user_id = dono AND name = 'Saúde';
  SELECT id INTO id_transporte  FROM public.areas WHERE user_id = dono AND name = 'Transporte';
  SELECT id INTO id_educacao    FROM public.areas WHERE user_id = dono AND name = 'Educação';
  SELECT id INTO id_pessoais    FROM public.areas WHERE user_id = dono AND name = 'Despesas Pessoais';
  SELECT id INTO id_lazer       FROM public.areas WHERE user_id = dono AND name = 'Lazer';
  SELECT id INTO id_assinaturas FROM public.areas WHERE user_id = dono AND name = 'Assinaturas';
  SELECT id INTO id_emprestimos FROM public.areas WHERE user_id = dono AND name = 'Emprestimos e Parcelamentos';
  SELECT id INTO id_cnpj        FROM public.areas WHERE user_id = dono AND name = 'Contas CNPJ';


  -- ----------------------------------------------------------
  -- CATEGORIAS
  -- ----------------------------------------------------------

  INSERT INTO public.categories (user_id, area_id, name) VALUES

    -- Habitação
    (dono, id_habitacao, 'Financiamento'),
    (dono, id_habitacao, 'Aluguel (+ Taxas)'),
    (dono, id_habitacao, 'Condomínio'),
    (dono, id_habitacao, 'Condomínio - Parcelamento'),
    (dono, id_habitacao, 'Conta de Água'),
    (dono, id_habitacao, 'Conta de Energia'),
    (dono, id_habitacao, 'Conta de Gás'),
    (dono, id_habitacao, 'Internet'),
    (dono, id_habitacao, 'Materiais / Utensílios'),
    (dono, id_habitacao, 'Outros'),

    -- Alimentação
    (dono, id_alimentacao, 'Supermercado'),
    (dono, id_alimentacao, 'Mercado'),
    (dono, id_alimentacao, 'Feira'),
    (dono, id_alimentacao, 'Açougue'),
    (dono, id_alimentacao, 'Empório'),
    (dono, id_alimentacao, 'Padaria'),
    (dono, id_alimentacao, 'Adega'),
    (dono, id_alimentacao, 'Água Galão'),
    (dono, id_alimentacao, 'Pizzaria'),
    (dono, id_alimentacao, 'Outros'),

    -- Saúde
    (dono, id_saude, 'Plano de Saúde'),
    (dono, id_saude, 'Psicólogo'),
    (dono, id_saude, 'Dentista'),
    (dono, id_saude, 'Medicamentos'),
    (dono, id_saude, 'Outros'),

    -- Transporte
    (dono, id_transporte, 'Recarga Transporte'),
    (dono, id_transporte, 'BOM Unitário'),
    (dono, id_transporte, 'Ônibus'),
    (dono, id_transporte, 'Metrô'),
    (dono, id_transporte, 'Trem'),
    (dono, id_transporte, 'Uber'),
    (dono, id_transporte, 'Combustível'),
    (dono, id_transporte, 'Estacionamentos'),
    (dono, id_transporte, 'Lavagens'),
    (dono, id_transporte, 'Mecânico'),
    (dono, id_transporte, 'Multas'),
    (dono, id_transporte, 'IPVA + Seguro Obrigatório'),
    (dono, id_transporte, 'Seguro'),
    (dono, id_transporte, 'CNH'),

    -- Educação
    (dono, id_educacao, 'Faculdade'),
    (dono, id_educacao, 'Curso de Enfermagem'),
    (dono, id_educacao, 'Ensino à Distância'),
    (dono, id_educacao, 'Material escolar'),
    (dono, id_educacao, 'Uniformes'),
    (dono, id_educacao, 'Outros'),

    -- Despesas Pessoais
    (dono, id_pessoais, 'Higiene Pessoal'),
    (dono, id_pessoais, 'Cosméticos'),
    (dono, id_pessoais, 'Barbeiro'),
    (dono, id_pessoais, 'Cabeleireiro'),
    (dono, id_pessoais, 'Vestuário'),
    (dono, id_pessoais, 'Calçados'),
    (dono, id_pessoais, 'Academia'),
    (dono, id_pessoais, 'Esportes'),
    (dono, id_pessoais, 'Pet'),
    (dono, id_pessoais, 'Pet - Tosa e Banho'),
    (dono, id_pessoais, 'Cartões de Crédito (anuidades)'),
    (dono, id_pessoais, 'Mesadas'),
    (dono, id_pessoais, 'Outros'),

    -- Lazer
    (dono, id_lazer, 'Rolê'),
    (dono, id_lazer, 'Jantar fora'),
    (dono, id_lazer, 'Food'),
    (dono, id_lazer, 'Passeios'),
    (dono, id_lazer, 'Passagens'),
    (dono, id_lazer, 'Hospedagens'),
    (dono, id_lazer, 'Games'),
    (dono, id_lazer, 'Livraria, jornais e revistas'),
    (dono, id_lazer, 'Mídias e acessórios'),
    (dono, id_lazer, 'Presentes'),
    (dono, id_lazer, 'Outros'),

    -- Assinaturas
    (dono, id_assinaturas, 'TotalPass'),
    (dono, id_assinaturas, 'Netflix'),
    (dono, id_assinaturas, 'Amazon Prime'),
    (dono, id_assinaturas, 'Spotify'),
    (dono, id_assinaturas, 'Outros'),

    -- Empréstimos e Parcelamentos
    (dono, id_emprestimos, 'Empréstimo'),
    (dono, id_emprestimos, 'Parcelamento'),
    (dono, id_emprestimos, 'Renegociação'),
    (dono, id_emprestimos, 'Fatura Parcelada'),
    (dono, id_emprestimos, 'Outros'),

    -- Contas CNPJ
    (dono, id_cnpj, 'DAS - MEI'),
    (dono, id_cnpj, 'Parcelamento DAS'),
    (dono, id_cnpj, 'Mensalidade Contador'),
    (dono, id_cnpj, 'COFINS'),
    (dono, id_cnpj, 'ISS'),
    (dono, id_cnpj, 'PIS'),
    (dono, id_cnpj, 'IR'),
    (dono, id_cnpj, 'CSLL'),
    (dono, id_cnpj, 'Ferramentas'),
    (dono, id_cnpj, 'Outros'),

    -- Usada pelo fechamento de fatura quando o banco cobra
    -- diferente do que o sistema conhece (IOF, anuidade, juros)
    (dono, id_emprestimos, 'Ajuste de Fatura')

  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Pronto: % áreas e % categorias.',
    (SELECT COUNT(*) FROM public.areas      WHERE user_id = dono),
    (SELECT COUNT(*) FROM public.categories WHERE user_id = dono);

END $$;


-- ============================================================
-- CONFERÊNCIA · rode depois para ver o resultado
-- ============================================================
-- SELECT a.name AS area, a.classificacao, COUNT(c.id) AS categorias
-- FROM public.areas a
-- LEFT JOIN public.categories c ON c.area_id = a.id
-- WHERE a.user_id = 'SEU_USER_ID'
-- GROUP BY a.name, a.classificacao
-- ORDER BY a.name;
-- ============================================================
