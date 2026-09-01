# Controle Financeiro

Central de controle financeiro doméstico: lançamento diário de receitas e despesas,
previsibilidade das contas a pagar e acompanhamento da fatura do cartão.

Uso pessoal (John + Amanda).

## O que o app resolve

Três perguntas, cada uma vinda de um método diferente:

| Pergunta | Método | Eixo |
|---|---|---|
| Para onde meu dinheiro foi? | 50-35-15 | área → categoria |
| O que tenho a pagar, e quando? | Plano de Contas | vencimento |
| Como estou hoje? | Termômetro | dia |

São camadas de visão sobre o mesmo lançamento, não modos alternativos.
A documentação completa está no vault, em `C01 - Claude Code/produtos/controle-financeiro/`.

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS** + shadcn/ui
- **Supabase** — Postgres com RLS, autenticação e compartilhamento entre membros

## Rodando localmente

Requer Node 20+.

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase
npm run dev
```

Abra http://localhost:3000. A primeira compilação de cada rota leva alguns segundos;
depois disso a navegação é instantânea.

### Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha com os valores de
**Project Settings → API** no dashboard do Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

A chave `anon` é pública por natureza — quem protege os dados é a RLS, não o segredo da chave.
Nunca versione `.env.local`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Roda o build de produção |
| `npm run lint` | Verificação de lint |

## Estrutura

```
src/
├── app/                    # rotas (App Router)
│   ├── auth/               # login, cadastro, recuperação de senha
│   ├── layout.tsx
│   └── page.tsx
├── components/             # componentes da aplicação
│   └── ui/                 # shadcn/ui
├── hooks/                  # hooks herdados da versão anterior (em migração)
├── integrations/supabase/  # tipos gerados do banco
├── lib/supabase/           # clients: server, browser e middleware
├── types/                  # tipos de domínio
└── middleware.ts           # renova a sessão e protege as rotas

supabase/migrations/        # schema versionado
```

## Autenticação

A sessão vive em cookies (`@supabase/ssr`), o que a torna legível no servidor.
O `middleware.ts` renova a sessão a cada request e barra acesso não autenticado
antes de qualquer render — a proteção não depende do browser.

Login, cadastro e recuperação de senha são Server Actions: as credenciais não
passam pelo bundle do cliente.

## Banco de dados

O schema fica em `supabase/migrations/`, versionado junto do código.
Todas as tabelas têm RLS, com políticas para o dono dos dados e para membros
com acesso compartilhado (`has_shared_access`, `get_effective_owner_id`).
Há validação no servidor para valores monetários, limite de cartão e sanitização
de texto — o cliente não é a única linha de defesa.
