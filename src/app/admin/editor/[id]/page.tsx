import { notFound } from "next/navigation";
import { Editor } from "@/components/editor/Editor";
import { emptyLanding } from "@/lib/landing/defaults";
import { rowToLanding } from "@/lib/landing/load";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Editor" };

export default async function EditorPage({ params }: PageProps<"/admin/editor/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: row }, { data: categories }] = await Promise.all([
    supabase.from("professionals").select("*, categories(is_health)").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name, registry_label, is_health").order("name"),
  ]);
  if (!row) notFound();

  const landing = rowToLanding(row) ?? emptyLanding();
  return (
    <Editor
      id={id}
      initial={{ landing, slug: row.slug, categoryId: row.category_id }}
      categories={categories ?? []}
      initialPublished={row.status === "published"}
      siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}
    />
  );
}
