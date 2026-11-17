"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Loader2, Sparkles, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createDraftPage } from "@/app/admin/editor/actions";
import { IMAGE_KINDS, type ImageKind } from "@/lib/ai/schema";

type Category = { id: string; name: string };
type Item = { key: string; file: File; preview: string; kind: ImageKind | "auto" };

const KIND_LABELS: Record<ImageKind | "auto", string> = {
  auto: "IA decide", hero: "Foto principal", about: "Sobre", results: "Resultados", testimonials: "Depoimento (print)", logo: "Logo",
};

const STEPS = [
  { id: "briefing", label: "Analisando o briefing" },
  { id: "texts", label: "Escrevendo textos e seções" },
  { id: "plans", label: "Montando planos" },
  { id: "faq", label: "Criando FAQ" },
  { id: "seo", label: "Definindo SEO e tema" },
  { id: "validate", label: "Validando o conteúdo" },
  { id: "save", label: "Salvando o rascunho" },
] as const;

const formSchema = z.object({
  categoryId: z.string().min(1, "Escolha a categoria"),
  name: z.string().trim().min(1, "Informe o nome"),
  city: z.string().trim().max(80),
  state: z.string().trim().max(2),
  online: z.boolean(),
  whatsapp: z.string().trim().max(20),
  text: z.string().trim().min(10, "Descreva o profissional com mais detalhes").max(8000),
}).refine((v) => v.online || v.city, { message: "Informe a cidade ou marque online", path: ["city"] });
type Values = z.infer<typeof formSchema>;

const MAX_IMAGES = 8;
const MAX_SIDE = 1280;

/** Redimensiona (lado maior 1280px) e converte para WebP no navegador: menos bytes para o bucket e para a IA. */
async function compress(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("compress"))), "image/webp", 0.82));
}

const input = "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-white/40";

export function BriefingForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: { categoryId: "", name: "", city: "", state: "", online: false, whatsapp: "", text: "" },
  });
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const draftId = useRef<string | null>(null); // reaproveitado se o admin tentar de novo

  function addFiles(list: FileList | File[]) {
    const all = Array.from(list);
    const ok = all.filter((f) => ["image/jpeg", "image/png", "image/webp"].includes(f.type));
    const room = Math.max(0, MAX_IMAGES - items.length);
    setFileError(ok.length < all.length ? "Só JPG, PNG ou WebP." : ok.length > room ? `Máximo de ${MAX_IMAGES} imagens.` : null);
    setItems((cur) => [
      ...cur,
      ...ok.slice(0, Math.max(0, MAX_IMAGES - cur.length)).map((file) => ({ key: crypto.randomUUID(), file, preview: URL.createObjectURL(file), kind: "auto" as const })),
    ]);
  }

  function removeItem(key: string) {
    const it = items.find((i) => i.key === key);
    if (it) URL.revokeObjectURL(it.preview);
    setItems((cur) => cur.filter((i) => i.key !== key));
  }

  async function onSubmit(v: Values) {
    setRunning(true); setError(null); setDone([]); setActive("briefing");
    try {
      draftId.current ??= await createDraftPage();
      const id = draftId.current;

      // compressão + upload (o bucket é público; o servidor só aceita URLs do próprio bucket)
      const supabase = createClient();
      const images = await Promise.all(items.map(async (it) => {
        const blob = await compress(it.file);
        const path = `${id}/${crypto.randomUUID()}.webp`;
        const { error: err } = await supabase.storage.from("media").upload(path, blob, { contentType: "image/webp" });
        if (err) throw new Error("Falha ao enviar uma das imagens.");
        return { url: supabase.storage.from("media").getPublicUrl(path).data.publicUrl, kind: it.kind === "auto" ? null : it.kind };
      }));

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, state: v.state.toUpperCase(), professionalId: id, images }),
      });
      if (!res.ok || !res.body) throw new Error(res.status === 400 ? await res.text() : "Falha ao falar com o servidor.");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let finished = false;
      for (;;) {
        const { value, done: eof } = await reader.read();
        if (eof) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines.filter(Boolean)) {
          const ev = JSON.parse(line) as { type: string; id?: string; message?: string };
          if (ev.type === "step" && ev.id) {
            setActive(ev.id);
            setDone(STEPS.slice(0, STEPS.findIndex((s) => s.id === ev.id)).map((s) => s.id));
          } else if (ev.type === "error") throw new Error(ev.message);
          else if (ev.type === "done") finished = true;
        }
      }
      if (!finished) throw new Error("A geração foi interrompida. Tente novamente.");
      setDone(STEPS.map((s) => s.id)); setActive(null);
      router.push(`/admin/editor/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
      setRunning(false); setActive(null);
    }
  }

  if (running) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-2xl border border-white/10 p-6" role="status" aria-live="polite">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Sparkles className="h-5 w-5 text-violet-300" />Gerando a página…</h2>
        <ul className="space-y-2">
          {STEPS.map((s) => (
            <li key={s.id} className={`flex items-center gap-2 text-sm transition ${done.includes(s.id) ? "text-emerald-300" : active === s.id ? "text-white" : "text-neutral-500"}`}>
              {done.includes(s.id) ? <Check className="h-4 w-4" /> : active === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="h-4 w-4 rounded-full border border-white/20" />}
              {s.label}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const label = "mb-1 block text-xs font-medium text-neutral-300";
  const err = (m?: string) => m && <p role="alert" className="mt-1 text-xs text-red-400">{m}</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="categoryId">Categoria</label>
          <select id="categoryId" className={input} {...register("categoryId")}>
            <option value="" className="bg-neutral-900 text-neutral-100">Selecione…</option>
            {categories.map((c) => <option key={c.id} value={c.id} className="bg-neutral-900 text-neutral-100">{c.name}</option>)}
          </select>
          {err(errors.categoryId?.message)}
        </div>
        <div>
          <label className={label} htmlFor="name">Nome do profissional</label>
          <input id="name" className={input} {...register("name")} />
          {err(errors.name?.message)}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:col-span-1">
          <div className="col-span-2">
            <label className={label} htmlFor="city">Cidade</label>
            <input id="city" className={input} {...register("city")} />
          </div>
          <div>
            <label className={label} htmlFor="state">UF</label>
            <input id="state" maxLength={2} className={input} {...register("state")} />
          </div>
          <div className="col-span-3">{err(errors.city?.message)}</div>
        </div>
        <div className="flex items-end pb-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-rose-500" {...register("online")} />Atende online
          </label>
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="whatsapp">WhatsApp (opcional, com DDI e DDD)</label>
          <input id="whatsapp" className={input} placeholder="5511999999999" {...register("whatsapp")} />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="text">Briefing</label>
        <textarea id="text" rows={9} className={input} placeholder="Quem é o profissional, método de trabalho, público, diferenciais, planos e valores (se houver), dúvidas comuns… Quanto mais fiel, melhor. O que não estiver aqui ficará para você preencher." {...register("text")} />
        {err(errors.text?.message)}
      </div>

      <div>
        <p className={label}>Fotos (até {MAX_IMAGES})</p>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          className={`rounded-xl border border-dashed p-5 text-center text-sm ${dragging ? "border-white bg-white/10" : "border-white/20"}`}
        >
          <Upload className="mx-auto mb-1 h-5 w-5 text-neutral-400" />
          Arraste as imagens aqui ou{" "}
          <label className="cursor-pointer underline">
            escolha arquivos
            <input type="file" multiple accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
          </label>
          <p className="mt-1 text-xs text-neutral-500">As imagens são reduzidas antes do envio. Sem tipo marcado, a IA sugere.</p>
        </div>
        {fileError && <p role="alert" className="mt-1 text-xs text-red-400">{fileError}</p>}
        {items.length > 0 && (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {items.map((it) => (
              <li key={it.key} className="relative space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.preview} alt="" className="aspect-square w-full rounded-lg object-cover" />
                <button type="button" aria-label="Remover imagem" onClick={() => removeItem(it.key)} className="absolute right-1 top-1 rounded-full bg-black/70 p-1"><X className="h-3 w-3" /></button>
                <select
                  aria-label="Tipo da imagem"
                  value={it.kind}
                  onChange={(e) => setItems((cur) => cur.map((x) => (x.key === it.key ? { ...x, kind: e.target.value as Item["kind"] } : x)))}
                  className="w-full rounded-md border border-white/10 bg-white/5 px-1 py-1 text-xs"
                >
                  {(["auto", ...IMAGE_KINDS] as const).map((k) => <option key={k} value={k} className="bg-neutral-900 text-neutral-100">{KIND_LABELS[k]}</option>)}
                </select>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      <button className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black">
        <Sparkles className="h-4 w-4" />Gerar página
      </button>
    </form>
  );
}
