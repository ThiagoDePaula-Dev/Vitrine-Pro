# Projeto: plataforma de landing pages + diretório de profissionais

Admin (só eu) gera landing pages de profissionais (personal, psicólogo, barbeiro...) a partir de briefing + fotos via IA, ajusta num editor com preview e publica em `/[slug]`. Site público: busca por categoria/cidade, avaliações moderadas, contato por WhatsApp.

Especificação completa: `docs/SPEC.md` — leia só a seção da fase atual.
Progresso: `docs/PROGRESSO.md` — atualize ao fim de cada fase (3–5 linhas).

## Stack
Next.js (App Router) + TS, Tailwind + shadcn/ui, Framer Motion, Embla, react-hook-form + Zod, dnd-kit, Supabase (Postgres/Auth/Storage/RLS), `@anthropic-ai/sdk` (modelo em `ANTHROPIC_MODEL`), deploy Vercel.

## Regras de trabalho (economia de tokens)
- Respostas curtas. Sem resumos longos do que fez; liste só arquivos alterados e próximos passos.
- Não releia arquivos que acabou de editar. Não abra `node_modules`, `.next`, lockfiles.
- Use `grep`/busca antes de abrir arquivos inteiros.
- Mudanças pequenas e incrementais; rode `npm run build` e `npm run lint` só ao fim de cada etapa.
- Antes de codar uma fase: plano curto (até 10 linhas) e espere meu "ok".
- Ao encontrar erro: explique em 1–2 linhas e corrija.

## Regras de produto (não negociáveis)
- IA nunca inventa depoimentos, avaliações, preços, registros ou contatos: campo vazio = "preencher".
- Categorias de saúde: sem promessas de resultado; "antes e depois" desligado por padrão.
- Avaliações só aparecem após aprovação do admin.
- Nenhuma chave secreta no cliente; RLS em todas as tabelas.
