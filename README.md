# Achei Pro — landing pages + diretório de profissionais

Plataforma em que **um admin** gera landing pages de profissionais (personal, psicólogo, barbeiro…) a partir de briefing + fotos com IA, ajusta num editor com preview e publica em `/[slug]`. O site público tem busca por categoria/cidade, avaliações moderadas e contato por WhatsApp.

Especificação: [docs/SPEC.md](docs/SPEC.md) · Progresso: [docs/PROGRESSO.md](docs/PROGRESSO.md) · Regras do projeto: [CLAUDE.md](CLAUDE.md)

## Stack
Next.js 16 (App Router, `cacheComponents`, `proxy.ts`) + TypeScript · Tailwind 4 · Framer Motion · Embla · dnd-kit · react-hook-form + Zod · Supabase (Postgres, Auth, Storage, RLS) · `@anthropic-ai/sdk` · Vitest.

## Como rodar
```bash
npm install
cp .env.example .env.local   # preencha (veja abaixo)
npm run dev                   # http://localhost:3000
```

### 1. Supabase
1. Crie um projeto e aplique, **em ordem**, `supabase/migrations/001…005_*.sql` (SQL Editor ou `supabase db push`), depois `supabase/seed.sql` (categorias).
2. Crie seu usuário em *Authentication → Users* e defina no `app_metadata` (não em `user_metadata`): `{"role": "admin"}`. Só quem tem isso entra em `/admin`.
3. O bucket público `media` é criado pela migration 003.

### 2. Variáveis (`.env.local`)
| Variável | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cliente (protegido por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **só servidor**; hoje reservada (nenhuma rota a usa) |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | **só servidor**; geração e "Reescrever com IA" (ex.: `claude-opus-5-5`; `claude-sonnet-5-5` é mais barato) |
| `REVIEW_IP_SALT` | sal do hash de IP das avaliações (string aleatória longa) |
| `NEXT_PUBLIC_SITE_URL` | URL pública (links, QR Code, sitemap, OG) |

### 3. Primeiro uso
`/login` → `/admin` → **Gerar com IA** (briefing + fotos) ou **Página em branco** → editar → checklist → **Publicar**. Veja o exemplo sem banco em `/exemplo?template=dark|light|vibrant`.

## Scripts
| Comando | O que faz |
|---|---|
| `npm run dev` / `build` / `start` | desenvolvimento / build / produção |
| `npm run lint` | ESLint |
| `npm test` | Vitest (schema da IA, slug, economia dos planos, checklist, JSON-LD) |

**Testes de RLS** são de integração e só rodam contra um Supabase **de teste** com as migrations aplicadas (`supabase start`):
```bash
RLS_SUPABASE_URL=http://127.0.0.1:54321 RLS_ANON_KEY=… RLS_SERVICE_KEY=… npm test
```
Sem essas variáveis eles são pulados. Eles criam e apagam linhas: nunca aponte para produção.

## Estrutura
```
supabase/migrations   schema, RLS, storage, busca, avaliações e grants por coluna
src/lib/landing       schema Zod, temas, checklist, slug, persistência
src/lib/ai            prompts, schema da saída da IA, composição
src/components        landing/ (público), editor/, briefing/, directory/, admin/
src/app               / /busca /categorias /[slug] · /admin/* · /api/ai/*
config: src/config/site.ts (nome da marca; sugestões: Achei Pro, Pro Perto, Vitrine Local)
```

## Regras de produto (não negociáveis)
- A IA nunca inventa depoimentos, avaliações, preços, registros ou contatos: campo vazio = "preencher" (e o checklist bloqueia publicar).
- Categorias de saúde: sem promessas de resultado; "antes e depois" desligado por padrão.
- Avaliações só aparecem após aprovação do admin; a média usa apenas as aprovadas.
- Nenhuma chave secreta no cliente; RLS em todas as tabelas.

## Limitações conhecidas
- Autosave em página publicada altera o site na hora.
- Slug inexistente responde HTTP 200 (com noindex) por causa do streaming com `cacheComponents`.
- Lighthouse mobile não foi medido neste ambiente; rode no deploy.
