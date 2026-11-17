import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
