import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const legacyAdminCode = Deno.env.get("CLB5H_ADMIN_CODE") || "111";
const adminSettingsTable = "clb5h_admin_settings";
const table = "clb5h_diary_entries";

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function getCurrentAdminCodeHash() {
  const response = await fetch(`${supabaseUrl}/rest/v1/${adminSettingsTable}?id=eq.primary&select=code_hash&limit=1`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  });
  if (!response.ok) throw new Error("admin-settings-read-failed");
  const rows = await response.json();
  return rows?.[0]?.code_hash || await sha256Hex(legacyAdminCode);
}

async function validAdminCode(candidate: unknown) {
  return (await sha256Hex(String(candidate || ""))) === await getCurrentAdminCodeHash();
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function databaseRequest(path: string, init: RequestInit = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }
  if (!response.ok) throw new Error((data as { message?: string })?.message || "database-request-failed");
  return data;
}

function cleanItem(item: Record<string, unknown>) {
  return {
    diary_date: String(item.date || "").slice(0, 10),
    image_path: String(item.imageUrl || ""),
    public_id: String(item.publicId || "").slice(0, 255) || null,
    caption: String(item.caption || "").slice(0, 1000) || null,
    author: String(item.author || "Ban Quản trị CLB 5H Sáng").slice(0, 100),
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method-not-allowed" }, 405);

  try {
    const body = await request.json();
    if (!(await validAdminCode(body.code))) return json({ error: "invalid-admin-code" }, 401);

    const action = String(body.action || "");
    const item = (body.item || {}) as Record<string, unknown>;
    if (action === "create") {
      return json(await databaseRequest(table, { method: "POST", body: JSON.stringify(cleanItem(item)) }));
    }
    if (action === "update") {
      const id = encodeURIComponent(String(item.id || ""));
      if (!id) return json({ error: "missing-id" }, 400);
      return json(await databaseRequest(`${table}?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(cleanItem(item)) }));
    }
    if (action === "delete") {
      const id = encodeURIComponent(String(item.id || ""));
      if (!id) return json({ error: "missing-id" }, 400);
      return json(await databaseRequest(`${table}?id=eq.${id}`, { method: "DELETE" }));
    }
    return json({ error: "unknown-action" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "unexpected-error" }, 500);
  }
});
