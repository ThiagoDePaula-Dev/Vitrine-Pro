"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { submitReview, type ReviewState } from "@/app/[slug]/actions";
import type { ReviewsData } from "@/lib/reviews";
import { Reveal } from "./primitives";

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`Nota ${value} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-[var(--lp-border)]"}`} />
      ))}
    </span>
  );
}

const field = "w-full border border-[var(--lp-border)] bg-[var(--lp-bg)] px-3 py-2 text-sm text-[var(--lp-fg)] outline-none focus:border-[var(--lp-primary)] rounded-[var(--lp-radius)]";

export function Reviews({ data }: { data: ReviewsData }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(submitReview, null);
  const [rating, setRating] = useState(0);

  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-16 sm:py-20" aria-labelledby="avaliacoes">
      <Reveal>
        <h2 id="avaliacoes" className="font-[family-name:var(--lp-font-head)] text-3xl font-bold sm:text-4xl">Avaliações</h2>
        {data.avg != null ? (
          <p className="mt-2 flex items-center gap-2 text-[var(--lp-muted)]">
            <Stars value={data.avg} />
            <strong className="text-[var(--lp-fg)]">{data.avg.toFixed(1).replace(".", ",")}</strong>
            · {data.count} {data.count === 1 ? "avaliação" : "avaliações"}
          </p>
        ) : (
          <p className="mt-2 text-[var(--lp-muted)]">Ainda não há avaliações. Seja o primeiro!</p>
        )}
      </Reveal>

      {data.items.length > 0 && (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {data.items.map((r) => (
            <li key={r.id} className="border border-[var(--lp-border)] bg-[var(--lp-card)] p-5 rounded-[var(--lp-radius)]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{r.author}</span>
                <Stars value={r.rating} />
              </div>
              {r.comment && <p className="mt-2 whitespace-pre-line text-sm text-[var(--lp-muted)]">{r.comment}</p>}
              <p className="mt-2 text-xs text-[var(--lp-muted)]">{new Date(r.date).toLocaleDateString("pt-BR")}</p>
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="mt-10 max-w-xl space-y-3 border border-[var(--lp-border)] bg-[var(--lp-card)] p-5 rounded-[var(--lp-radius)]">
        <h3 className="font-semibold">Deixe sua avaliação</h3>
        <input type="hidden" name="professionalId" value={data.professionalId} />
        {/* Honeypot: invisível para pessoas; bots costumam preencher. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>Não preencha este campo<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
        </div>
        <div>
          <label htmlFor="rv-author" className="mb-1 block text-xs font-medium">Seu nome</label>
          <input id="rv-author" name="author" required maxLength={80} className={field} />
        </div>
        <fieldset>
          <legend className="mb-1 text-xs font-medium">Nota</legend>
          <input type="hidden" name="rating" value={rating || ""} />
          <div className="flex gap-1" role="radiogroup" aria-label="Nota de 1 a 5">
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i} ${i === 1 ? "estrela" : "estrelas"}`} onClick={() => setRating(i)}>
                <Star className={`h-7 w-7 ${i <= rating ? "fill-amber-400 text-amber-400" : "text-[var(--lp-border)]"}`} />
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="rv-comment" className="mb-1 block text-xs font-medium">Comentário (opcional)</label>
          <textarea id="rv-comment" name="comment" rows={3} maxLength={1000} className={field} />
        </div>
        {state && <p role={state.ok ? "status" : "alert"} className={`text-sm ${state.ok ? "text-emerald-500" : "text-red-500"}`}>{state.message}</p>}
        <button disabled={pending || state?.ok} className="bg-[var(--lp-primary)] px-5 py-2 text-sm font-semibold text-[var(--lp-on-primary)] disabled:opacity-60 rounded-[var(--lp-radius)]">
          {pending ? "Enviando…" : "Enviar avaliação"}
        </button>
        <p className="text-xs text-[var(--lp-muted)]">Avaliações passam por moderação antes de aparecer.</p>
      </form>
    </section>
  );
}
