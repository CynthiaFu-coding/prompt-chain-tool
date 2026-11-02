"use client";

import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  async function signIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
      <div className="flex justify-center py-16">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-300 p-8 text-center dark:border-zinc-700">
          <h1 className="text-2xl font-bold">Prompt Chain Tool</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Superadmins only.
          </p>
          <button
              onClick={signIn}
              className="mt-6 w-full rounded-full bg-yellow-300 px-6 py-3 font-bold text-black hover:bg-yellow-200"
          >
            Sign in with Google
          </button>
        </div>
      </div>
  );
}