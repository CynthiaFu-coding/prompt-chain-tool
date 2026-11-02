"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/utils/require-admin";

function val(formData: FormData, key: string) {
    const s = String(formData.get(key) ?? "").trim();
    return s === "" ? null : s;
}

export async function createChain(formData: FormData) {
    const { supabase } = await requireAdmin();
    const name = val(formData, "name");
    if (!name) throw new Error("Name is required");

    const { data, error } = await supabase
        .from("prompt_chains")
        .insert({ name, description: val(formData, "description") })
        .select("id")
        .single();
    if (error) throw new Error(error.message);

    revalidatePath("/");
    redirect(`/chains/${data.id}`);
}

export async function updateChain(formData: FormData) {
    const { supabase } = await requireAdmin();
    const id = val(formData, "id");
    const name = val(formData, "name");
    if (!id || !name) throw new Error("Missing id or name");

    const { error } = await supabase
        .from("prompt_chains")
        .update({ name, description: val(formData, "description") })
        .eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/");
    revalidatePath(`/chains/${id}`);
}

export async function deleteChain(formData: FormData) {
    const { supabase } = await requireAdmin();
    const id = val(formData, "id");
    if (!id) throw new Error("Missing id");

    // Its steps are removed automatically by the database.
    const { error } = await supabase.from("prompt_chains").delete().eq("id", id);
    if (error) throw new Error(error.message);

    revalidatePath("/");
    redirect("/");
}