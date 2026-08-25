import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminCode = Deno.env.get("CLB5H_ADMIN_CODE") || "111";
const table = "clb5h_content_items";

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
  const type = ["text", "faq", "list", "notice"].includes(String(item.itemType)) ? String(item.itemType) : "text";
  return {
    id: String(item.id || "").slice(0, 120),
    section_id: String(item.sectionId || "").slice(0, 120),
    item_type: type,
    title: String(item.title || "").slice(0, 500),
    body: String(item.body || "").slice(0, 10000),
    display_order: Math.max(0, Math.min(99999, Number(item.displayOrder) || 0)),
    is_active: item.isActive !== false,
    metadata: item.metadata && typeof item.metadata === "object" ? item.metadata : {},
  };
}

function encodedId(item: Record<string, unknown>) {
  return encodeURIComponent(String(item.id || ""));
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "method-not-allowed" }, 405);

  try {
    const body = await request.json();
    if (String(body.code || "") !== adminCode) return json({ error: "invalid-admin-code" }, 401);
    const action = String(body.action || "");
    const item = (body.item || {}) as Record<string, unknown>;

    if (action === "create") {
      const clean = cleanItem(item);
      if (!clean.id || !clean.section_id || !clean.title || !clean.body) return json({ error: "invalid-content-item" }, 400);
      return json(await databaseRequest(table, { method: "POST", body: JSON.stringify(clean) }));
    }
    if (action === "update") {
      const id = encodedId(item);
      const clean = cleanItem(item);
      if (!id || !clean.section_id || !clean.title || !clean.body) return json({ error: "invalid-content-item" }, 400);
      return json(await databaseRequest(`${table}?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(clean) }));
    }
    if (action === "delete") {
      const id = encodedId(item);
      if (!id) return json({ error: "missing-id" }, 400);
      return json(await databaseRequest(`${table}?id=eq.${id}`, { method: "DELETE" }));
    }
    return json({ error: "unknown-action" }, 400);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "unexpected-error" }, 500);
  }
});
