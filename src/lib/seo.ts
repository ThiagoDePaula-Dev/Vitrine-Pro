import type { LandingData } from "./landing/schema";

type Rating = { avg: number | null; count: number } | null | undefined;

/** Título/descrição de SEO com fallback para os dados do perfil. */
export function seoText(d: LandingData) {
  const hero = d.sections.find((s) => s.type === "hero");
  const title = d.seo.title || d.profile.name;
  const description = d.seo.description || (hero?.type === "hero" ? hero.subtitle : "") || "";
  return { title, description };
}

/**
 * JSON-LD (schema.org ProfessionalService). `aggregateRating` só existe quando há avaliações
 * APROVADAS (quem chama passa apenas as aprovadas) — nunca inventamos nota.
 */
export function buildJsonLd(d: LandingData, url: string, rating?: Rating) {
  const { title, description } = seoText(d);
  const hero = d.sections.find((s) => s.type === "hero");
  const image = hero?.type === "hero" ? hero.image.url : "";
  const p = d.profile;
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: p.name || title,
    url,
  };
  if (description) ld.description = description;
  if (image) ld.image = image;
  if (p.city || p.state) {
    ld.address = { "@type": "PostalAddress", ...(p.city && { addressLocality: p.city }), ...(p.state && { addressRegion: p.state }), addressCountry: "BR" };
  }
  if (p.instagram) ld.sameAs = [`https://instagram.com/${p.instagram.replace(/^@/, "")}`];
  if (rating && rating.avg != null && rating.count > 0) {
    ld.aggregateRating = { "@type": "AggregateRating", ratingValue: rating.avg, reviewCount: rating.count, bestRating: 5, worstRating: 1 };
  }
  return ld;
}

/** Serializa para <script type="application/ld+json"> sem permitir fechar a tag (`<` escapado). */
export const jsonLdScript = (ld: unknown) => JSON.stringify(ld).replace(/</g, "\\u003c");
