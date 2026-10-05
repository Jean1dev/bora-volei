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

## Supabase na nuvem

1. Crie um projeto em [supabase.com](https://supabase.com). Escolha a região **São Paulo (sa-east-1)**.
2. Aplique a migration, de um destes dois jeitos:
   - **SQL Editor:** abra o SQL Editor, cole o conteúdo de `supabase/migrations/20261005000000_init.sql` e rode; ou
   - **CLI:**
     ```bash
     npx supabase login
     npx supabase link --project-ref <ref-do-projeto>
     npx supabase db push
     ```
3. Em **Project Settings → API**, copie a **Project URL** e a chave **anon / publishable**. Não use a `service_role`.
4. Em **Realtime → Settings**, deixe **desligada** a opção que restringe o acesso a canais privados. A lista ao vivo usa um canal público. Se ela ficar ligada, o app continua funcionando, mas a lista só atualiza quando a aba volta ao foco ou quando a página é recarregada.

## Deploy na Vercel

1. Suba o repositório para o GitHub e importe-o na Vercel. O framework (Next.js) é detectado sozinho.
2. Em **Settings → Environment Variables**, configure:

   | Variável | Valor |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave anon / publishable |
   | `NEXT_PUBLIC_SITE_URL` | URL pública do app, ex.: `https://boravolei.vercel.app` (usada nas meta tags e na imagem de prévia) |

3. Faça o deploy.
4. Teste a prévia colando o link de um jogo no WhatsApp ou no [opengraph.xyz](https://www.opengraph.xyz).

> O WhatsApp guarda a prévia em cache por um tempo. Se o número de vagas mudar, a prévia de um link já enviado pode demorar a atualizar.

## Estrutura

```
supabase/migrations/           schema, views, RLS, RPCs e trigger do realtime
scripts/testar-banco.mjs       testes de segurança/fila via chave anônima
assets/                        fonte Archivo usada na imagem Open Graph
src/app/                       rotas (páginas server + views client)
src/components/                Header, ListaJogadores, GameForm, GameRow, Segments, Toast, ícones
src/lib/                       acesso ao Supabase, formatação de datas, fila/sorteio, localStorage, compartilhamento
```
