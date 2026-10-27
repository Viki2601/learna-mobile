import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return jsonResponse({ error: "Authentication required." }, 401);

  const projectUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!projectUrl || !anonKey || !serviceRoleKey) {
    console.error("Account lifecycle function is missing Supabase environment variables.");
    return jsonResponse({ error: "Account actions are not configured." }, 500);
  }

  const userClient = createClient(projectUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(projectUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const accessToken = authorization.slice("Bearer ".length);
  const { data: { user }, error: userError } = await userClient.auth.getUser(accessToken);
  if (userError || !user) return jsonResponse({ error: "Invalid or expired session." }, 401);

  let body: { action?: string; confirm?: boolean };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  if (body.action === "deactivate") {
    const timestamp = new Date().toISOString();
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ deactivated_at: timestamp, updated_at: timestamp })
      .eq("id", user.id);
    if (profileError) {
      console.error("Failed to mark account as deactivated:", profileError);
      return jsonResponse({ error: "Unable to deactivate this account." }, 500);
    }

    const { error: banError } = await adminClient.auth.admin.updateUserById(user.id, {
      ban_duration: "876000h",
    });
    if (banError) {
      const { error: rollbackError } = await adminClient
        .from("profiles")
        .update({ deactivated_at: null })
        .eq("id", user.id);
      if (rollbackError) console.error("Failed to roll back deactivation timestamp:", rollbackError);
      console.error("Failed to block account sign-in:", banError);
      return jsonResponse({ error: "Unable to block sign-in for this account." }, 500);
    }
    return jsonResponse({ message: "Account deactivated." });
  }

  if (body.action === "delete") {
    if (body.confirm !== true) return jsonResponse({ error: "Account deletion must be confirmed." }, 400);

    const bucket = adminClient.storage.from("avatars");
    let offset = 0;
    const avatarPaths: string[] = [];
    while (true) {
      const { data: files, error: listError } = await bucket.list(user.id, { limit: 1000, offset });
      if (listError) {
        console.error("Failed to list account avatar files:", listError);
        return jsonResponse({ error: "Unable to remove profile photos for this account." }, 500);
      }
      if (files.length === 0) break;
      avatarPaths.push(...files.map((file) => `${user.id}/${file.name}`));
      offset += files.length;
      if (files.length < 1000) break;
    }
    for (let index = 0; index < avatarPaths.length; index += 1000) {
      const { error: removeError } = await bucket.remove(avatarPaths.slice(index, index + 1000));
      if (removeError) {
        console.error("Failed to remove account avatar files:", removeError);
        return jsonResponse({ error: "Unable to remove profile photos for this account." }, 500);
      }
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("Failed to delete account:", deleteError);
      return jsonResponse({ error: "Unable to delete this account." }, 500);
    }
    return jsonResponse({ message: "Account deleted." });
  }

  return jsonResponse({ error: "Unsupported account action." }, 400);
});
