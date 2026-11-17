"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SLUG_RE } from "@/lib/landing/slug";
import { requireAdmin } from "@/lib/supabase/server";

export type CategoryState = { ok: boolean; message: string } | null;

const schema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Informe o nome").max(60),
  slug: z.string().trim().toLowerCase().min(1, "Informe o slug").max(60).regex(SLUG_RE, "Slug inválido (minúsculas, números e hífen)"),
  icon: z.string().trim().max(30).optional(),
  registry_label: z.string().trim().max(20).optional(),
  is_health: z.boolean(),
});

export async function saveCategory(_prev: CategoryState, fd: FormData): Promise<CategoryState> {
  const supabase = await requireAdmin();
  const parsed = schema.safeParse({
    id: fd.get("id") || undefined,
    name: fd.get("name"),
    slug: fd.get("slug"),
    icon: fd.get("icon") || undefined,
    registry_label: fd.get("registry_label") || undefined,
    is_health: fd.get("is_health") === "on",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const { id, icon, registry_label, ...rest } = parsed.data;
  const row = { ...rest, icon: icon ?? null, registry_label: registry_label ?? null };
  const { error } = id ? await supabase.from("categories").update(row).eq("id", id) : await supabase.from("categories").insert(row);
  if (error) return { ok: false, message: error.code === "23505" ? "Esse slug já existe" : "Não foi possível salvar" };
  revalidatePath("/admin/categorias");
  return { ok: true, message: id ? "Salvo" : "Categoria criada" };
}

export async function deleteCategory(id: string) {
  const supabase = await requireAdmin();
  // professionals.category_id usa ON DELETE SET NULL: as páginas ficam sem categoria (o checklist bloqueia publicar de novo)
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/admin/categorias");
}
