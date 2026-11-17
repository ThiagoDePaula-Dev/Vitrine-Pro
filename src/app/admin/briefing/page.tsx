import { BriefingForm } from "@/components/briefing/BriefingForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Novo briefing" };

export default async function BriefingPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name").order("name");
  return (
    <main className="p-6">
      <h1 className="mx-auto mb-6 max-w-2xl text-2xl font-semibold">Gerar página com IA</h1>
      <BriefingForm categories={categories ?? []} />
    </main>
  );
}
