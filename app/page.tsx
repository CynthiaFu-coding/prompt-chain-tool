import Link from "next/link";
import { requireAdmin } from "@/utils/require-admin";
import { createChain } from "./chains/actions";

export default async function HomePage() {
    const { supabase } = await requireAdmin();

    const { data: chains, error } = await supabase
        .from("prompt_chains")
        .select("id, name, description, created_at")
        .order("created_at", { ascending: false });

    const { data: steps } = await supabase
        .from("prompt_chain_steps")
        .select("chain_id");

    const stepCount: Record<string, number> = {};
    for (const s of steps ?? []) {
        stepCount[s.chain_id] = (stepCount[s.chain_id] ?? 0) + 1;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold">Prompt Chains</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {(chains ?? []).length} chains
            </p>

            {error && (
                <div className="mt-6 rounded-xl border border-red-500 p-4 text-sm text-red-500">
                    Could not load chains: {error.message}
                </div>
            )}

            <form
                action={createChain}
                className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-zinc-300 p-4 dark:border-zinc-700"
            >
                <input
                    name="name"
                    required
                    placeholder="New chain name"
                    className="min-w-48 flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
                />
                <input
                    name="description"
                    placeholder="Description (optional)"
                    className="min-w-48 flex-[2] rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
                />
                <button
                    type="submit"
                    className="rounded-full bg-yellow-300 px-5 py-2 text-sm font-bold text-black hover:bg-yellow-200"
                >
                    New chain
                </button>
            </form>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(chains ?? []).map((c) => (
                    <Link
                        key={c.id}
                        href={`/chains/${c.id}`}
                        className="rounded-2xl border border-zinc-300 p-5 hover:border-yellow-400 dark:border-zinc-700"
                    >
                        <p className="text-lg font-semibold">{c.name}</p>
                        {c.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                                {c.description}
                            </p>
                        )}
                        <p className="mt-3 text-xs text-zinc-500">
                            {stepCount[c.id] ?? 0} steps
                        </p>
                    </Link>
                ))}
                {(chains ?? []).length === 0 && !error && (
                    <p className="text-zinc-500">No chains yet. Create one above.</p>
                )}
            </div>
        </div>
    );
}