# Progresso

## Fase 1 — concluída
Next.js 16 (App Router, `cacheComponents` ligado, `proxy.ts` no lugar de middleware) + Supabase SSR. Migrations em `supabase/migrations` (001 schema, 002 RLS com `is_admin()` via `app_metadata.role='admin'`, 003 bucket `media`), `supabase/seed.sql` com categorias, `.env.example`.
Login em `/login`, `/admin` protegido no proxy e no layout. Para ter acesso: criar usuário no Supabase e setar `app_metadata: {"role":"admin"}`.
Build e lint ok. Migrations ainda não aplicadas em um projeto Supabase real.

## Fase 2 — concluída
Schema Zod (`src/lib/landing/schema.ts`), 3 templates via variáveis CSS (`themes.ts`), seções em `src/components/landing/`, `/[slug]` (lê `professionals` publicado; `/exemplo?template=dark|light|vibrant` usa dados fictícios de personal trainer). Planos/mídia/FAQ ficam dentro do JSON `sections` (tabelas `plans`/`media` ainda não usadas). Slug inexistente responde HTTP 200 com noindex (streaming com `cacheComponents`).

## Fase 3 — concluída (sem teste contra Supabase real)
Editor em `/admin/editor/[id]`: 6 etapas, preview ao vivo em iframe (desktop/tablet/celular, clique no preview foca o campo), desfazer/refazer, autosave 1,5 s, dnd-kit (seções, itens, imagens), upload com crop para o bucket `media`, checklist "preencher" (revalidado no servidor ao publicar), publicar/despublicar/duplicar, link + QR + WhatsApp. Lista em `/admin`, preview do rascunho em `/admin/preview/[id]`.
Decisões: estado próprio em vez de react-hook-form (undo + preview); autosave em página publicada altera o site na hora; shadcn/ui não foi instalado (Tailwind puro).

## Fase 4 — concluída (sem chamada real à API/Supabase)
Briefing em `/admin/briefing` (RHF+Zod, drag-and-drop, compressão WebP 1280px no cliente, tipo por imagem ou "IA decide") → `POST /api/ai/generate` (admin only, stream NDJSON com etapas): Claude via structured outputs (`zodOutputFormat`), validação Zod, 1 correção e depois erro claro; salva rascunho + `briefings`. Schema da IA (`src/lib/ai/schema.ts`) não tem contatos, registro, CNPJ, checkout nem depoimentos; preço só se vier no briefing; economia calculada em código. Só baixa imagens do próprio bucket (anti-SSRF). "Reescrever com IA" (`✨ IA`) em campos de texto do editor: curto/persuasivo/formal/descontraído/livre, com prévia e aceitar (entra no desfazer) via `/api/ai/rewrite`.
Modelo vem de `ANTHROPIC_MODEL` (exemplo: `claude-opus-5-5`; `claude-sonnet-5-5` é mais barato). Sem fallback de recusa configurado.

## Fase 5 — concluída (SQL novo ainda não aplicado/testado num Supabase real)
Migration `004_directory.sql`: `search_professionals` (sem acento, categoria/cidade/online, ordenação, paginação, nota só de aprovadas, "a partir de" mensal e foto lidos do JSON) e `submit_review` (security definer: 1 avaliação/profissional e 5 no total por IP a cada 24h, sempre `pending`); a policy de INSERT direto em `reviews` foi removida.
Público: `/` (busca + categorias), `/busca` (filtros na URL, ordenação, paginação, estado vazio), `/categorias`, cards com estrelas/preço/WhatsApp. Landing: bloco de avaliações antes do rodapé (média só de aprovadas), formulário com honeypot + hash de IP (`REVIEW_IP_SALT`) + Zod. Moderação mínima em `/admin/avaliacoes` (aprovar/rejeitar); a Fase 6 estende. Eventos (`events`) ainda não são gravados.

## Fase 6 — concluída (sem teste em Supabase real; Lighthouse não medido)
Admin: shell com tema claro/escuro e Ctrl+K (`AdminShell`), visão geral (publicadas, rascunhos, views, cliques WhatsApp/checkout em 30 dias, avaliações pendentes), `/admin/paginas` (busca + filtros), `/admin/categorias` (CRUD), moderação de avaliações. `Tracker` grava `events` na landing (view 1x/sessão + cliques `data-track`). QR Code com download PNG.
SEO: metadata/canonical/OG dinâmicos + `opengraph-image`, `sitemap.xml`, `robots.txt`, JSON-LD (`aggregateRating` só com aprovadas), imagem do hero com prioridade. Marca "Achei Pro" em `src/config/site.ts` + logo SVG.
Testes (Vitest, 45 passando): schema da IA/compose, slug, economia dos planos, checklist, JSON-LD; RLS em `tests/rls.test.ts` (integração, pulado sem `RLS_*`). README criado.

Migration `005_reviews_hide_ip_hash.sql` (revisão pós-Fase 6): anon não lê mais `reviews.ip_hash`.
