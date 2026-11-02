"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/utils/require-admin";

function str(formData: FormData, key: string) {
    return String(formData.get(key) ?? "").trim();
}

export async function createStep(formData: FormData) {
    const { supabase } = await requireAdmin();
    const chainId = str(formData, "chain_id");
    const instruction = str(formData, "instruction");
    const modelId = str(formData, "llm_model_id");
    if (!chainId || !instruction) return;

    const { data: last } = await supabase
        .from("prompt_chain_steps")
        .select("step_order")
        .eq("chain_id", chainId)
        .order("step_order", { ascending: false })
        .limit(1);
    const nextOrder = (last?.[0]?.step_order ?? 0) + 1;

    await supabase.from("prompt_chain_steps").insert({
        chain_id: chainId,
        step_order: nextOrder,
        instruction,
        llm_model_id: modelId || null,
    });
    revalidatePath(`/chains/${chainId}`);
}

export async function updateStep(formData: FormData) {
    const { supabase } = await requireAdmin();
    const id = str(formData, "id");
    const chainId = str(formData, "chain_id");
    const instruction = str(formData, "instruction");
    const modelId = str(formData, "llm_model_id");
    if (!id || !instruction) return;

    await supabase
        .from("prompt_chain_steps")
        .update({ instruction, llm_model_id: modelId || null })
        .eq("id", id);
    revalidatePath(`/chains/${chainId}`);
}

export async function deleteStep(formData: FormData) {
    const { supabase } = await requireAdmin();
    const id = str(formData, "id");
    const chainId = str(formData, "chain_id");
    if (!id) return;

    await supabase.from("prompt_chain_steps").delete().eq("id", id);

    // 删除后把剩下的步骤重新编号 1,2,3...
    const { data: rest } = await supabase
        .from("prompt_chain_steps")
        .select("id")
        .eq("chain_id", chainId)
        .order("step_order", { ascending: true });
    for (let i = 0; i < (rest ?? []).length; i++) {
        await supabase
            .from("prompt_chain_steps")
            .update({ step_order: i + 1 })
            .eq("id", rest![i].id);
    }
    revalidatePath(`/chains/${chainId}`);
}

export async function moveStep(formData: FormData) {
    const { supabase } = await requireAdmin();
    const chainId = str(formData, "chain_id");
    const id = str(formData, "id");
    const direction = str(formData, "direction"); // "up" 或 "down"

    const { data: steps } = await supabase
        .from("prompt_chain_steps")
        .select("id, step_order")
        .eq("chain_id", chainId)
        .order("step_order", { ascending: true });
    const list = steps ?? [];
    const i = list.findIndex((s) => String(s.id) === id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= list.length) return;

    const a = list[i];
    const b = list[j];
    // 先把 a 移到一个很大的临时值，避免排序号冲突
    const temp = 1000000;
    const r1 = await supabase
        .from("prompt_chain_steps")
        .update({ step_order: temp })
        .eq("id", a.id);
    if (r1.error) throw new Error(r1.error.message);

    const r2 = await supabase
        .from("prompt_chain_steps")
        .update({ step_order: a.step_order })
        .eq("id", b.id);
    if (r2.error) throw new Error(r2.error.message);

    const r3 = await supabase
        .from("prompt_chain_steps")
        .update({ step_order: b.step_order })
        .eq("id", a.id);
    if (r3.error) throw new Error(r3.error.message);
    revalidatePath(`/chains/${chainId}`);
}