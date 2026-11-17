"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { deleteCategory, saveCategory, type CategoryState } from "@/app/admin/categorias/actions";

type Category = { id: string; name: string; slug: string; icon: string | null; registry_label: string | null; is_health: boolean };

const input = "w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm outline-none placeholder:text-neutral-500 focus:border-white/40";

export function CategoryForm({ category }: { category?: Category }) {
  const [state, action, pending] = useActionState<CategoryState, FormData>(saveCategory, null);
  return (
    <div className="space-y-2 rounded-xl border border-white/10 p-3">
      <form action={action} className="grid items-end gap-2 sm:grid-cols-12">
        {category && <input type="hidden" name="id" value={category.id} />}
        <label className="sm:col-span-3"><span className="mb-1 block text-xs text-neutral-400">Nome</span><input name="name" required defaultValue={category?.name} className={input} /></label>
        <label className="sm:col-span-3"><span className="mb-1 block text-xs text-neutral-400">Slug</span><input name="slug" required defaultValue={category?.slug} className={input} /></label>
        <label className="sm:col-span-2"><span className="mb-1 block text-xs text-neutral-400">Ícone</span><input name="icon" defaultValue={category?.icon ?? ""} placeholder="dumbbell" className={input} /></label>
        <label className="sm:col-span-2"><span className="mb-1 block text-xs text-neutral-400">Registro</span><input name="registry_label" defaultValue={category?.registry_label ?? ""} placeholder="CREF" className={input} /></label>
        <label className="flex items-center gap-2 pb-1.5 text-sm sm:col-span-1">
          <input type="checkbox" name="is_health" defaultChecked={category?.is_health} className="h-4 w-4 accent-rose-500" />Saúde
        </label>
        <button disabled={pending} className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-black disabled:opacity-60 sm:col-span-1">{category ? "Salvar" : "Criar"}</button>
      </form>
      <div className="flex items-center justify-between">
        {state ? <p role={state.ok ? "status" : "alert"} className={`text-xs ${state.ok ? "text-emerald-400" : "text-red-400"}`}>{state.message}</p> : <span />}
        {category && (
          <form action={deleteCategory.bind(null, category.id)} onSubmit={(e) => { if (!confirm(`Excluir "${category.name}"? As páginas dessa categoria ficarão sem categoria.`)) e.preventDefault(); }}>
            <button className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-red-400"><Trash2 className="h-3 w-3" />Excluir</button>
          </form>
        )}
      </div>
    </div>
  );
}
