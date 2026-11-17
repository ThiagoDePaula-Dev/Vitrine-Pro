"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const TYPES = ["whatsapp_click", "checkout_click"] as const;
type Type = "view" | (typeof TYPES)[number];

/**
 * Registra view (1x por sessão da aba) e cliques em WhatsApp/checkout (`data-track`).
 * Escreve em `events` com a chave anon; a RLS só aceita eventos de páginas publicadas.
 * Falhas são ignoradas: métrica nunca pode quebrar a página.
 */
export function Tracker({ professionalId }: { professionalId: string }) {
  useEffect(() => {
    const supabase = createClient();
    const send = (type: Type) => { void supabase.from("events").insert({ professional_id: professionalId, type }).then(() => {}, () => {}); };

    try {
      const key = `viewed:${professionalId}`;
      if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, "1"); send("view"); }
    } catch { send("view"); }

    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("[data-track]")?.dataset.track as Type | undefined;
      if (t && (TYPES as readonly string[]).includes(t)) send(t);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [professionalId]);
  return null;
}
