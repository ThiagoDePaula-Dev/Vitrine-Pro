"use client";

import { useState } from "react";
import { AtSign, Check, ChevronDown, Mail, MessageCircle } from "lucide-react";
import type { Section } from "@/lib/landing/schema";
import { formatBRL, periodLabel, planSavings, whatsappUrl, defaultWhatsappMessage } from "@/lib/landing/utils";
import { Carousel, Img, Reveal, Text, WhatsAppLink, useLanding } from "./primitives";

type S<T extends Section["type"]> = Extract<Section, { type: T }>;

const wrap = "mx-auto w-full max-w-5xl px-5 py-16 sm:py-20";
const h2 = "font-[family-name:var(--lp-font-head)] text-3xl font-bold sm:text-4xl";
const card = "border border-[var(--lp-border)] bg-[var(--lp-card)] rounded-[var(--lp-radius)]";

export function Hero({ s }: { s: S<"hero"> }) {
  const { data } = useLanding();
  const p = data.profile;
  const place = [p.city, p.state].filter(Boolean).join(" / ");
  return (
    <section className="lp-hero relative overflow-hidden">
      <div className={`${wrap} grid items-center gap-10 md:grid-cols-2`}>
        <Reveal>
          <Text v={s.eyebrow} field={`${s.id}.eyebrow`} as="p" className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--lp-accent)]" />
          <Text v={s.title} field={`${s.id}.title`} as="h1" className="font-[family-name:var(--lp-font-head)] text-4xl font-extrabold leading-tight sm:text-5xl" />
          <Text v={s.subtitle} field={`${s.id}.subtitle`} as="p" className="mt-4 text-lg text-[var(--lp-muted)]" />
          <p className="mt-4 text-sm text-[var(--lp-muted)]">
            <Text v={p.name} field="profile.name" className="font-semibold text-[var(--lp-fg)]" />
            {p.registry && <> · <Text v={p.registry} field="profile.registry" /></>}
            {place && <> · {place}</>}
            {p.online && <> · Online</>}
          </p>
          <WhatsAppLink field={`${s.id}.ctaLabel`} label={s.ctaLabel} className="mt-6" />
        </Reveal>
        <Reveal delay={0.1}>
          <Img url={s.image.url} alt={s.image.alt || p.name} field={`${s.id}.image`} priority className="aspect-[4/5] w-full rounded-[var(--lp-radius)]" />
        </Reveal>
      </div>
    </section>
  );
}

export function Plans({ s }: { s: S<"plans"> }) {
  const { mode } = useLanding();
  if (!s.items.length && mode === "public") return null;
  return (
    <section className={wrap}>
      <Reveal className="mb-10 text-center">
        <Text v={s.title} field={`${s.id}.title`} as="h2" className={h2} />
        <Text v={s.subtitle} field={`${s.id}.subtitle`} as="p" className="mt-2 text-[var(--lp-muted)]" />
      </Reveal>
      {!s.items.length && <p data-field={`${s.id}.items`} className="text-center italic opacity-60">preencher (planos)</p>}
      <div className="grid gap-5 md:grid-cols-3">
        {s.items.map((pl, i) => {
          const save = planSavings(pl, s.items);
          const f = `${s.id}.items.${i}`;
          return (
            <Reveal key={i} delay={i * 0.08}>
              <div className={`relative flex h-full flex-col p-6 ${card} ${pl.highlighted ? "ring-2 ring-[var(--lp-primary)]" : ""}`}>
                {pl.highlighted && (
                  <span className="absolute -top-3 left-6 rounded-full bg-[var(--lp-primary)] px-3 py-1 text-xs font-bold text-[var(--lp-on-primary)]">
                    Mais escolhido
                  </span>
                )}
                <Text v={pl.name} field={`${f}.name`} as="h3" className="text-xl font-bold" />
                <p className="mt-1 text-xs uppercase tracking-wide text-[var(--lp-muted)]">{periodLabel(pl.periodMonths)}</p>
                {pl.priceCents != null ? (
                  <div className="mt-4">
                    <span data-field={`${f}.priceCents`} className="text-3xl font-extrabold">{formatBRL(pl.priceCents)}</span>
                    {pl.periodMonths > 1 && (
                      <p className="text-sm text-[var(--lp-muted)]">{formatBRL(Math.round(pl.priceCents / pl.periodMonths))} / mês</p>
                    )}
                    {save > 0 && <p className="mt-1 text-sm font-semibold text-[var(--lp-accent)]">Economize {formatBRL(save)}</p>}
                  </div>
                ) : (
                  mode === "preview" && <p data-field={`${f}.priceCents`} className="mt-4 italic opacity-60">preencher (preço)</p>
                )}
                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {pl.features.filter(Boolean).map((ft, j) => (
                    <li key={j} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lp-primary)]" />{ft}</li>
                  ))}
                </ul>
                {pl.checkoutUrl ? (
                  <a
                    data-field={`${f}.checkoutUrl`}
                    data-track="checkout_click"
                    href={pl.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 block bg-[var(--lp-primary)] py-3 text-center font-semibold text-[var(--lp-on-primary)] rounded-[var(--lp-radius)] hover:brightness-110"
                  >
                    Quero este plano
                  </a>
                ) : (
                  mode === "preview" && <p data-field={`${f}.checkoutUrl`} className="mt-6 text-center italic opacity-60">preencher (link de checkout)</p>
                )}
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

export function About({ s }: { s: S<"about"> }) {
  return (
    <section className={wrap}>
      <Reveal>
        <Text v={s.title} field={`${s.id}.title`} as="h2" className={h2} />
        <Text v={s.text} field={`${s.id}.text`} as="p" className="mt-4 max-w-3xl whitespace-pre-line text-[var(--lp-muted)]" />
      </Reveal>
      {s.images.length > 0 && (
        <div className="mt-8">
          <Carousel label="Fotos">
            {s.images.map((im, i) => <Img key={i} url={im.url} alt={im.alt} field={`${s.id}.images.${i}`} className="aspect-[4/3] w-full rounded-[var(--lp-radius)]" />)}
          </Carousel>
        </div>
      )}
    </section>
  );
}

export function Results({ s }: { s: S<"results"> }) {
  const { data } = useLanding();
  return (
    <section className={wrap}>
      <Reveal>
        <Text v={s.title} field={`${s.id}.title`} as="h2" className={h2} />
        {s.images.length > 0 && (
          <div className="mt-8">
            <Carousel label="Resultados">
              {s.images.map((im, i) => <Img key={i} url={im.url} alt={im.alt} field={`${s.id}.images.${i}`} className="aspect-square w-full rounded-[var(--lp-radius)]" />)}
            </Carousel>
          </div>
        )}
        <p className="mt-6 text-sm text-[var(--lp-muted)]">
          Resultados individuais: variam de pessoa para pessoa.
          {data.isHealth && " Não há promessa de resultado."}
        </p>
      </Reveal>
    </section>
  );
}

export function How({ s }: { s: S<"how"> }) {
  return (
    <section className={wrap}>
      <Reveal><Text v={s.title} field={`${s.id}.title`} as="h2" className={h2} /></Reveal>
      <ol className="mt-8 grid gap-5 md:grid-cols-3">
        {s.steps.map((st, i) => (
          <Reveal key={i} delay={i * 0.08}>
            <li className={`list-none p-6 ${card}`}>
              <span className="text-sm font-bold text-[var(--lp-accent)]">0{i + 1}</span>
              <Text v={st.title} field={`${s.id}.steps.${i}.title`} as="h3" className="mt-1 block text-lg font-bold" />
              <Text v={st.text} field={`${s.id}.steps.${i}.text`} as="p" className="mt-2 text-sm text-[var(--lp-muted)]" />
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

export function Testimonials({ s }: { s: S<"testimonials"> }) {
  const { mode } = useLanding();
  if (!s.images.length && mode === "public") return null;
  return (
    <section className={wrap}>
      <Reveal><Text v={s.title} field={`${s.id}.title`} as="h2" className={h2} /></Reveal>
      <div className="mt-8">
        {s.images.length ? (
          <Carousel label="Depoimentos">
            {s.images.map((im, i) => <Img key={i} url={im.url} alt={im.alt || "Depoimento de cliente"} field={`${s.id}.images.${i}`} className="aspect-[3/4] w-full rounded-[var(--lp-radius)]" />)}
          </Carousel>
        ) : (
          <p data-field={`${s.id}.images`} className="italic opacity-60">preencher (prints de depoimentos reais)</p>
        )}
      </div>
    </section>
  );
}

export function Faq({ s }: { s: S<"faq"> }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!s.items.length) return null;
  return (
    <section className={`${wrap} max-w-3xl`}>
      <Reveal><Text v={s.title} field={`${s.id}.title`} as="h2" className={h2} /></Reveal>
      <div className="mt-8 space-y-3">
        {s.items.map((it, i) => (
          <div key={i} className={card}>
            <button
              aria-expanded={open === i}
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-3 p-4 text-left font-semibold"
            >
              <Text v={it.q} field={`${s.id}.items.${i}.q`} />
              <ChevronDown className={`h-5 w-5 shrink-0 transition ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <Text v={it.a} field={`${s.id}.items.${i}.a`} as="p" className="px-4 pb-4 text-sm text-[var(--lp-muted)]" />}
          </div>
        ))}
      </div>
    </section>
  );
}

export function FinalCta({ s }: { s: S<"cta"> }) {
  return (
    <section className="lp-cta">
      <Reveal className={`${wrap} text-center`}>
        <Text v={s.title} field={`${s.id}.title`} as="h2" className={h2} />
        <Text v={s.text} field={`${s.id}.text`} as="p" className="mx-auto mt-3 max-w-xl text-[var(--lp-muted)]" />
        <WhatsAppLink field={`${s.id}.ctaLabel`} label={s.ctaLabel} className="mt-6" />
      </Reveal>
    </section>
  );
}

export function Footer({ s }: { s: S<"footer"> }) {
  const { data } = useLanding();
  const p = data.profile;
  return (
    <footer className="border-t border-[var(--lp-border)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-10 text-sm text-[var(--lp-muted)]">
        <Text v={p.name} field="profile.name" className="font-semibold text-[var(--lp-fg)]" />
        {p.registry && <span>{p.registry}</span>}
        <div className="flex flex-wrap gap-4">
          {p.instagram && (
            <a className="inline-flex items-center gap-1 hover:text-[var(--lp-fg)]" href={`https://instagram.com/${p.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer">
              <AtSign className="h-4 w-4" />{p.instagram.replace(/^@/, "")}
            </a>
          )}
          {p.email && <a className="inline-flex items-center gap-1 hover:text-[var(--lp-fg)]" href={`mailto:${p.email}`}><Mail className="h-4 w-4" />{p.email}</a>}
        </div>
        {s.showCnpj && p.cnpj && <span>CNPJ {p.cnpj}</span>}
        {s.text && <span>{s.text}</span>}
      </div>
    </footer>
  );
}

export function WhatsAppFab() {
  const { data } = useLanding();
  const href = whatsappUrl(data.profile.whatsapp, data.whatsappMessage || defaultWhatsappMessage(data.profile.name));
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-track="whatsapp_click"
      aria-label="Chamar no WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
