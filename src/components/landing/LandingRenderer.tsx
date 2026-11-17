"use client";

import { Fragment, type MouseEvent } from "react";
import type { ReviewsData } from "@/lib/reviews";
import { Reviews } from "./Reviews";
import type { LandingData, Section } from "@/lib/landing/schema";
import { themeStyle } from "@/lib/landing/themes";
import { LandingCtx, type Mode } from "./primitives";
import { About, Faq, FinalCta, Footer, Hero, How, Plans, Results, Testimonials, WhatsAppFab } from "./sections";

function renderSection(s: Section) {
  switch (s.type) {
    case "hero": return <Hero key={s.id} s={s} />;
    case "plans": return <Plans key={s.id} s={s} />;
    case "about": return <About key={s.id} s={s} />;
    case "results": return <Results key={s.id} s={s} />;
    case "how": return <How key={s.id} s={s} />;
    case "testimonials": return <Testimonials key={s.id} s={s} />;
    case "faq": return <Faq key={s.id} s={s} />;
    case "cta": return <FinalCta key={s.id} s={s} />;
    case "footer": return <Footer key={s.id} s={s} />;
  }
}

export function LandingRenderer({
  data, mode = "public", onFieldClick, reviews,
}: { data: LandingData; mode?: Mode; onFieldClick?: (field: string) => void; reviews?: ReviewsData | null }) {
  function click(e: MouseEvent) {
    if (mode !== "preview" || !onFieldClick) return;
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-field]");
    if (el?.dataset.field) {
      e.preventDefault();
      onFieldClick(el.dataset.field);
    }
  }

  return (
    <LandingCtx.Provider value={{ mode, data }}>
      <div
        data-template={data.theme.template}
        style={themeStyle(data.theme)}
        onClick={click}
        className="lp min-h-full bg-[var(--lp-bg)] font-[family-name:var(--lp-font-body)] text-[var(--lp-fg)]"
      >
        {data.sections.filter((s) => s.enabled).map((s) => (
          <Fragment key={s.id}>
            {/* avaliações (dinâmicas) entram logo antes do rodapé */}
            {s.type === "footer" && mode === "public" && reviews && <Reviews data={reviews} />}
            {renderSection(s)}
          </Fragment>
        ))}
        {!data.sections.some((s) => s.enabled && s.type === "footer") && mode === "public" && reviews && <Reviews data={reviews} />}
        {mode === "public" && <WhatsAppFab />}
      </div>
    </LandingCtx.Provider>
  );
}
