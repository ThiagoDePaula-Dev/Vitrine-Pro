import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, SearchX } from "lucide-react";
import { ProfessionalCard } from "@/components/directory/ProfessionalCard";
import { SearchForm } from "@/components/directory/SearchForm";
import { PAGE_SIZE, filtersToQuery, getCategories, parseFilters, searchProfessionals, type Filters } from "@/lib/directory";

export const metadata: Metadata = { title: "Buscar profissionais" };

async function Results({ f }: { f: Filters }) {
  const [categories, { items, total }] = await Promise.all([getCategories(), searchProfessionals(f)]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const cat = categories.find((c) => c.slug === f.categoria);
  const link = "inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm hover:border-neutral-900";

  return (
    <>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <SearchForm categories={categories} f={f} withSort />
      </div>

      <p className="mt-6 text-sm text-neutral-600" role="status">
        {total === 0 ? "Nenhum resultado" : `${total} ${total === 1 ? "profissional" : "profissionais"}`}
        {cat && <> em <strong>{cat.name}</strong></>}
        {f.cidade && <> · {f.cidade}</>}
        {total > PAGE_SIZE && <> · página {Math.min(f.pagina, pages)} de {pages}</>}
      </p>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
          <SearchX className="mx-auto h-8 w-8 text-neutral-400" aria-hidden />
          <h2 className="mt-3 font-semibold text-neutral-900">Não encontramos ninguém com esses filtros</h2>
          <p className="mt-1 text-sm text-neutral-600">Tente outra cidade, remova a categoria ou busque por atendimento online.</p>
          <Link href="/busca" className={`${link} mt-4`}>Limpar filtros</Link>
        </div>
      ) : (
        <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => <li key={p.id}><ProfessionalCard p={p} /></li>)}
        </ul>
      )}

      {pages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Paginação">
          {f.pagina > 1 && <Link rel="prev" href={`/busca${filtersToQuery(f, { pagina: f.pagina - 1 })}`} className={link}><ChevronLeft className="h-4 w-4" />Anterior</Link>}
          <span className="text-sm text-neutral-600">{Math.min(f.pagina, pages)} / {pages}</span>
          {f.pagina < pages && <Link rel="next" href={`/busca${filtersToQuery(f, { pagina: f.pagina + 1 })}`} className={link}>Próxima<ChevronRight className="h-4 w-4" /></Link>}
        </nav>
      )}
    </>
  );
}

async function Page({ searchParams }: { searchParams: PageProps<"/busca">["searchParams"] }) {
  return <Results f={parseFilters(await searchParams)} />;
}

export default function BuscaPage(props: PageProps<"/busca">) {
  return (
    <main className="min-h-screen bg-neutral-50 px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-neutral-600 hover:underline">← Início</Link>
        <h1 className="mb-4 mt-2 text-2xl font-bold text-neutral-900">Buscar profissionais</h1>
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-white" />}>
          <Page searchParams={props.searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
