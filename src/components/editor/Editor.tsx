"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ExternalLink, Loader2, Monitor, Redo2, Smartphone, Tablet, TriangleAlert, Undo2 } from "lucide-react";
import { LandingRenderer } from "@/components/landing/LandingRenderer";
import { missingFields } from "@/lib/landing/checklist";
import { keyToPath, setIn, useHistory, type EditorState } from "@/lib/editor/state";
import { duplicatePage, savePage, setPublished } from "@/app/admin/editor/actions";
import { EditorCtx, type Category, type EditorApi } from "./context";
import { PreviewFrame, type Device } from "./PreviewFrame";
import { StepContent, StepData, StepPlans, StepPublish, StepSections, StepTheme } from "./steps";

const STEPS = [
  { id: "dados", label: "Dados" },
  { id: "tema", label: "Tema" },
  { id: "secoes", label: "Seções" },
  { id: "conteudo", label: "Conteúdo" },
  { id: "planos", label: "Planos" },
  { id: "publicar", label: "Publicar" },
] as const;
type StepId = (typeof STEPS)[number]["id"];

function stepForKey(key: string): StepId {
  const head = key.split(".")[0];
  if (["profile", "seo", "slug", "categoryId", "whatsappMessage"].includes(head)) return "dados";
  if (head === "theme") return "tema";
  if (head === "plans") return "planos";
  return "conteudo";
}

type SaveStatus = "saved" | "saving" | "error";

export function Editor({ id, initial, categories, initialPublished, siteUrl }: {
  id: string; initial: EditorState; categories: Category[]; initialPublished: boolean; siteUrl: string;
}) {
  const { state, set: setHistory, undo, redo, canUndo, canRedo } = useHistory(initial);
  const [step, setStep] = useState<StepId>("dados");
  const [device, setDevice] = useState<Device>("desktop");
  const [mobileView, setMobileView] = useState<"form" | "preview">("form");
  const [published, setPublished_] = useState(initialPublished);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initial));
  const [fieldError, setFieldError] = useState<{ field: string; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const saving = useRef(false);

  const json = useMemo(() => JSON.stringify(state), [state]);
  const dirty = json !== savedJson;

  /* ---------- API do editor ---------- */
  const edit = useCallback((fn: (d: EditorState) => void) => {
    setHistory((cur) => { const d = structuredClone(cur); fn(d); return d; });
  }, [setHistory]);
  const set = useCallback((key: string, value: unknown) => {
    setHistory((cur) => setIn(cur, keyToPath(cur, key), value));
  }, [setHistory]);

  const api: EditorApi = { id, state, categories, set, edit, fieldError };

  /* ---------- autosave (debounce 1,5 s) ---------- */
  const save = useCallback(async (snapshot: EditorState) => {
    if (saving.current) return;
    saving.current = true;
    setSaveStatus("saving");
    const snapJson = JSON.stringify(snapshot);
    try {
      const r = await savePage(id, { landing: snapshot.landing, slug: snapshot.slug, categoryId: snapshot.categoryId });
      if (r.ok) { setSavedJson(snapJson); setSaveStatus("saved"); setFieldError(null); }
      else {
        setSaveStatus("error");
        setFieldError(r.field ? { field: r.field, message: r.error } : null);
        if (!r.field) setActionError(r.error);
        else setSavedJson(snapJson); // evita laço de reenvio; o erro fica visível no campo
      }
    } catch {
      setSaveStatus("error");
    } finally {
      saving.current = false;
    }
  }, [id]);

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => save(state), 1500);
    return () => clearTimeout(t);
  }, [dirty, state, savedJson, save]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /** Salva já (usado antes de publicar/duplicar/abrir preview). */
  const flush = useCallback(async () => {
    while (saving.current) await new Promise((r) => setTimeout(r, 100));
    if (JSON.stringify(state) !== savedJson) await save(state);
  }, [state, savedJson, save]);

  /* ---------- atalhos ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return; // desfazer nativo do campo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  /* ---------- clique no preview → foca o campo ---------- */
  const focusField = useCallback((key: string) => {
    setStep(stepForKey(key));
    setMobileView("form");
    setTimeout(() => {
      const parts = key.split(".");
      while (parts.length) {
        const el = formRef.current?.querySelector<HTMLElement>(`[data-form-field="${parts.join(".")}"]`);
        if (el) {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
          el.querySelector<HTMLElement>("input, textarea, select, button")?.focus({ preventScroll: true });
          return;
        }
        parts.pop();
      }
    }, 80);
  }, []);

  /* ---------- foco no formulário → destaca no preview ---------- */
  function onFormFocus(e: React.FocusEvent) {
    const key = (e.target as HTMLElement).closest<HTMLElement>("[data-form-field]")?.dataset.formField;
    const doc = frameRef.current?.contentDocument;
    if (!key || !doc) return;
    const parts = key.split(".");
    while (parts.length) {
      const el = doc.querySelector<HTMLElement>(`[data-field="${parts.join(".")}"]`);
      if (el) { el.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
      parts.pop();
    }
  }

  /* ---------- checklist e ações ---------- */
  const registryLabel = categories.find((c) => c.id === state.categoryId)?.registry_label ?? null;
  const missing = useMemo(
    () => missingFields(state.landing, { slug: state.slug, categoryId: state.categoryId, registryLabel }),
    [state, registryLabel],
  );
  const publicUrl = `${siteUrl.replace(/\/$/, "")}/${state.slug}`;

  async function onPublish() {
    setBusy(true); setActionError(null);
    await flush();
    const r = await setPublished(id, true);
    if (r.ok) setPublished_(true); else setActionError(r.error);
    setBusy(false);
  }
  async function onUnpublish() {
    setBusy(true); setActionError(null);
    const r = await setPublished(id, false);
    if (r.ok) setPublished_(false); else setActionError(r.error);
    setBusy(false);
  }
  async function onDuplicate() {
    setBusy(true);
    await flush();
    await duplicatePage(id); // redireciona
  }
  async function openPreview() {
    await flush();
    window.open(`/admin/preview/${id}`, "_blank", "noopener");
  }

  const dev = [
    { id: "desktop", Icon: Monitor, label: "Desktop" },
    { id: "tablet", Icon: Tablet, label: "Tablet" },
    { id: "mobile", Icon: Smartphone, label: "Celular" },
  ] as const;
  const btn = "inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm hover:bg-white/10 disabled:opacity-30";

  return (
    <EditorCtx.Provider value={api}>
      <div className="flex h-[calc(100vh-49px)] flex-col">
        {/* barra superior */}
        <div className="flex flex-wrap items-center gap-1 border-b border-white/10 px-3 py-2">
          <Link href="/admin" className={btn} aria-label="Voltar"><ArrowLeft className="h-4 w-4" /></Link>
          <button className={btn} onClick={undo} disabled={!canUndo} aria-label="Desfazer"><Undo2 className="h-4 w-4" /></button>
          <button className={btn} onClick={redo} disabled={!canRedo} aria-label="Refazer"><Redo2 className="h-4 w-4" /></button>
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-neutral-400" role="status">
            {saveStatus === "saving" || (dirty && saveStatus !== "error") ? <><Loader2 className="h-3 w-3 animate-spin" />Salvando…</>
              : saveStatus === "error" ? <><TriangleAlert className="h-3 w-3 text-red-400" />Erro ao salvar</>
              : <><Check className="h-3 w-3 text-emerald-400" />Salvo</>}
          </span>
          <span className="ml-2 rounded-full border border-white/10 px-2 py-0.5 text-xs text-neutral-400">{published ? "Publicada" : "Rascunho"}</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="hidden items-center gap-1 lg:flex">
              {dev.map(({ id: d, Icon, label }) => (
                <button key={d} className={`${btn} ${device === d ? "bg-white/10" : ""}`} onClick={() => setDevice(d)} aria-label={label} aria-pressed={device === d}><Icon className="h-4 w-4" /></button>
              ))}
            </div>
            <button className={btn} onClick={openPreview}><ExternalLink className="h-4 w-4" /><span className="hidden sm:inline">Preview</span></button>
            <button className={`${btn} bg-white text-black hover:bg-white/90`} onClick={() => setStep("publicar")}>Publicar</button>
            <button className={`${btn} lg:hidden`} onClick={() => setMobileView(mobileView === "form" ? "preview" : "form")}>{mobileView === "form" ? "Ver página" : "Editar"}</button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* formulário */}
          <div className={`${mobileView === "form" ? "flex" : "hidden"} w-full flex-col border-r border-white/10 lg:flex lg:w-[440px] lg:shrink-0`}>
            <nav className="flex gap-1 overflow-x-auto border-b border-white/10 p-2" aria-label="Etapas">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  aria-current={step === s.id ? "step" : undefined}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${step === s.id ? "bg-white text-black" : "text-neutral-300 hover:bg-white/10"}`}
                >
                  {i + 1}. {s.label}
                  {s.id === "publicar" && missing.length > 0 && <span className="ml-1 rounded-full bg-amber-500 px-1.5 text-xs text-black">{missing.length}</span>}
                </button>
              ))}
            </nav>
            <div ref={formRef} onFocusCapture={onFormFocus} className="min-h-0 flex-1 overflow-y-auto p-4">
              {step === "dados" && <StepData siteUrl={siteUrl} />}
              {step === "tema" && <StepTheme />}
              {step === "secoes" && <StepSections />}
              {step === "conteudo" && <StepContent />}
              {step === "planos" && <StepPlans />}
              {step === "publicar" && (
                <StepPublish
                  missing={missing} published={published} busy={busy} publicUrl={publicUrl} error={actionError}
                  onJump={focusField} onPublish={onPublish} onUnpublish={onUnpublish} onDuplicate={onDuplicate}
                />
              )}
            </div>
            <div className="flex justify-between border-t border-white/10 p-2 text-sm">
              <button className={btn} disabled={step === STEPS[0].id} onClick={() => setStep(STEPS[Math.max(0, STEPS.findIndex((s) => s.id === step) - 1)].id)}>Anterior</button>
              <button className={btn} disabled={step === STEPS[STEPS.length - 1].id} onClick={() => setStep(STEPS[Math.min(STEPS.length - 1, STEPS.findIndex((s) => s.id === step) + 1)].id)}>Próxima</button>
            </div>
          </div>

          {/* preview */}
          <div className={`${mobileView === "preview" ? "block" : "hidden"} min-w-0 flex-1 lg:block`}>
            <PreviewFrame device={device} onFrame={(el) => { frameRef.current = el; }}>
              <LandingRenderer data={state.landing} mode="preview" onFieldClick={focusField} />
            </PreviewFrame>
          </div>
        </div>
      </div>
    </EditorCtx.Provider>
  );
}
