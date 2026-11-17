"use client";

import { useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { QRCodeCanvas } from "qrcode.react";
import { AlertTriangle, Check, Copy, CopyPlus, Download, ExternalLink, EyeOff, MessageCircle, Rocket } from "lucide-react";
import { FONT_PAIRS, RADII, TEMPLATES, type Section } from "@/lib/landing/schema";
import { TEMPLATE_DEFAULT_COLORS, TEMPLATE_LABELS } from "@/lib/landing/themes";
import type { Missing } from "@/lib/landing/checklist";
import { useEditor, useValue } from "./context";
import { ColorField, Field, ItemList, SelectField, SortableList, SortableRow, TextField, ToggleField, btnCls, inputCls } from "./fields";
import { ImageField, ImageList } from "./images";

const Card = ({ title, off, children }: { title: string; off?: boolean; children: React.ReactNode }) => (
  <section className={`space-y-3 rounded-xl border border-white/10 p-4 ${off ? "opacity-60" : ""}`}>
    <h3 className="text-sm font-semibold">{title}{off && <span className="ml-2 text-xs font-normal text-neutral-400">(seção desligada)</span>}</h3>
    {children}
  </section>
);

/* ---------- 1. Dados ---------- */
export function StepData({ siteUrl }: { siteUrl: string }) {
  const { state, categories, edit } = useEditor();
  const cat = categories.find((c) => c.id === state.categoryId);
  return (
    <div className="space-y-4">
      <Field k="categoryId" label="Categoria">
        <select
          className={inputCls}
          value={state.categoryId ?? ""}
          onChange={(e) =>
            edit((d) => {
              d.categoryId = e.target.value || null;
              d.landing.isHealth = categories.find((c) => c.id === e.target.value)?.is_health ?? false;
            })
          }
        >
          <option value="" className="bg-neutral-900 text-neutral-100">Selecione…</option>
          {categories.map((c) => <option key={c.id} value={c.id} className="bg-neutral-900 text-neutral-100">{c.name}</option>)}
        </select>
      </Field>
      <Field k="slug" label="Endereço da página" hint={`${siteUrl.replace(/^https?:\/\//, "")}/${state.slug}`}>
        <input className={inputCls} value={state.slug} onChange={(e) => edit((d) => { d.slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"); })} />
      </Field>
      <TextField k="profile.name" label="Nome" />
      {(cat?.registry_label || state.landing.profile.registry) && (
        <TextField k="profile.registry" label={`Registro profissional${cat?.registry_label ? ` (${cat.registry_label})` : ""}`} hint="Informe o número real. Nunca é preenchido pela IA." />
      )}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2"><TextField k="profile.city" label="Cidade" /></div>
        <TextField k="profile.state" label="UF" />
      </div>
      <ToggleField k="profile.online" label="Atende online" />
      <TextField k="profile.whatsapp" label="WhatsApp" placeholder="5511999999999" hint="Com DDI e DDD, só números." />
      <TextField k="whatsappMessage" label="Mensagem pré-preenchida do WhatsApp" placeholder="Vazio = mensagem padrão" />
      <TextField k="profile.instagram" label="Instagram" placeholder="usuario" />
      <TextField k="profile.email" label="E-mail" />
      <TextField k="profile.cnpj" label="CNPJ (opcional)" />
      <TextField k="seo.title" label="Título SEO" hint="Vazio = nome do profissional." />
      <TextField k="seo.description" label="Descrição SEO" area rows={3} />
    </div>
  );
}

/* ---------- 2. Tema ---------- */
export function StepTheme() {
  const { state, edit } = useEditor();
  return (
    <div className="space-y-4">
      <div data-form-field="theme.template" className="grid grid-cols-3 gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={state.landing.theme.template === t}
            onClick={() => edit((d) => { d.landing.theme.template = t; d.landing.theme.primary = TEMPLATE_DEFAULT_COLORS[t].primary; d.landing.theme.accent = TEMPLATE_DEFAULT_COLORS[t].accent; })}
            className={`rounded-xl border p-3 text-sm ${state.landing.theme.template === t ? "border-white bg-white/10" : "border-white/10 hover:bg-white/5"}`}
          >
            {TEMPLATE_LABELS[t]}
          </button>
        ))}
      </div>
      <ColorField k="theme.primary" label="Cor primária" />
      <ColorField k="theme.accent" label="Cor de destaque" />
      <SelectField k="theme.fontPair" label="Fontes" options={FONT_PAIRS.map((f) => ({ value: f, label: { modern: "Moderna (Inter)", elegant: "Elegante (Playfair + Inter)", bold: "Marcante (Space Grotesk + Inter)" }[f] }))} />
      <SelectField k="theme.radius" label="Arredondamento" options={RADII.map((r) => ({ value: r, label: { none: "Reto", sm: "Pequeno", md: "Médio", lg: "Grande", full: "Máximo" }[r] }))} />
    </div>
  );
}

/* ---------- 3. Seções (ordem + ligar/desligar) ---------- */
const SECTION_LABELS: Record<Section["type"], string> = {
  hero: "Hero", plans: "Planos", about: "Sobre", results: "Resultados", how: "Como funciona",
  testimonials: "Depoimentos", faq: "FAQ", cta: "CTA final", footer: "Rodapé",
};

export function StepSections() {
  const { state, edit } = useEditor();
  const secs = state.landing.sections;
  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-400">Arraste para reordenar e use a caixa para ligar/desligar.</p>
      <SortableList ids={secs.map((s) => s.id)} onMove={(from, to) => edit((d) => { d.landing.sections = arrayMove(d.landing.sections, from, to); })}>
        <div className="space-y-2">
          {secs.map((s, i) => (
            <SortableRow key={s.id} id={s.id} handleLabel={`Mover ${SECTION_LABELS[s.type]}`}>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-rose-500" checked={s.enabled} onChange={(e) => edit((d) => { d.landing.sections[i].enabled = e.target.checked; })} />
                {SECTION_LABELS[s.type]}
              </label>
            </SortableRow>
          ))}
        </div>
      </SortableList>
    </div>
  );
}

/* ---------- 4. Conteúdo ---------- */
export function StepContent() {
  const { state } = useEditor();
  return (
    <div className="space-y-4">
      {state.landing.sections.filter((s) => s.type !== "plans").map((s) => {
        const id = s.id;
        return (
          <Card key={id} title={SECTION_LABELS[s.type]} off={!s.enabled}>
            {s.type === "hero" && (<>
              <TextField k={`${id}.eyebrow`} label="Chamada acima do título" />
              <TextField k={`${id}.title`} label="Título" />
              <TextField k={`${id}.subtitle`} label="Subtítulo" area rows={3} />
              <TextField k={`${id}.ctaLabel`} label="Texto do botão" placeholder="Vazio = Falar no WhatsApp" />
              <ImageField k={`${id}.image`} label="Foto principal" aspect={4 / 5} />
            </>)}
            {s.type === "about" && (<>
              <TextField k={`${id}.title`} label="Título" />
              <TextField k={`${id}.text`} label="Texto" area rows={6} />
              <ImageList k={`${id}.images`} label="Fotos (carrossel)" aspect={4 / 3} />
            </>)}
            {s.type === "results" && (<>
              <TextField k={`${id}.title`} label="Título" />
              <ImageList k={`${id}.images`} label="Imagens" aspect={1} hint={state.landing.isHealth ? "Categoria de saúde: sem promessas de resultado; evite antes e depois." : undefined} />
            </>)}
            {s.type === "how" && (<>
              <TextField k={`${id}.title`} label="Título" />
              <ItemList<{ title: string; text: string }> k={`${id}.steps`} label="Etapas" addLabel="Adicionar etapa" empty={{ title: "", text: "" }}
                render={(i) => (<>
                  <TextField k={`${id}.steps.${i}.title`} label={`Etapa ${i + 1}: título`} />
                  <TextField k={`${id}.steps.${i}.text`} label="Texto" area rows={2} />
                </>)} />
            </>)}
            {s.type === "testimonials" && (<>
              <TextField k={`${id}.title`} label="Título" />
              <ImageList k={`${id}.images`} label="Prints de depoimentos" aspect={3 / 4} hint="Somente depoimentos reais, enviados por você." />
            </>)}
            {s.type === "faq" && (<>
              <TextField k={`${id}.title`} label="Título" />
              <ItemList<{ q: string; a: string }> k={`${id}.items`} label="Perguntas" addLabel="Adicionar pergunta" empty={{ q: "", a: "" }}
                render={(i) => (<>
                  <TextField k={`${id}.items.${i}.q`} label="Pergunta" />
                  <TextField k={`${id}.items.${i}.a`} label="Resposta" area rows={2} />
                </>)} />
            </>)}
            {s.type === "cta" && (<>
              <TextField k={`${id}.title`} label="Título" />
              <TextField k={`${id}.text`} label="Texto" area rows={2} />
              <TextField k={`${id}.ctaLabel`} label="Texto do botão" placeholder="Vazio = Falar no WhatsApp" />
            </>)}
            {s.type === "footer" && (<>
              <TextField k={`${id}.text`} label="Texto extra (opcional)" />
              <ToggleField k={`${id}.showCnpj`} label="Exibir CNPJ" />
            </>)}
          </Card>
        );
      })}
    </div>
  );
}

/* ---------- 5. Planos ---------- */
function PriceField({ k, label }: { k: string; label: string }) {
  const { set } = useEditor();
  const cents = useValue<number | null>(k);
  const fmt = (c: number | null) => (c == null ? "" : (c / 100).toFixed(2).replace(".", ","));
  const parse = (t: string) => {
    const n = parseFloat(t.replace(/\./g, "").replace(",", "."));
    return t.trim() === "" || Number.isNaN(n) ? null : Math.round(n * 100);
  };
  // Enquanto digita, mostra o texto cru; fora do foco, sempre o valor do estado (reflete desfazer/refazer).
  const [txt, setTxt] = useState<string | null>(null);
  return (
    <Field k={k} label={label}>
      <input
        className={inputCls}
        inputMode="decimal"
        placeholder="0,00"
        value={txt ?? fmt(cents)}
        onFocus={() => setTxt(fmt(cents))}
        onBlur={() => setTxt(null)}
        onChange={(e) => { setTxt(e.target.value); set(k, parse(e.target.value)); }}
      />
    </Field>
  );
}

export function StepPlans() {
  const { state, set } = useEditor();
  const id = state.landing.sections.find((s) => s.type === "plans")?.id ?? "plans";
  return (
    <div className="space-y-4">
      <ToggleField k={`${id}.enabled`} label="Exibir seção de planos" />
      <TextField k={`${id}.title`} label="Título" />
      <TextField k={`${id}.subtitle`} label="Subtítulo" />
      <ItemList<object> k={`${id}.items`} label="Planos" addLabel="Adicionar plano" max={6}
        empty={{ name: "", priceCents: null, periodMonths: 1, features: [], checkoutUrl: "", highlighted: false }}
        render={(i) => {
          const f = `${id}.items.${i}`;
          const features = (state.landing.sections.find((s) => s.id === id) as Extract<Section, { type: "plans" }>).items[i]?.features ?? [];
          return (<>
            <TextField k={`${f}.name`} label="Nome do plano" />
            <div className="grid grid-cols-2 gap-3">
              <PriceField k={`${f}.priceCents`} label="Preço total (R$)" />
              <Field k={`${f}.periodMonths`} label="Período (meses)">
                <select className={inputCls} value={String((state.landing.sections.find((s) => s.id === id) as Extract<Section, { type: "plans" }>).items[i]?.periodMonths ?? 1)} onChange={(e) => set(`${f}.periodMonths`, Number(e.target.value))}>
                  {[1, 3, 6, 12].map((m) => <option key={m} value={m} className="bg-neutral-900 text-neutral-100">{m}</option>)}
                </select>
              </Field>
            </div>
            <Field k={`${f}.features`} label="O que está incluso (um por linha)">
              <textarea rows={4} className={inputCls} value={features.join("\n")} onChange={(e) => set(`${f}.features`, e.target.value.split("\n"))} />
            </Field>
            <TextField k={`${f}.checkoutUrl`} label="Link de checkout" placeholder="https://…" />
            <ToggleField k={`${f}.highlighted`} label={'Destacar com selo "Mais escolhido"'} />
          </>);
        }} />
      <p className="text-xs text-neutral-500">A economia é calculada em relação ao plano mensal, se existir.</p>
    </div>
  );
}

/* ---------- 6. Publicar ---------- */
export function StepPublish({ missing, published, busy, publicUrl, error, onJump, onPublish, onUnpublish, onDuplicate }: {
  missing: Missing[]; published: boolean; busy: boolean; publicUrl: string; error: string | null;
  onJump: (key: string) => void; onPublish: () => void; onUnpublish: () => void; onDuplicate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  function downloadQr() {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `qr-${publicUrl.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-")}.png`;
    a.click();
  }
  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          {missing.length ? <AlertTriangle className="h-4 w-4 text-amber-400" /> : <Check className="h-4 w-4 text-emerald-400" />}
          {missing.length ? `Preencher (${missing.length})` : "Tudo preenchido"}
        </h3>
        <ul className="space-y-1">
          {missing.map((m) => (
            <li key={m.key + m.label}>
              <button type="button" onClick={() => onJump(m.key)} className="text-left text-sm text-amber-300 underline-offset-2 hover:underline">{m.label}</button>
            </li>
          ))}
        </ul>
      </section>

      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {!published ? (
          <button type="button" disabled={busy || missing.length > 0} onClick={onPublish} className={`${btnCls} bg-white text-black hover:bg-white/90`}>
            <Rocket className="h-4 w-4" />Publicar
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={onUnpublish} className={btnCls}><EyeOff className="h-4 w-4" />Despublicar</button>
        )}
        <button type="button" disabled={busy} onClick={onDuplicate} className={btnCls}><CopyPlus className="h-4 w-4" />Duplicar</button>
      </div>
      {!published && missing.length > 0 && <p className="text-xs text-neutral-500">A publicação fica bloqueada até todos os campos acima estarem preenchidos.</p>}

      {published && (
        <section className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="text-sm font-semibold text-emerald-300">Página publicada</p>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 break-all text-sm underline">
            {publicUrl}<ExternalLink className="h-3 w-3 shrink-0" />
          </a>
          <div className="flex flex-wrap items-center gap-4">
            <div ref={qrRef} className="rounded-lg bg-white p-2"><QRCodeCanvas value={publicUrl} size={512} style={{ width: 112, height: 112 }} marginSize={1} /></div>
            <div className="flex flex-col gap-2">
              <button type="button" className={btnCls} onClick={async () => { await navigator.clipboard.writeText(publicUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                <Copy className="h-4 w-4" />{copied ? "Copiado!" : "Copiar link"}
              </button>
              <button type="button" className={btnCls} onClick={downloadQr}><Download className="h-4 w-4" />Baixar QR (PNG)</button>
              <a className={btnCls} target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(publicUrl)}`}>
                <MessageCircle className="h-4 w-4" />Compartilhar no WhatsApp
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
