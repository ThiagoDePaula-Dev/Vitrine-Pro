import { createPublicClient } from "@/lib/supabase/public";
import { landingSchema, TEMPLATES, type LandingData } from "./schema";
import { sampleLanding } from "./sample";
import { isReserved } from "./utils";

/** Converte uma linha de `professionals` (+ categoria) no JSON da landing. */
export function rowToLanding(row: {
  name: string | null; registry: string | null; city: string | null; state: string | null;
  online: boolean; whatsapp: string | null; instagram: string | null; email: string | null; cnpj: string | null;
  theme: unknown; sections: unknown; seo: unknown;
  categories?: { is_health: boolean } | null;
}): LandingData | null {
  const r = landingSchema.safeParse({
    profile: {
      name: row.name ?? "", registry: row.registry ?? "", city: row.city ?? "", state: row.state ?? "",
      online: row.online, whatsapp: row.whatsapp ?? "", instagram: row.instagram ?? "",
      email: row.email ?? "", cnpj: row.cnpj ?? "",
    },
    theme: row.theme ?? {},
    sections: row.sections ?? [],
    seo: row.seo ?? {},
    isHealth: row.categories?.is_health ?? false,
    // a mensagem do WhatsApp mora dentro de `seo` (não há coluna própria)
    whatsappMessage: (row.seo as { whatsappMessage?: string } | null)?.whatsappMessage ?? "",
  });
  return r.success ? r.data : null;
}

export async function loadLanding(slug: string, templateOverride?: string): Promise<LandingData | null> {
  if (isReserved(slug)) return null;

  if (slug === "exemplo") {
    const t = TEMPLATES.find((x) => x === templateOverride);
    return t ? { ...sampleLanding, theme: { ...sampleLanding.theme, template: t } } : sampleLanding;
  }

  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("professionals")
    .select("name, registry, city, state, online, whatsapp, instagram, email, cnpj, theme, sections, seo, categories(is_health)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data) return null;
  return rowToLanding(data as unknown as Parameters<typeof rowToLanding>[0]);
}
