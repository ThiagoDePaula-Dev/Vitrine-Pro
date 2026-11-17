import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { createPublicClient } from "@/lib/supabase/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed: MetadataRoute.Sitemap = ["", "/busca", "/categorias"].map((p) => ({ url: `${siteConfig.url}${p}`, changeFrequency: "daily", priority: p === "" ? 1 : 0.6 }));
  const supabase = createPublicClient();
  if (!supabase) return fixed;
  const { data } = await supabase.from("professionals").select("slug, updated_at").eq("status", "published").order("updated_at", { ascending: false }).limit(5000);
  return [
    ...fixed,
    ...(data ?? []).map((p) => ({ url: `${siteConfig.url}/${p.slug}`, lastModified: p.updated_at, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
