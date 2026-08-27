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
const table = "clb5h_bqt_admins";

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

function cleanAdmin(item: Record<string, unknown>) {
  const style = item.buttonStyle === "success" ? "success" : item.buttonStyle === "secondary" ? "secondary" : "primary";
  return {
    id: String(item.id || "").slice(0, 96),
    role_title: String(item.roleTitle || "").slice(0, 160),
    member_name: String(item.memberName || "").slice(0, 160),
    description: String(item.description || "").slice(0, 1000),
    contact_url: String(item.contactUrl || "").slice(0, 500),
    contact_label: String(item.contactLabel || "").slice(0, 120),
    button_style: style,
    display_order: Math.max(0, Math.min(9999, Number(item.displayOrder) || 0)),
    is_active: item.isActive !== false,
  };
}

function adminId(item: Record<string, unknown>) {
  return encodeURIComponent(String(item.id || ""));
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
      const clean = cleanAdmin(item);
      if (!clean.id || !clean.role_title || !clean.member_name) return json({ error: "invalid-admin" }, 400);
      return json(await databaseRequest(table, { method: "POST", body: JSON.stringify(clean) }));
    }
    if (action === "update") {
      const id = adminId(item);
      const clean = cleanAdmin(item);
      if (!id || !clean.role_title || !clean.member_name) return json({ error: "invalid-admin" }, 400);
      return json(await databaseRequest(`${table}?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(clean) }));
    }
    if (action === "delete") {
      const id = adminId(item);
      if (!id) return json({ error: "missing-id" }, 400);
      return json(await databaseRequest(`${table}?id=eq.${id}`, { method: "DELETE" }));
    }
    return json({ error: "unknown-action" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "unexpected-error" }, 500);
  }
});
