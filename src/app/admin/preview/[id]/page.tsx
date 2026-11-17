import { notFound } from "next/navigation";
import { LandingRenderer } from "@/components/landing/LandingRenderer";
import { rowToLanding } from "@/lib/landing/load";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Pré-visualização", robots: { index: false } };

/** Mostra o rascunho salvo exatamente como o visitante verá (a RLS de admin permite ler rascunhos). */
export default async function PreviewPage({ params }: PageProps<"/admin/preview/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: row } = await supabase.from("professionals").select("*, categories(is_health)").eq("id", id).maybeSingle();
  const landing = row && rowToLanding(row);
  if (!landing) notFound();
  return <LandingRenderer data={landing} />;
}
