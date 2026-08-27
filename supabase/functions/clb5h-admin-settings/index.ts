import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const legacyAdminCode = Deno.env.get("CLB5H_ADMIN_CODE") || "111";
const table = "clb5h_admin_settings";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
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

async function getCurrentCodeHash() {
  const rows = await databaseRequest(`${table}?id=eq.primary&select=code_hash&limit=1`);
  const first = Array.isArray(rows) ? rows[0] as { code_hash?: string } | undefined : undefined;
  return first?.code_hash || await sha256Hex(legacyAdminCode);
}

async function validCode(candidate: unknown) {
  const suppliedHash = await sha256Hex(String(candidate || ""));
  const currentHash = await getCurrentCodeHash();
  return suppliedHash === currentHash;
}

function validNewCode(value: unknown) {
  const code = String(value || "");
  return code.length >= 3 && code.length <= 128 && !/[\r\n]/.test(code);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method-not-allowed" }, 405);

  try {
    const body = await request.json();
    const currentCode = String(body.currentCode || "");
    const newCode = String(body.newCode || "");
    const confirmCode = String(body.confirmCode || "");

    if (!(await validCode(currentCode))) return json({ error: "invalid-admin-code" }, 401);
    if (body.verifyOnly === true) return json({ valid: true });
    if (!validNewCode(newCode)) return json({ error: "invalid-new-code" }, 400);
    if (newCode !== confirmCode) return json({ error: "new-code-mismatch" }, 400);
    if (newCode === currentCode) return json({ error: "new-code-must-differ" }, 400);

    await databaseRequest(`${table}?id=eq.primary`, {
      method: "PATCH",
      body: JSON.stringify({ code_hash: await sha256Hex(newCode), updated_at: new Date().toISOString() }),
    });
    return json({ ok: true, message: "admin-code-updated" });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "unexpected-error" }, 500);
  }
});
