import { createPublicClient } from "@/lib/supabase/public";

export const PAGE_SIZE = 12;
export const SORTS = { relevancia: "relevance", avaliacao: "rating", nome: "name", preco: "price" } as const;
export type SortKey = keyof typeof SORTS;

export type Filters = { q: string; categoria: string; cidade: string; online: boolean; ordem: SortKey; pagina: number };
export type Category = { id: string; name: string; slug: string; icon: string | null; is_health: boolean };
export type Card = {
  id: string; slug: string; name: string; category_name: string | null; category_slug: string | null;
  city: string | null; state: string | null; online: boolean; whatsapp: string | null; hero_url: string | null;
  min_price_cents: number | null; avg_rating: number | null; review_count: number;
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseFilters(sp: Record<string, string | string[] | undefined>): Filters {
  const ordem = one(sp.ordem) as SortKey;
  const pagina = parseInt(one(sp.pagina), 10);
  return {
    q: one(sp.q).trim().slice(0, 80),
    categoria: one(sp.categoria).trim().slice(0, 60),
    cidade: one(sp.cidade).trim().slice(0, 80),
    online: one(sp.online) === "1",
    ordem: ordem in SORTS ? ordem : "relevancia",
    pagina: Number.isFinite(pagina) && pagina > 0 ? Math.min(pagina, 500) : 1,
  };
}

/** Querystring só com o que difere do padrão (URLs limpas e compartilháveis). */
export function filtersToQuery(f: Filters, override: Partial<Filters> = {}) {
  const x = { ...f, ...override };
  const p = new URLSearchParams();
  if (x.q) p.set("q", x.q);
  if (x.categoria) p.set("categoria", x.categoria);
  if (x.cidade) p.set("cidade", x.cidade);
  if (x.online) p.set("online", "1");
  if (x.ordem !== "relevancia") p.set("ordem", x.ordem);
  if (x.pagina > 1) p.set("pagina", String(x.pagina));
  const s = p.toString();
  return s ? `?${s}` : "";
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

export async function getCategories(): Promise<Category[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data } = await supabase.from("categories").select("id, name, slug, icon, is_health").order("name");
  return data ?? [];
}

export async function searchProfessionals(f: Filters): Promise<{ items: Card[]; total: number }> {
  const supabase = createPublicClient();
  if (!supabase) return { items: [], total: 0 };
  const { data, error } = await supabase.rpc("search_professionals", {
    p_q: escapeLike(f.q),
    p_category: f.categoria,
    p_city: escapeLike(f.cidade),
    p_online: f.online,
    p_sort: SORTS[f.ordem],
    p_limit: PAGE_SIZE,
    p_offset: (f.pagina - 1) * PAGE_SIZE,
  });
  if (error || !data) return { items: [], total: 0 };
  const rows = data as (Card & { total_count: number; avg_rating: string | number | null })[];
  return {
    total: Number(rows[0]?.total_count ?? 0),
    items: rows.map((r) => {
      const { total_count, avg_rating, ...card } = r;
      void total_count;
      return { ...card, avg_rating: avg_rating == null ? null : Number(avg_rating) };
    }),
  };
}
