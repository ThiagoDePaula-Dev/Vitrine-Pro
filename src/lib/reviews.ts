import { createPublicClient } from "@/lib/supabase/public";

export type ReviewsData = {
  professionalId: string;
  avg: number | null;
  count: number;
  items: { id: string; author: string; rating: number; comment: string; date: string }[];
};

/** Avaliações aprovadas de uma página publicada (a RLS já esconde pendentes/rejeitadas). A média usa só as aprovadas. */
export async function loadReviews(slug: string): Promise<ReviewsData | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data: pro } = await supabase.from("professionals").select("id").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!pro) return null;
  const { data } = await supabase
    .from("reviews")
    .select("id, author_name, rating, comment, created_at")
    .eq("professional_id", pro.id)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = data ?? [];
  return {
    professionalId: pro.id,
    count: rows.length,
    avg: rows.length ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10) / 10 : null,
    items: rows.slice(0, 6).map((r) => ({ id: r.id, author: r.author_name, rating: r.rating, comment: r.comment ?? "", date: r.created_at })),
  };
}
