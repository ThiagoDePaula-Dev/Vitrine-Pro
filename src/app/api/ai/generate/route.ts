import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAi } from "@/lib/ai/client";
import { composeLanding } from "@/lib/ai/compose";
import { GENERATE_SYSTEM } from "@/lib/ai/prompts";
import { aiOutputSchema, generateRequestSchema, type GenerateRequest } from "@/lib/ai/schema";
import { landingSchema } from "@/lib/landing/schema";
import { landingToRow } from "@/lib/landing/persist";
import { createClient, isAdminUser } from "@/lib/supabase/server";

export const maxDuration = 300;

type MediaType = "image/jpeg" | "image/png" | "image/webp";

/** Só baixa imagens do nosso bucket (evita SSRF) e as envia ao Claude em base64. */
async function loadImages(req: GenerateRequest) {
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${req.professionalId}/`;
  return Promise.all(req.images.map(async (img) => {
    if (!img.url.startsWith(prefix)) throw new Error("Imagem inválida");
    const r = await fetch(img.url);
    if (!r.ok) throw new Error("Não foi possível ler uma das imagens");
    const type = (r.headers.get("content-type") ?? "image/webp") as MediaType;
    return { data: Buffer.from(await r.arrayBuffer()).toString("base64"), type };
  }));
}

function buildUserContent(req: GenerateRequest, category: string, images: Awaited<ReturnType<typeof loadImages>>) {
  const content: Anthropic.ContentBlockParam[] = [];
  images.forEach((im, i) => {
    const kind = req.images[i].kind;
    content.push({ type: "text", text: `Imagem ${i} — ${kind ? `tipo definido: ${kind}` : "SEM tipo (sugira em imageKinds)"}` });
    content.push({ type: "image", source: { type: "base64", media_type: im.type, data: im.data } });
  });
  const place = req.online && !req.city ? "online" : [req.city, req.state].filter(Boolean).join("/") + (req.online ? " (também online)" : "");
  content.push({
    type: "text",
    text: `Categoria: ${category}\nNome: ${req.name}\nLocal: ${place || "não informado"}\n\nBriefing:\n${req.text}`,
  });
  return content;
}

function textOf(msg: Anthropic.Message) {
  return msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminUser(user)) return new Response("Não autorizado", { status: 401 });

  const parsedReq = generateRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsedReq.success) {
    return new Response(parsedReq.error.issues[0]?.message ?? "Dados inválidos", { status: 400 });
  }
  const req = parsedReq.data;

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: object) => controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      try {
        const { client, model } = getAi();
        send({ type: "step", id: "briefing" });

        const { data: cat } = await supabase.from("categories").select("name, is_health").eq("id", req.categoryId).single();
        if (!cat) throw new Error("Categoria não encontrada");
        const content = buildUserContent(req, cat.name, await loadImages(req));

        const format = zodOutputFormat(aiOutputSchema);
        const run = async (messages: Anthropic.MessageParam[], live: boolean) => {
          const s = client.messages.stream({ model, max_tokens: 8000, system: GENERATE_SYSTEM, messages, output_config: { format } });
          if (live) {
            const seen = new Set<string>();
            let acc = "";
            s.on("text", (t) => {
              acc += t;
              for (const [key, id] of [["hero", "texts"], ["plans", "plans"], ["faq", "faq"], ["seo", "seo"]] as const) {
                if (!seen.has(id) && acc.includes(`"${key}"`)) { seen.add(id); send({ type: "step", id }); }
              }
            });
          }
          return s.finalMessage();
        };

        const messages: Anthropic.MessageParam[] = [{ role: "user", content }];
        let msg = await run(messages, true);
        if (msg.stop_reason === "refusal") throw new Error("A IA recusou gerar esse conteúdo. Revise o briefing.");

        const validate = (m: Anthropic.Message) => {
          try { return aiOutputSchema.safeParse(JSON.parse(textOf(m))); }
          catch { return { success: false as const, error: { issues: [{ message: "JSON inválido ou truncado" }] } }; }
        };
        let result = validate(msg);
        if (!result.success) {
          // 1 tentativa de correção, enviando os erros de validação
          send({ type: "step", id: "validate" });
          const issues = result.error.issues.slice(0, 8).map((i) => ("path" in i ? `${i.path.join(".")}: ` : "") + i.message).join("; ");
          msg = await run([...messages, { role: "assistant", content: textOf(msg) || "{}" }, { role: "user", content: `O JSON não passou na validação (${issues}). Devolva o JSON completo e corrigido.` }], false);
          result = validate(msg);
          if (!result.success) throw new Error("A IA devolveu um conteúdo inválido duas vezes. Tente novamente ou simplifique o briefing.");
        }

        send({ type: "step", id: "validate" });
        const landing = landingSchema.safeParse(composeLanding(result.data, req, cat.is_health));
        if (!landing.success) throw new Error("Conteúdo gerado fora do formato esperado.");

        send({ type: "step", id: "save" });
        const { slug: _slug, ...row } = landingToRow(landing.data, "", req.categoryId);
        void _slug; // o slug do rascunho é mantido
        const { error } = await supabase.from("professionals").update(row).eq("id", req.professionalId);
        if (error) throw new Error("Não foi possível salvar o rascunho.");
        await supabase.from("briefings").insert({ professional_id: req.professionalId, raw_text: req.text, ai_output: result.data });

        send({ type: "done", id: req.professionalId });
      } catch (e) {
        send({ type: "error", message: e instanceof Error ? e.message : "Erro inesperado" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" } });
}
