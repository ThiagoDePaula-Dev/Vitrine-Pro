"use client";

import { useCallback, useRef, useState } from "react";
import type { LandingData } from "@/lib/landing/schema";

export type EditorState = {
  landing: LandingData;
  slug: string;
  categoryId: string | null;
};

export function getIn(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => (acc == null ? undefined : (acc as Record<string, unknown>)[k]), obj);
}

/** Mutação em cópia profunda (o estado é pequeno; mantém o histórico imutável). */
export function setIn<T>(obj: T, path: string, value: unknown): T {
  const copy = structuredClone(obj);
  const keys = path.split(".");
  let cur = copy as Record<string, unknown>;
  for (const k of keys.slice(0, -1)) cur = cur[k] as Record<string, unknown>;
  cur[keys[keys.length - 1]] = value;
  return copy;
}

/** Converte a chave do preview ("hero.title", "profile.name") no caminho dentro de EditorState. */
export function keyToPath(s: EditorState, key: string): string {
  const [head, ...rest] = key.split(".");
  if (head === "slug" || head === "categoryId") return head;
  if (["profile", "seo", "theme", "whatsappMessage"].includes(head)) return `landing.${key}`;
  const idx = s.landing.sections.findIndex((x) => x.id === head);
  return idx < 0 ? `landing.${key}` : ["landing.sections", idx, ...rest].join(".");
}

/** Histórico com desfazer/refazer; edições em sequência rápida (digitação) viram um passo só. */
export function useHistory<T>(initial: T) {
  const [h, setH] = useState({ past: [] as T[], present: initial, future: [] as T[] });
  const last = useRef(0);

  const set = useCallback((fn: (p: T) => T) => {
    const now = Date.now();
    const coalesce = now - last.current < 800;
    last.current = now;
    setH((cur) => {
      const next = fn(cur.present);
      if (next === cur.present) return cur;
      return { past: coalesce ? cur.past : [...cur.past, cur.present].slice(-100), present: next, future: [] };
    });
  }, []);

  const undo = useCallback(() => {
    last.current = 0;
    setH((c) => (c.past.length ? { past: c.past.slice(0, -1), present: c.past[c.past.length - 1], future: [c.present, ...c.future] } : c));
  }, []);
  const redo = useCallback(() => {
    last.current = 0;
    setH((c) => (c.future.length ? { past: [...c.past, c.present], present: c.future[0], future: c.future.slice(1) } : c));
  }, []);

  return { state: h.present, set, undo, redo, canUndo: h.past.length > 0, canRedo: h.future.length > 0 };
}
