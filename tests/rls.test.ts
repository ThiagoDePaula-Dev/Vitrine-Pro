/**
 * Testes de RLS (integração). Rodam SÓ contra um Supabase de TESTE com as migrations 001–005 aplicadas
 * (ex.: `supabase start`). Nunca aponte para produção: eles criam e removem linhas.
 *
 *   RLS_SUPABASE_URL=http://127.0.0.1:54321 RLS_ANON_KEY=... RLS_SERVICE_KEY=... npm test
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const { RLS_SUPABASE_URL: url, RLS_ANON_KEY: anonKey, RLS_SERVICE_KEY: serviceKey } = process.env;
const enabled = Boolean(url && anonKey && serviceKey);

describe.skipIf(!enabled)("RLS (Supabase de teste)", () => {
  let anon: SupabaseClient;
  let admin: SupabaseClient; // service role: ignora RLS, só para montar/limpar o cenário
  const tag = `rls-${Date.now()}`;
  const ids: { pub?: string; draft?: string } = {};

  beforeAll(async () => {
    anon = createClient(url!, anonKey!, { auth: { persistSession: false } });
    admin = createClient(url!, serviceKey!, { auth: { persistSession: false } });
    const mk = async (slug: string, status: "published" | "draft") => {
      const { data, error } = await admin.from("professionals").insert({ slug, status, name: slug }).select("id").single();
      if (error) throw error;
      return data.id as string;
    };
    ids.pub = await mk(`${tag}-pub`, "published");
    ids.draft = await mk(`${tag}-draft`, "draft");
    await admin.from("reviews").insert([
      { professional_id: ids.pub, author_name: "A", rating: 5, status: "approved", ip_hash: `${tag}-a` },
      { professional_id: ids.pub, author_name: "P", rating: 1, status: "pending", ip_hash: `${tag}-p` },
    ]);
    await admin.from("briefings").insert({ professional_id: ids.pub, raw_text: "segredo" });
  });

  afterAll(async () => {
    if (!admin) return;
    await admin.from("professionals").delete().like("slug", `${tag}%`); // cascade limpa o resto
  });

  it("público vê só páginas publicadas", async () => {
    const { data } = await anon.from("professionals").select("slug").like("slug", `${tag}%`);
    expect(data?.map((r) => r.slug)).toEqual([`${tag}-pub`]);
  });

  it("público vê só avaliações aprovadas", async () => {
    const { data } = await anon.from("reviews").select("status").eq("professional_id", ids.pub!);
    expect(data).toHaveLength(1);
    expect(data![0].status).toBe("approved");
  });

  it("público não consegue ler ip_hash das avaliações", async () => {
    const { error } = await anon.from("reviews").select("ip_hash").eq("professional_id", ids.pub!);
    expect(error).not.toBeNull();
  });

  it("público não escreve direto em reviews (só via submit_review)", async () => {
    const { error } = await anon.from("reviews").insert({ professional_id: ids.pub, author_name: "X", rating: 5, status: "approved", ip_hash: "x" });
    expect(error).not.toBeNull();
  });

  it("submit_review: grava como pending, limita por IP e recusa rascunho", async () => {
    const call = (p: string, ip: string) => anon.rpc("submit_review", { p_professional: p, p_author: "Fulano", p_rating: 5, p_comment: "ótimo", p_ip_hash: ip });
    expect((await call(ids.pub!, `${tag}-ip1`)).data).toBe("ok");
    expect((await call(ids.pub!, `${tag}-ip1`)).data).toBe("rate_limited");
    expect((await call(ids.draft!, `${tag}-ip2`)).data).toBe("not_found");
    const { data } = await admin.from("reviews").select("status").eq("ip_hash", `${tag}-ip1`);
    expect(data).toEqual([{ status: "pending" }]);
  });

  it("submit_review recusa nota fora de 1–5", async () => {
    const { data } = await anon.rpc("submit_review", { p_professional: ids.pub, p_author: "Z", p_rating: 9, p_comment: "", p_ip_hash: `${tag}-ip3` });
    expect(data).toBe("invalid");
  });

  it("público registra eventos só de páginas publicadas", async () => {
    expect((await anon.from("events").insert({ professional_id: ids.pub, type: "view" })).error).toBeNull();
    expect((await anon.from("events").insert({ professional_id: ids.draft, type: "view" })).error).not.toBeNull();
  });

  it("público não lê eventos nem briefings", async () => {
    expect((await anon.from("events").select("id")).data).toEqual([]);
    expect((await anon.from("briefings").select("id")).data).toEqual([]);
  });

  it("público não altera nem apaga páginas", async () => {
    await anon.from("professionals").update({ name: "hackeado" }).eq("id", ids.pub!);
    await anon.from("professionals").delete().eq("id", ids.pub!);
    const { data } = await admin.from("professionals").select("name").eq("id", ids.pub!).single();
    expect(data?.name).toBe(`${tag}-pub`);
  });

  it("busca pública não devolve rascunhos", async () => {
    const { data } = await anon.rpc("search_professionals", { p_q: tag });
    expect((data as { slug: string }[]).map((r) => r.slug)).toEqual([`${tag}-pub`]);
  });
});
