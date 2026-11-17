"use client";

import type { ReactNode } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEditor, useValue } from "./context";
import { RewriteButton } from "./rewrite";

export const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-white/40";
export const btnCls =
  "inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-40";

export function Field({ k, label, hint, action, children }: { k: string; label: string; hint?: string; action?: ReactNode; children: ReactNode }) {
  const { fieldError } = useEditor();
  const err = fieldError?.field === k ? fieldError.message : null;
  return (
    <div data-form-field={k} className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-neutral-300">{label}</label>
        {action}
      </div>
      {children}
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
      {err && <p role="alert" className="text-xs text-red-400">{err}</p>}
    </div>
  );
}

// Campos de texto de conteúdo (não contatos/URLs) ganham "Reescrever com IA".
const AI_KEY = /\.(eyebrow|title|subtitle|text|q|a|description|name)$/;
const NO_AI = /^(profile|slug|categoryId|whatsappMessage)/;

export function TextField({ k, label, hint, placeholder, area, rows = 4, ai }: {
  k: string; label: string; hint?: string; placeholder?: string; area?: boolean; rows?: number; ai?: boolean;
}) {
  const { set } = useEditor();
  const v = (useValue<string>(k) as string) ?? "";
  const showAi = ai ?? (AI_KEY.test(k) && !NO_AI.test(k) && !/\.items\.\d+\.name$/.test(k));
  return (
    <Field k={k} label={label} hint={hint} action={showAi ? <RewriteButton value={v} label={label} onApply={(t) => set(k, t)} /> : undefined}>
      {area ? (
        <textarea rows={rows} className={inputCls} value={v} placeholder={placeholder} onChange={(e) => set(k, e.target.value)} />
      ) : (
        <input className={inputCls} value={v} placeholder={placeholder} onChange={(e) => set(k, e.target.value)} />
      )}
    </Field>
  );
}

export function ToggleField({ k, label }: { k: string; label: string }) {
  const { set } = useEditor();
  const v = Boolean(useValue<boolean>(k));
  return (
    <label data-form-field={k} className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={v} onChange={(e) => set(k, e.target.checked)} className="h-4 w-4 accent-rose-500" />
      {label}
    </label>
  );
}

export function SelectField({ k, label, options }: { k: string; label: string; options: { value: string; label: string }[] }) {
  const { set } = useEditor();
  const v = useValue<string>(k);
  return (
    <Field k={k} label={label}>
      <select className={inputCls} value={v} onChange={(e) => set(k, e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value} className="bg-neutral-900 text-neutral-100">{o.label}</option>)}
      </select>
    </Field>
  );
}

export function ColorField({ k, label }: { k: string; label: string }) {
  const { set } = useEditor();
  const v = useValue<string>(k);
  return (
    <Field k={k} label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={v} onChange={(e) => set(k, e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-white/10 bg-transparent" />
        <input className={inputCls} value={v} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && set(k, e.target.value)} />
      </div>
    </Field>
  );
}

/* ---------- listas reordenáveis (dnd-kit) ---------- */

export function SortableList({ ids, onMove, children }: { ids: string[]; onMove: (from: number, to: number) => void; children: ReactNode }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  function end(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    onMove(ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id)));
  }
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={end}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>{children}</SortableContext>
    </DndContext>
  );
}

export function SortableRow({ id, children, onRemove, handleLabel = "Arrastar para reordenar" }: {
  id: string; children: ReactNode; onRemove?: () => void; handleLabel?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 ${isDragging ? "z-10 opacity-70" : ""}`}
    >
      <button type="button" aria-label={handleLabel} className="mt-1 cursor-grab touch-none text-neutral-500 hover:text-white" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1 space-y-2">{children}</div>
      {onRemove && (
        <button type="button" aria-label="Remover" onClick={onRemove} className="mt-1 text-neutral-500 hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/** Lista editável de itens de um array do estado (planos, FAQ, etapas...). */
export function ItemList<T>({ k, label, empty, addLabel, max, render }: {
  k: string; label: string; empty: T; addLabel: string; max?: number;
  render: (i: number, item: T) => ReactNode;
}) {
  const { set } = useEditor();
  const items = (useValue<T[]>(k) as T[]) ?? [];
  const ids = items.map((_, i) => String(i));
  return (
    <div data-form-field={k} className="space-y-2">
      <p className="text-xs font-medium text-neutral-300">{label}</p>
      <SortableList ids={ids} onMove={(from, to) => set(k, arrayMove(items, from, to))}>
        <div className="space-y-2">
          {items.map((it, i) => (
            <SortableRow key={i} id={String(i)} onRemove={() => set(k, items.filter((_, j) => j !== i))}>
              {render(i, it)}
            </SortableRow>
          ))}
        </div>
      </SortableList>
      <button type="button" className={btnCls} disabled={max != null && items.length >= max} onClick={() => set(k, [...items, structuredClone(empty)])}>
        <Plus className="h-4 w-4" />{addLabel}
      </button>
    </div>
  );
}
