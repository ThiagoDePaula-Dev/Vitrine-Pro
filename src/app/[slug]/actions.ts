"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";

export type ReviewState = { ok: boolean; message: string } | null;

const schema = z.object({
  professionalId: z.string().uuid(),
  author: z.string().trim().min(1, "Informe seu nome").max(80, "Nome muito longo"),
  rating: z.coerce.number().int().min(1, "Escolha uma nota").max(5, "Escolha uma nota"),
  comment: z.string().trim().max(1000, "Comentário muito longo (máx. 1000 caracteres)").optional(),
});

const MESSAGES: Record<string, string> = {
  rate_limited: "Você já enviou uma avaliação recentemente. Tente novamente amanhã.",
  not_found: "Página não encontrada.",
  invalid: "Dados inválidos.",
};

/**
 * Envio público de avaliação. Camadas: honeypot → validação Zod → hash do IP → função SQL
 * `submit_review` (limite por IP, status sempre 'pending'). Só aparece após aprovação do admin.
 */
export async function submitReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  // Honeypot: campo escondido que humanos não preenchem. Finge sucesso para não ensinar o bot.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { ok: true, message: "Obrigado! Sua avaliação será publicada após moderação." };
  }

  const parsed = schema.safeParse({
    professionalId: formData.get("professionalId"),
    author: formData.get("author"),
    rating: formData.get("rating"),
    comment: formData.get("comment") ?? undefined,
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  const salt = process.env.REVIEW_IP_SALT ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const ipHash = createHash("sha256").update(`${salt}:${ip}`).digest("hex");

  const supabase = createPublicClient();
  if (!supabase) return { ok: false, message: "Serviço indisponível." };
  const { data, error } = await supabase.rpc("submit_review", {
    p_professional: parsed.data.professionalId,
    p_author: parsed.data.author,
    p_rating: parsed.data.rating,
    p_comment: parsed.data.comment ?? "",
    p_ip_hash: ipHash,
  });
  if (error) return { ok: false, message: "Não foi possível enviar agora. Tente novamente." };
  if (data !== "ok") return { ok: false, message: MESSAGES[data as string] ?? "Não foi possível enviar." };
  return { ok: true, message: "Obrigado! Sua avaliação será publicada após moderação." };
}
