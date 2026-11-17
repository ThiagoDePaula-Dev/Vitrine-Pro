import { getAi } from "@/lib/ai/client";
import { REWRITE_INSTRUCTIONS, REWRITE_SYSTEM } from "@/lib/ai/prompts";
import { rewriteRequestSchema } from "@/lib/ai/schema";
import { createClient, isAdminUser } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminUser(user)) return Response.json({ error: "Não autorizado" }, { status: 401 });

  const parsed = rewriteRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  const { text, mode, instruction, fieldLabel, isHealth } = parsed.data;

  try {
    const { client, model } = getAi();
    const how = mode === "custom" ? instruction! : REWRITE_INSTRUCTIONS[mode];
    const msg = await client.messages.create({
      model,
      max_tokens: 4096, // folga para modelos que sempre "pensam" (o thinking conta no limite)
      system: REWRITE_SYSTEM + (isHealth ? "\nCategoria de saúde: sem promessas de resultado." : ""),
      messages: [{ role: "user", content: `Campo: ${fieldLabel}\nInstrução: ${how}\n\nTexto original:\n${text}` }],
    });
    if (msg.stop_reason === "refusal") return Response.json({ error: "A IA recusou reescrever esse texto." }, { status: 422 });
    const out = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
    if (!out) return Response.json({ error: "A IA não devolveu texto. Tente de novo." }, { status: 502 });
    return Response.json({ text: out });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Erro ao reescrever" }, { status: 500 });
  }
}
