"use server";

import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";
import { requireAdmin } from "@/utils/require-admin";

const MODEL = "gemini-3.8-flash";
async function withRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < tries; attempt++) {
        try {
            return await fn();
        } catch (e) {
            lastErr = e;
            const msg = e instanceof Error ? e.message : String(e);
            // 只在「繁忙/限流」时重试，其他错误直接抛出
            const retryable =
                msg.includes("503") ||
                msg.includes("429") ||
                msg.includes("UNAVAILABLE");
            if (!retryable || attempt === tries - 1) throw e;
            await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        }
    }
    throw lastErr;
}
export async function runChain(formData: FormData) {
    const { supabase } = await requireAdmin();
    const chainId = String(formData.get("chain_id") ?? "").trim();
    const imageUrl = String(formData.get("image_url") ?? "").trim();
    if (!chainId || !imageUrl) return;

    const { data: steps } = await supabase
        .from("prompt_chain_steps")
        .select("id, step_order, instruction")
        .eq("chain_id", chainId)
        .order("step_order", { ascending: true });

    const outputs: { step: number; instruction: string; output: string }[] = [];
    let finalOutput = "";

    try {
        if (!steps || steps.length === 0) {
            throw new Error("This chain has no steps.");
        }
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not set.");
        }

        // 下载图片，转成 base64 给 Gemini 看
        const imgRes = await fetch(imageUrl, {
            signal: AbortSignal.timeout(15000),
        });
        if (!imgRes.ok) {
            throw new Error(`Could not download image (${imgRes.status}).`);
        }
        const mimeType = imgRes.headers.get("content-type") ?? "image/jpeg";
        const base64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");

        const ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
            httpOptions: { timeout: 25000 },
        });

        for (let i = 0; i < steps.length; i++) {
            const s = steps[i];
            const previous = outputs
                .map((o) => `Result of step ${o.step}:\n${o.output}`)
                .join("\n\n");
            const prompt = previous
                ? `${previous}\n\nNow do step ${i + 1}:\n${s.instruction}`
                : s.instruction;

            const res = await withRetry(() =>
                ai.models.generateContent({
                    model: MODEL,
                    contents: [
                        {
                            role: "user",
                            parts: [
                                { inlineData: { mimeType, data: base64 } },
                                { text: prompt },
                            ],
                        },
                    ],
                }),
            );

            const text = (res.text ?? "").trim();
            outputs.push({ step: i + 1, instruction: s.instruction, output: text });
            finalOutput = text;
        }
    } catch (e) {
        finalOutput = `Error: ${e instanceof Error ? e.message : String(e)}`;
    }

    await supabase.from("prompt_chain_runs").insert({
        chain_id: chainId,
        image_url: imageUrl,
        step_outputs: outputs,
        final_output: finalOutput,
    });

    revalidatePath(`/chains/${chainId}`);
}

export async function deleteRun(formData: FormData) {
    const { supabase } = await requireAdmin();
    const id = String(formData.get("id") ?? "").trim();
    const chainId = String(formData.get("chain_id") ?? "").trim();
    if (!id) return;

    await supabase.from("prompt_chain_runs").delete().eq("id", id);
    revalidatePath(`/chains/${chainId}`);
}