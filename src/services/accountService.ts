import { supabase } from "@/lib/supabase";

export async function runAccountAction(action: "deactivate" | "delete"): Promise<void> {
    const { data, error } = await supabase.functions.invoke("account-lifecycle", {
        body: { action, ...(action === "delete" ? { confirm: true } : {}) },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
}
