"use client";

import { createContext, useContext, useEffect, useState, type ElementType, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import type { LandingData } from "@/lib/landing/schema";
import { defaultWhatsappMessage, whatsappUrl } from "@/lib/landing/utils";

export type Mode = "public" | "preview";
export const LandingCtx = createContext<{ mode: Mode; data: LandingData }>(null!);
export const useLanding = () => useContext(LandingCtx);

/** Texto editável: vazio some no público e vira "preencher" no preview. */
export function Text({
  v, field, as: Tag = "span", className = "", hint = "preencher",
}: { v: string; field: string; as?: ElementType; className?: string; hint?: string }) {
  const { mode } = useLanding();
  if (!v) {
    if (mode === "public") return null;
    return (
      <Tag data-field={field} className={`${className} italic opacity-60 outline-dashed outline-1 outline-amber-400/70`}>
        {hint}
      </Tag>
    );
  }
  return <Tag data-field={field} className={className}>{v}</Tag>;
}

export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  const { mode } = useLanding();
  if (reduce || mode === "preview") return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  );
}

export function Img({ url, alt, field, className = "", priority = false }: { url: string; alt: string; field: string; className?: string; priority?: boolean }) {
  const { mode } = useLanding();
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img data-field={field} src={url} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" className={`object-cover ${className}`} />;
  }
  if (mode === "public") return null;
  return (
    <div
      data-field={field}
      className={`flex items-center justify-center bg-[var(--lp-card)] text-sm italic text-[var(--lp-muted)] outline-dashed outline-1 outline-amber-400/70 ${className}`}
    >
      preencher (foto)
    </div>
  );
}

export function WhatsAppLink({ label, className = "", field }: { label: string; className?: string; field: string }) {
  const { data, mode } = useLanding();
  const href = whatsappUrl(data.profile.whatsapp, data.whatsappMessage || defaultWhatsappMessage(data.profile.name));
  if (!href && mode === "public") return null;
  return (
    <a
      data-field={field}
      href={href || undefined}
      target="_blank"
      rel="noopener noreferrer"
      data-track="whatsapp_click"
      className={`inline-flex items-center justify-center bg-[var(--lp-primary)] px-6 py-3 font-semibold text-[var(--lp-on-primary)] transition hover:brightness-110 rounded-[var(--lp-radius)] ${className}`}
    >
      {label || (mode === "preview" ? "preencher (botão)" : "Falar no WhatsApp")}
    </a>
  );
}

export function Carousel({ children, label }: { children: ReactNode[]; label: string }) {
  const [ref, api] = useEmblaCarousel({ align: "start", loop: false });
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!api) return;
    const on = () => setIdx(api.selectedScrollSnap());
    api.on("select", on);
    return () => { api.off("select", on); };
  }, [api]);
  return (
    <div role="region" aria-roledescription="carrossel" aria-label={label}>
      <div ref={ref} className="overflow-hidden">
        <div className="flex gap-4">
          {children.map((c, i) => (
            <div key={i} className="min-w-0 flex-[0_0_80%] sm:flex-[0_0_45%] lg:flex-[0_0_32%]">{c}</div>
          ))}
        </div>
      </div>
      {children.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {children.map((_, i) => (
            <button
              key={i}
              aria-label={`Ir para o item ${i + 1}`}
              onClick={() => api?.scrollTo(i)}
              className={`h-2 w-2 rounded-full ${i === idx ? "bg-[var(--lp-primary)]" : "bg-[var(--lp-border)]"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
