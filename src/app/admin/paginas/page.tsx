import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Páginas" };

const STATUS = { published: "Publicadas", draft: "Rascunhos" } as const;
const field = "rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:border-white/40";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function PagesList({ searchParams }: PageProps<"/admin/paginas">) {
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 60);
  const status = one(sp.status) as keyof typeof STATUS | "";
  const categoria = one(sp.categoria);

  const supabase = await createClient();
  let query = supabase
    .from("professionals")
    .select("id, name, slug, status, city, online, updated_at, categories(name)")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (status in STATUS) query = query.eq("status", status as keyof typeof STATUS);
  if (categoria) query = query.eq("category_id", categoria);
  // remove caracteres que têm significado na sintaxe do filtro `or` do PostgREST
  const safe = q.replace(/[,()%*\\]/g, " ").trim();
  if (safe) query = query.or(`name.ilike.%${safe}%,slug.ilike.%${safe}%,city.ilike.%${safe}%`);

  const [{ data: pages }, { data: categories }] = await Promise.all([query, supabase.from("categories").select("id, name").order("name")]);

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-6">
      <h1 className="text-2xl font-semibold">Páginas</h1>
      <form method="get" className="flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Nome, endereço ou cidade" aria-label="Buscar" className={`${field} min-w-56 flex-1`} />
        <select name="status" defaultValue={status} aria-label="Status" className={field}>
          <option value="">Todas</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select name="categoria" defaultValue={categoria} aria-label="Categoria" className={field}>
          <option value="">Todas as categorias</option>
          {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black">Filtrar</button>
      </form>

      <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
        {(pages ?? []).map((p) => {
          const cat = p.categories as unknown as { name: string } | null;
          return (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{p.name || <em className="text-neutral-500">Sem nome</em>}</p>
                <p className="text-sm text-neutral-400">
                  /{p.slug} · {p.status === "published" ? "Publicada" : "Rascunho"}
                  {cat && <> · {cat.name}</>}{p.city && <> · {p.city}</>}{p.online && <> · Online</>}
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <Link href={p.status === "published" ? `/${p.slug}` : `/admin/preview/${p.id}`} target="_blank" className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/10">Ver</Link>
                <Link href={`/admin/editor/${p.id}`} className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/10">Editar</Link>
              </div>
            </li>
          );
        })}
        {!pages?.length && <li className="p-8 text-center text-neutral-400">Nenhuma página encontrada.</li>}
      </ul>
    </main>
  );
}
