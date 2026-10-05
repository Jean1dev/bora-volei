# Bora Vôlei

Webapp mobile-first para organizar o vôlei com os amigos e achar jogos com vaga.

- Sem login: o jogador confirma só com o nome.
- O organizador gerencia o jogo por um **link secreto de admin**.
- O jogador pode desistir pelo mesmo celular, com um token guardado no `localStorage`.

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind v4 + Supabase (Postgres). O deploy é na Vercel.

## Rotas

| Rota | O que é |
| --- | --- |
| `/` | Início: "Criar jogo", "Jogos com vagas" e os jogos que este celular criou ou em que se inscreveu |
| `/novo` | Formulário de criar jogo. Depois de criar, mostra o link para compartilhar e o link de admin |
| `/j/[slug]` | Página do jogo (visão do jogador). Renderizada no servidor e com prévia própria no WhatsApp |
| `/j/[slug]/admin?t=TOKEN` | Painel do organizador: remover, editar, abrir vagas, repetir e sortear times |
| `/vagas` | Jogos futuros com `publico = true` e vagas sobrando |
| `/j/[slug]/opengraph-image` | Imagem dinâmica da prévia (1200×630) |

## Como funciona o banco

O schema completo fica em `supabase/migrations/20261005000000_init.sql`.

- **Sem campo de status.** Os primeiros N inscritos (N = `vagas`), em ordem de `criado_em`, são os confirmados. O resto é a lista de espera. Quando alguém sai, a fila anda sozinha.
- **RLS ativo** nas tabelas `jogos` e `inscricoes`. Elas não têm nenhuma policy, e os privilégios de `anon` e `authenticated` foram revogados. O cliente não lê nem escreve nelas.
- **Leitura** só pelas views `jogos_publicos` e `inscricoes_publicas`, que não têm `admin_token` nem `cancel_token`.
- **Escrita** só pelas funções RPC `security definer`. Todas validam token, tamanho e formato dos campos:

| Função | Retorno |
| --- | --- |
| `criar_jogo(dados)` | `{ slug, admin_token }` |
| `inscrever(p_slug, p_nome)` | `{ inscricao_id, cancel_token, posicao, confirmado }` |
| `cancelar_inscricao(p_inscricao_id, p_cancel_token)` | — |
| `admin_validar(p_slug, p_admin_token)` | se o link de admin é válido |
| `admin_remover_inscricao(p_slug, p_admin_token, p_inscricao_id)` | — |
| `admin_atualizar_jogo(p_slug, p_admin_token, dados)` | — (atualiza só as chaves enviadas, inclusive `publico`) |
| `repetir_jogo(p_slug, p_admin_token)` | novo slug, 7 dias depois, sem inscritos e com o mesmo token |

- **Lista ao vivo.** Um trigger envia um aviso vazio pelo Supabase Realtime (canal público `jogo:<id>`) quando a lista ou o jogo mudam. A página então relê os dados pelas views. Nenhum dado sensível passa pelo canal.

## Rodar localmente

Pré-requisitos: Node 20+ e Docker.

```bash
npm install
npx supabase start          # sobe o Supabase local (na primeira vez baixa as imagens)
npx supabase db reset       # aplica a migration
```

`npx supabase start` imprime a `API_URL` e a `ANON_KEY`. Crie o arquivo `.env.local` com elas:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY do supabase start>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Depois:

```bash
npm run dev                 # http://localhost:3000
npm test                    # testes unitários (datas, fila, sorteio)
npm run test:db             # testa RLS, RPCs e a fila contra o banco do .env.local
```

> `npm run test:db` cria jogos de teste no banco, então rode só no banco local.

## Produção e pipeline

- **Supabase:** projeto `bora-volei` (ref `puhqwwqvvyncltkhieby`, região `sa-east-1`, plano Free). Ele foi criado pela integração Supabase do Vercel Marketplace, então a cobrança e as chaves passam pela Vercel.
- **Vercel:** projeto `bora-volei` ligado ao repositório pela integração Git. Cada push na `main` gera o deploy de produção em https://bora-volei.vercel.app e cada PR gera um preview. A integração cria `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` sozinha. `NEXT_PUBLIC_SITE_URL` foi criada à mão.
- **GitHub Actions** (`.github/workflows/ci.yml`):
  - Em todo PR e push na `main`: `npm run lint`, typecheck (`next typegen` + `tsc`), `npm test` e `npm run build`.
  - Só no push na `main`, depois do CI passar: `supabase db push` aplica as migrations novas de `supabase/migrations/` no banco de produção.
  - O job de migration usa o environment `production` do GitHub, com o secret `SUPABASE_ACCESS_TOKEN` (token pessoal do Supabase), o secret `SUPABASE_DB_PASSWORD` e a variável `SUPABASE_PROJECT_ID`.

> A Vercel faz o deploy em paralelo com o Actions. Se uma mudança depender de uma migration nova, o deploy pode ficar pronto antes dela. Para evitar isso, ative **Settings → Deployment Checks** na Vercel e exija o check *Aplicar migrations (produção)*.

Para criar uma migration: `npx supabase migration new <nome>`, escreva o SQL, teste com `npx supabase db reset` e abra o PR.

Em **Realtime → Settings** do Supabase, deixe **desligada** a opção que restringe o acesso a canais privados. A lista ao vivo usa um canal público. Se a opção ficar ligada, o app continua funcionando, mas a lista só atualiza quando a aba volta ao foco ou quando a página é recarregada.

Teste a prévia do link colando o endereço de um jogo no WhatsApp ou no [opengraph.xyz](https://www.opengraph.xyz). O WhatsApp guarda a prévia em cache por um tempo.

## Estrutura

```
.github/workflows/ci.yml       CI + migrations na main
supabase/migrations/           schema, views, RLS, RPCs e trigger do realtime
scripts/testar-banco.mjs       testes de segurança/fila via chave anônima
assets/                        fonte Archivo usada na imagem Open Graph
src/app/                       rotas (páginas server + views client)
src/components/                Header, ListaJogadores, GameForm, GameRow, Segments, Toast, ícones
src/lib/                       acesso ao Supabase, formatação de datas, fila/sorteio, localStorage, compartilhamento
```
