# SPEC

Referência visual/estrutura: https://markosmourapersonal.vercel.app/ (não precisa acessar; a estrutura está abaixo).

## 1. Landing page (seções ligáveis e reordenáveis)
Hero (foto, nome, registro, subtítulo, CTA) · Planos (cards, selo "Mais escolhido", economia calculada, inclusos, link externo de checkout) · Sobre (texto + carrossel) · Resultados (carrossel + aviso "resultados individuais") · Como funciona (etapas) · Depoimentos (carrossel de prints) · FAQ (accordion) · CTA final · Rodapé (contatos, CNPJ opcional) · Botão flutuante WhatsApp com mensagem pré-preenchida.
3 templates: escuro premium, claro clean, vibrante. Tema = cores primária/destaque, par de fontes, raio.
Mobile first, animações ao rolar com `prefers-reduced-motion`.

## 2. Dados (migrations SQL em `supabase/migrations`)
- categories(id, name, slug, icon, registry_label, is_health)
- professionals(id, slug unique, status draft|published, category_id, name, registry, city, state, online, whatsapp, instagram, email, cnpj, theme jsonb, sections jsonb, seo jsonb, timestamps)
- plans(id, professional_id, name, price_cents, period_label, features text[], checkout_url, highlighted, position)
- media(id, professional_id, storage_path, kind hero|about|results|testimonials|logo, position, alt)
- reviews(id, professional_id, author_name, rating 1-5, comment, status pending|approved|rejected, ip_hash, created_at)
- events(id, professional_id, type view|whatsapp_click|checkout_click, created_at)
- briefings(id, professional_id, raw_text, ai_output jsonb, created_at)
RLS: público lê só publicados/aprovados; público insere só reviews (forçado pending) e events; resto só admin. Slugs reservados: admin, api, busca, login, categorias.

## 3. Editor (admin)
Split: formulário por etapas à esquerda, preview ao vivo à direita (desktop/tablet/celular). Clique no preview foca o campo. Autosave + desfazer/refazer. Checklist de campos "preencher" bloqueia publicação. Reordenar seções/imagens com dnd-kit, crop de imagem. Ações: preview em nova aba, publicar, despublicar, duplicar. Ao publicar: link, QR Code, compartilhar no WhatsApp.

## 4. IA
- Briefing: categoria, cidade (ou online), textarea livre, upload múltiplo drag-and-drop (compressão no cliente) com marcação de tipo (IA sugere via visão se eu não marcar).
- Rota server: Claude retorna JSON validado por schema Zod (seções, planos, FAQ, SEO, tema/template sugeridos). Se inválido: 1 tentativa de correção, depois erro claro.
- Loading animado por etapas (streaming se possível).
- Botão "Reescrever com IA" por campo: mais curto / persuasivo / formal / descontraído / instrução livre.
- System prompt: pt-BR, honesto, regras de produto do CLAUDE.md, calcular economia dos planos.
- Economia: prompts curtos, `max_tokens` adequado, enviar imagens redimensionadas.

## 5. Público
Home com busca (texto + categoria + cidade/online), categorias em destaque. Resultados: cards (foto, nome, categoria, cidade, estrelas, nº avaliações, "a partir de R$", WhatsApp), filtros na URL, ordenação, paginação, estado vazio. Avaliações na landing: honeypot + limite por IP + validação server; média só de aprovadas.

## 6. Dashboard
Login admin (Supabase Auth) + middleware em `/admin`. Visão geral (publicadas, rascunhos, views, cliques WhatsApp/checkout, avaliações pendentes). Lista de páginas com busca/filtros. Moderação de avaliações. CRUD de categorias. Ctrl+K. Tema claro/escuro.

## 7. SEO/qualidade
Metadata dinâmica, OG image gerada, sitemap, robots, JSON-LD (aggregateRating só com avaliações aprovadas). Lighthouse mobile > 90. Testes: schema da IA, slug, economia dos planos, RLS. README + `.env.example`. Nome provisório da marca em `config/site.ts` (sugira 3, use o 1º) + logo SVG simples.
