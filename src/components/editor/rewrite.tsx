"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { useEditor } from "./context";

const MODES = [
  { id: "shorter", label: "Mais curto" },
  { id: "persuasive", label: "Persuasivo" },
  { id: "formal", label: "Formal" },
  { id: "casual", label: "Descontraído" },
] as const;

const btn = "rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-40";

/** "Reescrever com IA" por campo: escolhe o estilo, vê a sugestão e aceita ou descarta (aceitar entra no desfazer). */
export function RewriteButton({ value, label, onApply }: { value: string; label: string; onApply: (v: string) => void }) {
  const { state } = useEditor();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(mode: string, instruction?: string) {
    setBusy(true); setError(null); setSuggestion(null);
    try {
      const r = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value, mode, instruction, fieldLabel: label, isHealth: state.landing.isHealth }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Erro ao reescrever");
      setSuggestion(j.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao reescrever");
    } finally {
      setBusy(false);
    }
  }
  const close = () => { setOpen(false); setSuggestion(null); setError(null); setCustom(""); };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={!value.trim()}
        onClick={() => (open ? close() : setOpen(true))}
        title={value.trim() ? "Reescrever com IA" : "Escreva algo primeiro"}
        className="inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200 disabled:opacity-40"
      >
        <Sparkles className="h-3 w-3" />IA
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-72 space-y-2 rounded-xl border border-white/10 bg-neutral-900 p-3 shadow-xl">
          <div className="flex flex-wrap gap-1">
            {MODES.map((m) => <button key={m.id} type="button" disabled={busy} className={btn} onClick={() => run(m.id)}>{m.label}</button>)}
          </div>
          <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); if (custom.trim()) run("custom", custom.trim()); }}>
            <input value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={300} placeholder="Instrução livre…" className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs outline-none focus:border-white/40" />
            <button disabled={busy || !custom.trim()} className={btn}>Ir</button>
          </form>
          {busy && <p className="flex items-center gap-1 text-xs text-neutral-400"><Loader2 className="h-3 w-3 animate-spin" />Reescrevendo…</p>}
          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
          {suggestion && (
            <div className="space-y-2">
              <p className="max-h-40 overflow-y-auto whitespace-pre-line rounded-md bg-white/5 p-2 text-xs">{suggestion}</p>
              <div className="flex gap-1">
                <button type="button" className={`${btn} inline-flex items-center gap-1 bg-white text-black hover:bg-white/90`} onClick={() => { onApply(suggestion); close(); }}><Check className="h-3 w-3" />Aceitar</button>
                <button type="button" className={`${btn} inline-flex items-center gap-1`} onClick={() => setSuggestion(null)}><X className="h-3 w-3" />Descartar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
