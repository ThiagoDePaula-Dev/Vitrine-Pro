import { Suspense } from "react";
import Link from "next/link";
import { CategoryIcon } from "@/components/directory/CategoryIcon";
import { getCategories } from "@/lib/directory";

export const metadata = { title: "Categorias" };

async function List() {
  const categories = await getCategories();
  if (!categories.length) return <p className="text-neutral-600">Nenhuma categoria disponível.</p>;
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((c) => (
        <li key={c.id}>
          <Link href={`/busca?categoria=${c.slug}`} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 text-sm font-medium text-neutral-800 hover:border-neutral-900">
            <CategoryIcon name={c.icon} className="h-5 w-5 text-neutral-500" />{c.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function CategoriasPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-5 py-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-neutral-600 hover:underline">← Início</Link>
        <h1 className="mb-4 mt-2 text-2xl font-bold text-neutral-900">Categorias</h1>
        <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-white" />}><List /></Suspense>
      </div>
    </main>
  );
}
