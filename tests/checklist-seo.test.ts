import { describe, expect, it } from "vitest";
import { missingFields } from "@/lib/landing/checklist";
import { emptyLanding } from "@/lib/landing/defaults";
import { sampleLanding } from "@/lib/landing/sample";
import { buildJsonLd, jsonLdScript } from "@/lib/seo";

describe("checklist de publicação", () => {
  const meta = { slug: "pagina-abc123", categoryId: null, registryLabel: "CREF" };
  it("página vazia: tudo precisa ser preenchido", () => {
    const keys = missingFields(emptyLanding(), meta).map((m) => m.key);
    expect(keys).toEqual(expect.arrayContaining(["categoryId", "slug", "profile.name", "profile.whatsapp", "profile.registry", "hero.title", "hero.image", "about.text"]));
  });
  it("slug provisório (pagina-…) bloqueia a publicação", () => {
    expect(missingFields(sampleLanding, { ...meta, categoryId: "c" }).map((m) => m.key)).toContain("slug");
  });
  it("seção desligada não exige preenchimento", () => {
    const d = structuredClone(emptyLanding());
    d.sections.find((s) => s.type === "about")!.enabled = false;
    expect(missingFields(d, meta).map((m) => m.key)).not.toContain("about.text");
  });
  it("plano sem preço ou checkout é apontado por item", () => {
    const d = structuredClone(sampleLanding);
    const plans = d.sections.find((s) => s.type === "plans");
    if (plans?.type !== "plans") throw new Error();
    plans.items[0].priceCents = null;
    const keys = missingFields(d, { slug: "ok", categoryId: "c", registryLabel: null }).map((m) => m.key);
    expect(keys).toContain("plans.items.0.priceCents");
    expect(keys).toContain("plans.items.0.checkoutUrl");
  });
});

describe("JSON-LD", () => {
  it("aggregateRating só existe com avaliações aprovadas", () => {
    expect(buildJsonLd(sampleLanding, "https://x/y", null)).not.toHaveProperty("aggregateRating");
    expect(buildJsonLd(sampleLanding, "https://x/y", { avg: null, count: 0 })).not.toHaveProperty("aggregateRating");
    expect(buildJsonLd(sampleLanding, "https://x/y", { avg: 4.5, count: 2 })).toMatchObject({
      aggregateRating: { ratingValue: 4.5, reviewCount: 2 },
    });
  });
  it("escapa '<' para não fechar a tag <script>", () => {
    const out = jsonLdScript({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out).name).toBe("</script><script>alert(1)</script>");
  });
});
