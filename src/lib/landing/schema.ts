import { z } from "zod";

// Campo vazio = "preencher". Nada aqui é preenchido automaticamente com dados inventados.
const str = z.string().default("");
const strList = z.array(z.string()).default([]);

export const TEMPLATES = ["dark", "light", "vibrant"] as const;
export const FONT_PAIRS = ["modern", "elegant", "bold"] as const;
export const RADII = ["none", "sm", "md", "lg", "full"] as const;

export const themeSchema = z.object({
  template: z.enum(TEMPLATES).default("dark"),
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#e11d48"),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#f59e0b"),
  fontPair: z.enum(FONT_PAIRS).default("modern"),
  radius: z.enum(RADII).default("lg"),
});

export const profileSchema = z.object({
  name: str,
  registry: str, // ex.: "CREF 000000-G/UF" — nunca inventado
  city: str,
  state: str,
  online: z.boolean().default(false),
  whatsapp: str, // só dígitos com DDI, ex.: 5511999999999
  instagram: str,
  email: str,
  cnpj: str,
});

const base = { id: z.string(), enabled: z.boolean().default(true) };

export const planSchema = z.object({
  name: str,
  priceCents: z.number().int().nonnegative().nullable().default(null),
  periodMonths: z.number().int().positive().default(1),
  features: strList,
  checkoutUrl: str,
  highlighted: z.boolean().default(false),
});

const imageSchema = z.object({ url: str, alt: str });

export const sectionSchema = z.discriminatedUnion("type", [
  z.object({
    ...base,
    type: z.literal("hero"),
    eyebrow: str,
    title: str,
    subtitle: str,
    image: imageSchema.default({ url: "", alt: "" }),
    ctaLabel: str,
  }),
  z.object({
    ...base,
    type: z.literal("plans"),
    title: str,
    subtitle: str,
    items: z.array(planSchema).default([]),
  }),
  z.object({
    ...base,
    type: z.literal("about"),
    title: str,
    text: str,
    images: z.array(imageSchema).default([]),
  }),
  z.object({
    ...base,
    type: z.literal("results"),
    title: str,
    images: z.array(imageSchema).default([]),
    showBeforeAfter: z.boolean().default(false), // desligado por padrão
  }),
  z.object({
    ...base,
    type: z.literal("how"),
    title: str,
    steps: z.array(z.object({ title: str, text: str })).default([]),
  }),
  z.object({
    ...base,
    type: z.literal("testimonials"),
    title: str,
    images: z.array(imageSchema).default([]), // prints reais enviados pelo admin
  }),
  z.object({
    ...base,
    type: z.literal("faq"),
    title: str,
    items: z.array(z.object({ q: str, a: str })).default([]),
  }),
  z.object({ ...base, type: z.literal("cta"), title: str, text: str, ctaLabel: str }),
  z.object({ ...base, type: z.literal("footer"), text: str, showCnpj: z.boolean().default(false) }),
]);

export const seoSchema = z.object({ title: str, description: str });

export const landingSchema = z.object({
  profile: profileSchema,
  theme: themeSchema,
  sections: z.array(sectionSchema),
  seo: seoSchema.default({ title: "", description: "" }),
  isHealth: z.boolean().default(false),
  whatsappMessage: str, // mensagem pré-preenchida do botão; vazio = padrão
});

export type Theme = z.infer<typeof themeSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Plan = z.infer<typeof planSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type LandingData = z.infer<typeof landingSchema>;
export type SectionType = Section["type"];
