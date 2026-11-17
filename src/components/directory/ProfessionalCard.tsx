import Link from "next/link";
import { MapPin, MessageCircle } from "lucide-react";
import type { Card } from "@/lib/directory";
import { defaultWhatsappMessage, formatBRL, whatsappUrl } from "@/lib/landing/utils";
import { Stars } from "./Stars";

export function ProfessionalCard({ p }: { p: Card }) {
  const place = [p.city, p.state].filter(Boolean).join(" / ");
  const wa = p.whatsapp ? whatsappUrl(p.whatsapp, defaultWhatsappMessage(p.name)) : "";
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/${p.slug}`} className="block" aria-label={`Ver página de ${p.name}`}>
        {p.hero_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.hero_url} alt={p.name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-neutral-100 text-4xl font-bold text-neutral-400" aria-hidden>
            {p.name.charAt(0).toUpperCase()}
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="font-semibold text-neutral-900"><Link href={`/${p.slug}`} className="hover:underline">{p.name}</Link></h3>
          {p.category_name && <p className="text-sm text-neutral-600">{p.category_name}</p>}
        </div>
        <p className="flex items-center gap-1 text-sm text-neutral-600">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {[place, p.online ? "Online" : ""].filter(Boolean).join(" · ") || "Local não informado"}
        </p>
        <p className="flex items-center gap-2 text-sm">
          {p.avg_rating != null && p.review_count > 0 ? (
            <>
              <Stars value={p.avg_rating} />
              <span className="font-medium">{p.avg_rating.toFixed(1).replace(".", ",")}</span>
              <span className="text-neutral-500">({p.review_count})</span>
            </>
          ) : (
            <span className="text-neutral-500">Sem avaliações</span>
          )}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <p className="text-sm text-neutral-600">
            {p.min_price_cents != null ? <>A partir de <strong className="text-neutral-900">{formatBRL(p.min_price_cents)}</strong>/mês</> : "Consulte valores"}
          </p>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={`Chamar ${p.name} no WhatsApp`}
              className="inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-3 py-1.5 text-sm font-medium text-white hover:brightness-95">
              <MessageCircle className="h-4 w-4" />WhatsApp
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
