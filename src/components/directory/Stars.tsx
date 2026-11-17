import { Star } from "lucide-react";

/** Estrelas com preenchimento fracionário (ex.: 4,5). */
export function Stars({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const row = (cls: string) => (
    <span className={`flex ${cls}`}>
      {[0, 1, 2, 3, 4].map((i) => <Star key={i} className={`${className} shrink-0 fill-current`} />)}
    </span>
  );
  return (
    <span className="relative inline-flex" role="img" aria-label={`Nota ${value.toFixed(1).replace(".", ",")} de 5`}>
      {row("text-neutral-300")}
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pct}%` }}>{row("text-amber-400")}</span>
    </span>
  );
}
