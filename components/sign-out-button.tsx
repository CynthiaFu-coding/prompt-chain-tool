"use client";

import { createClient } from "@/utils/supabase/client";

export default function SignOutButton() {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={signOut}
      className="rounded-full border border-zinc-600 px-4 py-1.5 text-sm hover:bg-zinc-800"
    >
      Sign out
    </button>
  );
}
