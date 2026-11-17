"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient, isAdminUser } from "@/lib/supabase/server";
import { landingSchema } from "@/lib/landing/schema";
import { emptyLanding } from "@/lib/landing/defaults";
import { missingFields, type Missing } from "@/lib/landing/checklist";
import { rowToLanding } from "@/lib/landing/load";
import { validateSlug } from "@/lib/landing/slug";
import { landingToRow } from "@/lib/landing/persist";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminUser(user)) throw new Error("Não autorizado");
  return supabase;
}

const rand = () => randomBytes(3).toString("hex");

/** Cria um rascunho vazio e devolve o id (usado pelo briefing, que precisa do id para o upload). */
export async function createDraftPage(): Promise<string> {
  const supabase = await requireAdmin();
  const base = emptyLanding();
  const { data, error } = await supabase
    .from("professionals")
    .insert({ slug: `pagina-${rand()}`, theme: base.theme, sections: base.sections, seo: base.seo })
    .select("id")
    .single();
  if (error || !data) throw new Error("Não foi possível criar a página");
  return data.id;
}

export async function createPage() {
  redirect(`/admin/editor/${await createDraftPage()}`);
}

export type SaveResult = { ok: true } | { ok: false; error: string; field?: string };

export async function savePage(id: string, input: { landing: unknown; slug: string; categoryId: string | null }): Promise<SaveResult> {
  const supabase = await requireAdmin();
  const parsed = landingSchema.safeParse(input.landing);
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };
  const d = parsed.data;

  const slug = input.slug.trim().toLowerCase();
  const slugError = validateSlug(slug);
  if (slugError) return { ok: false, error: slugError, field: "slug" };

  const { error } = await supabase.from("professionals").update(landingToRow(d, slug, input.categoryId)).eq("id", id);

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Esse endereço já está em uso", field: "slug" };
    if (error.code === "23514") return { ok: false, error: "Endereço inválido ou reservado", field: "slug" };
    return { ok: false, error: "Erro ao salvar" };
  }
  return { ok: true };
}

export type PublishResult = { ok: true } | { ok: false; error: string; missing?: Missing[] };

/** Publicar revalida o checklist no servidor, usando o que está salvo no banco. */
export async function setPublished(id: string, published: boolean): Promise<PublishResult> {
  const supabase = await requireAdmin();
  if (published) {
    const { data: row } = await supabase
      .from("professionals")
      .select("*, categories(is_health, registry_label)")
      .eq("id", id)
      .single();
    if (!row) return { ok: false, error: "Página não encontrada" };
    const landing = rowToLanding(row);
    if (!landing) return { ok: false, error: "Conteúdo inválido" };
    const missing = missingFields(landing, {
      slug: row.slug,
      categoryId: row.category_id,
      registryLabel: row.categories?.registry_label ?? null,
    });
    if (missing.length) return { ok: false, error: "Há campos para preencher", missing };
  }
  const { error } = await supabase.from("professionals").update({ status: published ? "published" : "draft" }).eq("id", id);
  return error ? { ok: false, error: "Erro ao atualizar status" } : { ok: true };
}

export async function duplicatePage(id: string) {
  const supabase = await requireAdmin();
  const { data: row } = await supabase.from("professionals").select("*").eq("id", id).single();
  if (!row) throw new Error("Página não encontrada");
  const { id: _id, created_at: _c, updated_at: _u, ...rest } = row;
  void _id; void _c; void _u;
  const { data, error } = await supabase
    .from("professionals")
    .insert({ ...rest, slug: `pagina-${rand()}`, status: "draft" })
    .select("id")
    .single();
  if (error || !data) throw new Error("Não foi possível duplicar");
  redirect(`/admin/editor/${data.id}`);
}
