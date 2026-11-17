import Link from "next/link";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { moderateReview } from "./actions";

export const metadata = { title: "Avaliações" };

const TABS = [
  { id: "pending", label: "Pendentes" },
  { id: "approved", label: "Aprovadas" },
  { id: "rejected", label: "Rejeitadas" },
] as const;

export default async function ReviewsAdmin({ searchParams }: PageProps<"/admin/avaliacoes">) {
  const sp = await searchParams;
  const status = TABS.find((t) => t.id === sp.status)?.id ?? "pending";
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, author_name, rating, comment, created_at, professionals(name, slug)")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);

  const btn = "rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/10";
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Avaliações</h1>
      <nav className="mt-4 flex gap-2" aria-label="Status">
        {TABS.map((t) => (
          <Link key={t.id} href={`/admin/avaliacoes?status=${t.id}`} aria-current={status === t.id ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-sm ${status === t.id ? "bg-white text-black" : "text-neutral-300 hover:bg-white/10"}`}>
            {t.label}
          </Link>
        ))}
      </nav>
      <ul className="mt-6 space-y-3">
        {(reviews ?? []).map((r) => {
          const pro = r.professionals as unknown as { name: string; slug: string } | null;
          return (
            <li key={r.id} className="space-y-2 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{r.author_name} <span className="text-sm font-normal text-neutral-400">→ {pro?.name || pro?.slug}</span></p>
                <span className="inline-flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-amber-400 text-amber-400" />{r.rating}</span>
              </div>
              {r.comment && <p className="whitespace-pre-line text-sm text-neutral-300">{r.comment}</p>}
              <p className="text-xs text-neutral-500">{new Date(r.created_at).toLocaleString("pt-BR")}</p>
              <div className="flex gap-2">
                {status !== "approved" && <form action={moderateReview.bind(null, r.id, "approved")}><button className={`${btn} bg-emerald-500/20`}>Aprovar</button></form>}
                {status !== "rejected" && <form action={moderateReview.bind(null, r.id, "rejected")}><button className={`${btn} bg-red-500/20`}>Rejeitar</button></form>}
              </div>
            </li>
          );
        })}
        {!reviews?.length && <li className="rounded-xl border border-dashed border-white/10 p-8 text-center text-neutral-400">Nada por aqui.</li>}
      </ul>
    </main>
  );
}
