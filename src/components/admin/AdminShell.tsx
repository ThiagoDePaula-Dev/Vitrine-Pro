"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Search, Sun } from "lucide-react";
import { Logo } from "@/components/Logo";

type PageItem = { id: string; name: string; slug: string };

/* ---------- tema claro/escuro (preferência guardada no navegador) ---------- */
const THEME_KEY = "admin-theme";
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener("admin-theme", cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener("admin-theme", cb); };
};
const getTheme = () => { try { return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark"; } catch { return "dark"; } };

const NAV = [
  { href: "/admin", label: "Painel" },
  { href: "/admin/paginas", label: "Páginas" },
  { href: "/admin/avaliacoes", label: "Avaliações" },
  { href: "/admin/categorias", label: "Categorias" },
] as const;

/* ---------- Ctrl+K ---------- */
function CommandPalette({ pages, open, onClose }: { pages: PageItem[]; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const items = useMemo(() => {
    const base = [
      ...NAV.map((n) => ({ key: n.href, label: `Ir para ${n.label}`, href: n.href })),
      { key: "briefing", label: "Gerar página com IA", href: "/admin/briefing" },
    ];
    const pgs = pages.map((p) => ({ key: p.id, label: `Editar: ${p.name || "Sem nome"} (/${p.slug})`, href: `/admin/editor/${p.id}` }));
    const term = q.trim().toLowerCase();
    return [...base, ...pgs].filter((i) => !term || i.label.toLowerCase().includes(term)).slice(0, 12);
  }, [pages, q]);

  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 0); }, [open]);

  if (!open) return null;
  const go = (href: string) => { onClose(); setQ(""); setIdx(0); router.push(href); };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[15vh]" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Busca rápida" className="w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-neutral-900 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={input}
          value={q}
          onChange={(e) => { setQ(e.target.value); setIdx(0); }}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, items.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
            else if (e.key === "Enter" && items[idx]) go(items[idx].href);
          }}
          role="combobox"
          aria-expanded="true"
          aria-controls="cmdk-list"
          placeholder="Buscar páginas e ações…"
          className="w-full border-b border-white/10 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-neutral-500"
        />
        <ul id="cmdk-list" role="listbox" className="max-h-72 overflow-y-auto p-1">
          {items.map((i, n) => (
            <li key={i.key} role="option" aria-selected={n === idx}>
              <button type="button" onMouseEnter={() => setIdx(n)} onClick={() => go(i.href)}
                className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm ${n === idx ? "bg-white/10" : ""}`}>
                {i.label}
              </button>
            </li>
          ))}
          {!items.length && <li className="px-3 py-6 text-center text-sm text-neutral-500">Nada encontrado</li>}
        </ul>
      </div>
    </div>
  );
}

export function AdminShell({ pages, signOut, children }: { pages: PageItem[]; signOut: () => Promise<void>; children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const toggleTheme = useCallback(() => {
    try { localStorage.setItem(THEME_KEY, theme === "light" ? "dark" : "light"); } catch {}
    window.dispatchEvent(new Event("admin-theme"));
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <div className={`${theme === "light" ? "admin-light" : ""} min-h-screen bg-neutral-950 text-neutral-100`}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-5">
          <Link href="/admin" aria-label="Painel"><Logo className="text-sm" /></Link>
          <nav className="flex items-center gap-4 text-sm" aria-label="Admin">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}
                className={active(n.href) ? "font-semibold" : "text-neutral-400 hover:text-white"}>{n.label}</Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-neutral-400 hover:text-white">
            <Search className="h-4 w-4" />Buscar<kbd className="rounded bg-white/10 px-1.5 text-xs">Ctrl K</kbd>
          </button>
          <button onClick={toggleTheme} aria-label={theme === "light" ? "Tema escuro" : "Tema claro"} className="rounded-lg border border-white/10 p-1.5 text-neutral-400 hover:text-white">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <form action={signOut}><button className="px-2 py-1.5 text-neutral-400 hover:text-white">Sair</button></form>
        </div>
      </header>
      {children}
      <CommandPalette pages={pages} open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
