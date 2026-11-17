import { CategoryForm } from "@/components/admin/CategoryForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Categorias" };

export default async function CategoriesAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, name, slug, icon, registry_label, is_health").order("name");
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Categorias</h1>
      <section aria-labelledby="nova" className="space-y-2">
        <h2 id="nova" className="text-sm font-semibold text-neutral-300">Nova categoria</h2>
        <CategoryForm />
      </section>
      <section aria-labelledby="lista" className="space-y-2">
        <h2 id="lista" className="text-sm font-semibold text-neutral-300">Existentes ({data?.length ?? 0})</h2>
        {(data ?? []).map((c) => <CategoryForm key={c.id} category={c} />)}
      </section>
    </main>
  );
}
