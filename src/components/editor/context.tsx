"use client";

import { createContext, useContext } from "react";
import { getIn, keyToPath, type EditorState } from "@/lib/editor/state";

export type Category = { id: string; name: string; registry_label: string | null; is_health: boolean };

export type EditorApi = {
  id: string;
  state: EditorState;
  categories: Category[];
  /** Edita por chave do preview ("hero.title"). */
  set: (key: string, value: unknown) => void;
  /** Edição livre numa cópia do estado. */
  edit: (fn: (draft: EditorState) => void) => void;
  fieldError: { field: string; message: string } | null;
};

export const EditorCtx = createContext<EditorApi>(null!);
export const useEditor = () => useContext(EditorCtx);

export function useValue<T = unknown>(key: string): T {
  const { state } = useEditor();
  return getIn(state, keyToPath(state, key)) as T;
}
