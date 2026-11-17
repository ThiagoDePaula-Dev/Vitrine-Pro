import { Search } from "lucide-react";
import type { Category, Filters } from "@/lib/directory";

const input = "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900";

/** Formulário GET (funciona sem JS): os filtros vivem na URL de /busca. */
export function SearchForm({ categories, f, withSort = false }: { categories: Category[]; f: Filters; withSort?: boolean }) {
  return (
    <form action="/busca" method="get" role="search" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <label htmlFor="q" className="sr-only">Buscar</label>
        <input id="q" name="q" defaultValue={f.q} maxLength={80} placeholder="Nome, especialidade…" className={input} />
      </div>
      <div className="lg:col-span-3">
        <label htmlFor="categoria" className="sr-only">Categoria</label>
        <select id="categoria" name="categoria" defaultValue={f.categoria} className={input}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>
      <div className="lg:col-span-3">
        <label htmlFor="cidade" className="sr-only">Cidade</label>
        <input id="cidade" name="cidade" defaultValue={f.cidade} maxLength={80} placeholder="Cidade" className={input} />
      </div>
      <div className="flex items-center lg:col-span-2">
        <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
          <Search className="h-4 w-4" />Buscar
        </button>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 sm:col-span-1 lg:col-span-4">
        <input type="checkbox" name="online" value="1" defaultChecked={f.online} className="h-4 w-4 accent-neutral-900" />
        Apenas atendimento online
      </label>
      {withSort && (
        <div className="lg:col-span-3">
          <label htmlFor="ordem" className="sr-only">Ordenar por</label>
          <select id="ordem" name="ordem" defaultValue={f.ordem} className={input}>
            <option value="relevancia">Mais relevantes</option>
            <option value="avaliacao">Melhor avaliados</option>
            <option value="preco">Menor preço</option>
            <option value="nome">Nome (A–Z)</option>
          </select>
        </div>
      )}
    </form>
  );
}
