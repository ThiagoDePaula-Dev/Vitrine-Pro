"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type Values = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword(values);
    if (error || data.user?.app_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      setError("Credenciais inválidas ou sem acesso de administrador.");
      return;
    }
    const next = params.get("next");
    router.replace(next && next.startsWith("/admin") ? next : "/admin");
    router.refresh();
  }

  const input =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-white/40";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-neutral-900 p-6"
    >
      <h1 className="text-xl font-semibold text-white">Entrar</h1>
      <div>
        <label className="mb-1 block text-sm text-neutral-300" htmlFor="email">E-mail</label>
        <input id="email" type="email" autoComplete="email" className={input} {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm text-neutral-300" htmlFor="password">Senha</label>
        <input id="password" type="password" autoComplete="current-password" className={input} {...register("password")} />
        {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
      </div>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <button
        disabled={isSubmitting}
        className="w-full rounded-lg bg-white py-2 font-medium text-black disabled:opacity-60"
      >
        {isSubmitting ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
