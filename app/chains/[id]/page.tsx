import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/utils/require-admin";
import ConfirmButton from "@/components/confirm-button";
import { updateChain, deleteChain } from "../actions";
import {
    createStep,
    updateStep,
    deleteStep,
    moveStep,
} from "../step-actions";
import { runChain, deleteRun } from "../run-actions";

export const maxDuration = 60;

const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700";
const smallBtn =
    "rounded-full border border-zinc-300 px-3 py-1 text-xs hover:border-yellow-400 dark:border-zinc-700";

export default async function ChainPage({
                                            params,
                                        }: {
    params: Promise<{ id: string }>;
}) {
    const { supabase } = await requireAdmin();
    const { id } = await params;

    const { data: chain } = await supabase
        .from("prompt_chains")
        .select("id, name, description")
        .eq("id", id)
        .single();
    if (!chain) notFound();

    const { data: stepsData } = await supabase
        .from("prompt_chain_steps")
        .select("id, step_order, instruction, llm_model_id")
        .eq("chain_id", id)
        .order("step_order", { ascending: true });
    const steps = stepsData ?? [];

    const { data: modelsData } = await supabase
        .from("llm_models")
        .select("id, name")
        .order("name", { ascending: true });
    const models = modelsData ?? [];

    const { data: runsData } = await supabase
        .from("prompt_chain_runs")
        .select("id, image_url, step_outputs, final_output, created_at")
        .eq("chain_id", id)
        .order("created_at", { ascending: false });
    const runs = runsData ?? [];

    const modelOptions = (
        <>
            <option value="">(no model)</option>
            {models.map((m) => (
                <option key={m.id} value={m.id}>
                    {m.name}
                </option>
            ))}
        </>
    );

    return (
        <div className="space-y-10">
            <div>
                <Link
                    href="/"
                    className="text-sm text-zinc-500 hover:text-yellow-500"
                >
                    ← All chains
                </Link>
                <h1 className="mt-2 text-3xl font-bold">{chain.name}</h1>
            </div>

            {/* 编辑链 */}
            <section className="rounded-2xl border border-zinc-300 p-5 dark:border-zinc-700">
                <h2 className="text-lg font-semibold">Chain details</h2>
                <form action={updateChain} className="mt-4 space-y-3">
                    <input type="hidden" name="id" value={chain.id} />
                    <input
                        name="name"
                        required
                        defaultValue={chain.name}
                        className={inputClass}
                    />
                    <textarea
                        name="description"
                        rows={2}
                        defaultValue={chain.description ?? ""}
                        placeholder="Description (optional)"
                        className={inputClass}
                    />
                    <button
                        type="submit"
                        className="rounded-full bg-yellow-300 px-5 py-2 text-sm font-bold text-black hover:bg-yellow-200"
                    >
                        Save chain
                    </button>
                </form>
                <form action={deleteChain} className="mt-4">
                    <input type="hidden" name="id" value={chain.id} />
                    <ConfirmButton
                        message="Delete this chain and all its steps? This cannot be undone."
                        label="Delete chain"
                    />
                </form>
            </section>

            {/* 步骤列表 */}
            <section>
                <h2 className="text-lg font-semibold">Steps ({steps.length})</h2>
                <div className="mt-4 space-y-4">
                    {steps.map((s, idx) => (
                        <div
                            key={s.id}
                            className="rounded-2xl border border-zinc-300 p-5 dark:border-zinc-700"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-yellow-600 dark:text-yellow-300">
                  Step {idx + 1}
                </span>
                                <div className="flex gap-2">
                                    <form action={moveStep}>
                                        <input type="hidden" name="chain_id" value={chain.id} />
                                        <input type="hidden" name="id" value={s.id} />
                                        <input type="hidden" name="direction" value="up" />
                                        <button
                                            type="submit"
                                            disabled={idx === 0}
                                            className={`${smallBtn} disabled:opacity-30`}
                                        >
                                            ↑ Up
                                        </button>
                                    </form>
                                    <form action={moveStep}>
                                        <input type="hidden" name="chain_id" value={chain.id} />
                                        <input type="hidden" name="id" value={s.id} />
                                        <input type="hidden" name="direction" value="down" />
                                        <button
                                            type="submit"
                                            disabled={idx === steps.length - 1}
                                            className={`${smallBtn} disabled:opacity-30`}
                                        >
                                            ↓ Down
                                        </button>
                                    </form>
                                    <form action={deleteStep}>
                                        <input type="hidden" name="chain_id" value={chain.id} />
                                        <input type="hidden" name="id" value={s.id} />
                                        <ConfirmButton message="Delete this step?" />
                                    </form>
                                </div>
                            </div>

                            <form action={updateStep} className="mt-3 space-y-3">
                                <input type="hidden" name="chain_id" value={chain.id} />
                                <input type="hidden" name="id" value={s.id} />
                                <textarea
                                    name="instruction"
                                    required
                                    rows={4}
                                    defaultValue={s.instruction}
                                    className={inputClass}
                                />
                                <select
                                    name="llm_model_id"
                                    defaultValue={s.llm_model_id ?? ""}
                                    className={inputClass}
                                >
                                    {modelOptions}
                                </select>
                                <button type="submit" className={smallBtn}>
                                    Save step
                                </button>
                            </form>
                        </div>
                    ))}
                    {steps.length === 0 && (
                        <p className="text-zinc-500">No steps yet. Add one below.</p>
                    )}
                </div>
            </section>

            {/* 新增步骤 */}
            <section className="rounded-2xl border border-zinc-300 p-5 dark:border-zinc-700">
                <h2 className="text-lg font-semibold">Add a step</h2>
                <form action={createStep} className="mt-4 space-y-3">
                    <input type="hidden" name="chain_id" value={chain.id} />
                    <textarea
                        name="instruction"
                        required
                        rows={3}
                        placeholder="Instruction for this step"
                        className={inputClass}
                    />
                    <select name="llm_model_id" className={inputClass}>
                        {modelOptions}
                    </select>
                    <button
                        type="submit"
                        className="rounded-full bg-yellow-300 px-5 py-2 text-sm font-bold text-black hover:bg-yellow-200"
                    >
                        Add step
                    </button>
                </form>
            </section>

            {/* 生成 */}
            <section className="rounded-2xl border border-zinc-300 p-5 dark:border-zinc-700">
                <h2 className="text-lg font-semibold">Generate with this chain</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Paste an image URL. The chain runs every step in order. This can take
                    10–30 seconds.
                </p>
                <form action={runChain} className="mt-4 space-y-3">
                    <input type="hidden" name="chain_id" value={chain.id} />
                    <input
                        name="image_url"
                        required
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        className={inputClass}
                    />
                    <button
                        type="submit"
                        className="rounded-full bg-yellow-300 px-5 py-2 text-sm font-bold text-black hover:bg-yellow-200"
                    >
                        Generate
                    </button>
                </form>
            </section>

            {/* 历史结果 */}
            <section>
                <h2 className="text-lg font-semibold">
                    Generated results ({runs.length})
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {runs.map((r) => {
                        const outs = (r.step_outputs ?? []) as {
                            step: number;
                            output: string;
                        }[];
                        return (
                            <div
                                key={r.id}
                                className="overflow-hidden rounded-2xl border border-zinc-300 dark:border-zinc-700"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={r.image_url}
                                    alt=""
                                    className="h-56 w-full object-cover"
                                />
                                <div className="space-y-3 p-4">
                                    <p className="font-semibold">{r.final_output || "(empty)"}</p>
                                    <details className="text-sm">
                                        <summary className="cursor-pointer text-zinc-500">
                                            All step outputs
                                        </summary>
                                        <ol className="mt-2 space-y-2">
                                            {outs.map((o) => (
                                                <li key={o.step} className="text-zinc-600 dark:text-zinc-300">
                                                    <span className="font-bold">Step {o.step}:</span>{" "}
                                                    {o.output}
                                                </li>
                                            ))}
                                        </ol>
                                    </details>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-zinc-500">
                                            {new Date(r.created_at).toLocaleString()}
                                        </p>
                                        <form action={deleteRun}>
                                            <input type="hidden" name="chain_id" value={chain.id} />
                                            <input type="hidden" name="id" value={r.id} />
                                            <ConfirmButton message="Delete this result?" />
                                        </form>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {runs.length === 0 && (
                        <p className="text-zinc-500">Nothing generated yet.</p>
                    )}
                </div>
            </section>
        </div>
    );
}