import { z } from "zod";
import { FONT_PAIRS, TEMPLATES } from "@/lib/landing/schema";

export const IMAGE_KINDS = ["hero", "about", "results", "testimonials", "logo"] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];

/**
 * Saída pedida ao Claude (structured outputs). Propositalmente sem contatos, registro, CNPJ,
 * links de checkout, depoimentos ou avaliações: esses campos o modelo nem tem como preencher.
 * Todos os campos são obrigatórios (vazio = ""), o que mantém o JSON Schema simples e estrito.
 */
export const aiOutputSchema = z.object({
  template: z.enum(TEMPLATES),
  fontPair: z.enum(FONT_PAIRS),
  hero: z.object({ eyebrow: z.string(), title: z.string(), subtitle: z.string(), ctaLabel: z.string() }),
  about: z.object({ title: z.string(), text: z.string() }),
  how: z.object({ title: z.string(), steps: z.array(z.object({ title: z.string(), text: z.string() })) }),
  plans: z.object({
    title: z.string(),
    subtitle: z.string(),
    items: z.array(z.object({
      name: z.string(),
      periodMonths: z.number().int(),
      priceCents: z.number().int().nullable(), // só se o briefing trouxe o valor exato; senão null
      features: z.array(z.string()),
      highlighted: z.boolean(),
    })),
  }),
  faq: z.object({ title: z.string(), items: z.array(z.object({ q: z.string(), a: z.string() })) }),
  cta: z.object({ title: z.string(), text: z.string(), ctaLabel: z.string() }),
  seo: z.object({ title: z.string(), description: z.string() }),
  // Tipo sugerido para as imagens que o admin não marcou (índice = posição no envio).
  imageKinds: z.array(z.object({ index: z.number().int(), kind: z.enum(IMAGE_KINDS) })),
});
export type AiOutput = z.infer<typeof aiOutputSchema>;

/** Corpo aceito por /api/ai/generate. */
export const generateRequestSchema = z.object({
  professionalId: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  city: z.string().trim().max(80).default(""),
  state: z.string().trim().max(2).default(""),
  online: z.boolean().default(false),
  whatsapp: z.string().trim().max(20).default(""),
  text: z.string().trim().min(10, "Descreva o profissional com mais detalhes").max(8000),
  images: z.array(z.object({
    url: z.string().url(),
    kind: z.enum(IMAGE_KINDS).nullable(), // null = IA sugere
  })).max(8).default([]),
});
export type GenerateRequest = z.infer<typeof generateRequestSchema>;

export const REWRITE_MODES = ["shorter", "persuasive", "formal", "casual", "custom"] as const;
export const rewriteRequestSchema = z.object({
  text: z.string().trim().min(1).max(4000),
  mode: z.enum(REWRITE_MODES),
  instruction: z.string().trim().max(300).optional(),
  fieldLabel: z.string().max(80).default("texto"),
  isHealth: z.boolean().default(false),
}).refine((v) => v.mode !== "custom" || !!v.instruction, { message: "Informe a instrução" });
