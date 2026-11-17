"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/server";

export async function moderateReview(id: string, status: "approved" | "rejected" | "pending") {
  const supabase = await requireAdmin();
  await supabase.from("reviews").update({ status }).eq("id", id);
  revalidatePath("/admin/avaliacoes");
}
