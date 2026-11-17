import { Suspense } from "react";
import Link from "next/link";
import { CategoryIcon } from "@/components/directory/CategoryIcon";
import { SearchForm } from "@/components/directory/SearchForm";
import { Logo } from "@/components/Logo";
import { siteConfig } from "@/config/site";
import { getCategories, parseFilters } from "@/lib/directory";

export const metadata = { title: { absolute: `${siteConfig.name} — ${siteConfig.tagline}` }, description: siteConfig.description };

async function HomeContent() {
  const categories = await getCategories();
  return (
    <>
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-4 shadow-lg sm:p-6">
        <SearchForm categories={categories} f={parseFilters({})} />
      </div>
      {categories.length > 0 && (
        <section className="mx-auto mt-14 max-w-5xl px-5" aria-labelledby="cats">
          <h2 id="cats" className="text-xl font-semibold text-neutral-900">Categorias</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/busca?categoria=${c.slug}`} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 text-sm font-medium text-neutral-800 transition hover:border-neutral-900">
                  <CategoryIcon name={c.icon} className="h-5 w-5 text-neutral-500" />{c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 pb-20">
      <section className="bg-gradient-to-b from-neutral-900 to-neutral-800 px-5 pb-16 pt-16 text-center text-white">
        <Logo className="mb-6 text-lg text-white" />
        <h1 className="mx-auto max-w-2xl text-3xl font-bold sm:text-4xl">{siteConfig.tagline}</h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-300">Busque por categoria e cidade e fale direto no WhatsApp.</p>
      </section>
      <div className="-mt-8 px-5">
        <Suspense fallback={<div className="mx-auto h-24 max-w-4xl rounded-2xl bg-white shadow-lg" />}>
          <HomeContent />
        </Suspense>
      </div>
    </main>
  );
}
