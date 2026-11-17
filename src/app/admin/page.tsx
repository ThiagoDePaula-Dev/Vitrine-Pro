import Link from "next/link";
import { daysAgoISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { createPage } from "./editor/actions";

export const metadata = { title: "Painel" };

const DAYS = 30;

export default async function AdminHome() {
  const supabase = await createClient();
  const since = daysAgoISO(DAYS);
  const count = (table: string, f: (q: ReturnType<ReturnType<typeof supabase.from>["select"]>) => unknown) =>
    (f(supabase.from(table).select("id", { count: "exact", head: true })) as PromiseLike<{ count: number | null }>).then((r) => r.count ?? 0);

  const [published, drafts, views, whatsapp, checkout, pending, { data: recent }] = await Promise.all([
    count("professionals", (q) => q.eq("status", "published")),
    count("professionals", (q) => q.eq("status", "draft")),
    count("events", (q) => q.eq("type", "view").gte("created_at", since)),
    count("events", (q) => q.eq("type", "whatsapp_click").gte("created_at", since)),
    count("events", (q) => q.eq("type", "checkout_click").gte("created_at", since)),
    count("reviews", (q) => q.eq("status", "pending")),
    supabase.from("professionals").select("id, name, slug, status").order("updated_at", { ascending: false }).limit(5),
  ]);

  const cards = [
    { label: "Publicadas", value: published },
    { label: "Rascunhos", value: drafts },
    { label: `Views (${DAYS} dias)`, value: views },
    { label: `Cliques WhatsApp (${DAYS} dias)`, value: whatsapp },
    { label: `Cliques checkout (${DAYS} dias)`, value: checkout },
    { label: "Avaliações pendentes", value: pending, href: "/admin/avaliacoes", highlight: pending > 0 },
  ];

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Visão geral</h1>
        <div className="flex gap-2">
          <Link href="/admin/briefing" className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white">Gerar com IA</Link>
          <form action={createPage}>
            <button className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium hover:bg-white/10">Página em branco</button>
          </form>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map((c) => {
          const body = (
            <div className={`rounded-xl border p-4 ${c.highlight ? "border-amber-400/50 bg-amber-400/10" : "border-white/10"}`}>
              <p className="text-3xl font-bold tabular-nums">{c.value.toLocaleString("pt-BR")}</p>
              <p className="mt-1 text-sm text-neutral-400">{c.label}</p>
            </div>
          );
          return <li key={c.label}>{c.href ? <Link href={c.href}>{body}</Link> : body}</li>;
        })}
      </ul>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Páginas recentes</h2>
          <Link href="/admin/paginas" className="text-sm text-neutral-400 hover:text-white">Ver todas →</Link>
        </div>
        <ul className="divide-y divide-white/10 rounded-xl border border-white/10">
          {(recent ?? []).map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 p-3">
              <span className="min-w-0 truncate">{p.name || <em className="text-neutral-500">Sem nome</em>} <span className="text-sm text-neutral-500">/{p.slug}</span></span>
              <span className="flex items-center gap-3 text-sm">
                <span className={p.status === "published" ? "text-emerald-400" : "text-neutral-400"}>{p.status === "published" ? "Publicada" : "Rascunho"}</span>
                <Link href={`/admin/editor/${p.id}`} className="rounded-lg border border-white/10 px-3 py-1 hover:bg-white/10">Editar</Link>
              </span>
            </li>
          ))}
          {!recent?.length && <li className="p-6 text-center text-neutral-400">Nenhuma página ainda.</li>}
        </ul>
      </section>
    </main>
  );
}
