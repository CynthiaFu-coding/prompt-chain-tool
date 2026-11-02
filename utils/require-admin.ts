import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

// Every admin page and action calls this. Not signed in -> /login.
// Signed in but is_superadmin is not true -> /denied.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .single();

  if (profile?.is_superadmin !== true) redirect("/denied");

  return { supabase, user };
}
