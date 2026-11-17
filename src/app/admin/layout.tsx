import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { createClient, isAdminUser } from "@/lib/supabase/server";
import { signOut } from "./actions";

export const metadata = { title: "Admin", robots: { index: false } };

// Defesa em profundidade: o proxy já bloqueia, mas validamos de novo no servidor.
async function AdminGate({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminUser(user)) redirect("/login");
  const { data: pages } = await supabase.from("professionals").select("id, name, slug").order("updated_at", { ascending: false }).limit(200);
  return <AdminShell pages={pages ?? []} signOut={signOut}>{children}</AdminShell>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 p-6 text-neutral-400">Carregando…</div>}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
