import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Payload = {
  action: "find_user" | "assign_role" | "remove_role";
  email?: string;
  user_id?: string;
  role?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const anon = createClient(supabaseUrl, anonKey);
    const service = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");

    const { data: userData, error: userErr } = await anon.auth.getUser(token);
    if (userErr) throw userErr;
    const caller = userData.user;
    if (!caller) throw new Error("Unauthorized");

    // Ensure caller is superadmin
    const { data: roleCheck, error: rcErr } = await service
      .from("user_roles").select("id").eq("user_id", caller.id).eq("role", "superadmin").maybeSingle();
    if (rcErr) throw rcErr;
    if (!roleCheck) return new Response(JSON.stringify({ error: "Forbidden" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 });

    const payload = (await req.json()) as Payload;

    if (payload.action === "find_user") {
      if (!payload.email) throw new Error("email required");
      const { data: found, error } = await service.auth.admin.getUserByEmail(payload.email);
      if (error) throw error;
      const user = found?.user ? { id: found.user.id, email: found.user.email! } : null;
      return new Response(JSON.stringify({ user }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (payload.action === "assign_role") {
      if (!payload.user_id || !payload.role) throw new Error("user_id and role required");
      const { error } = await service.from("user_roles").upsert({ user_id: payload.user_id, role: payload.role }, { onConflict: "user_id,role" });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (payload.action === "remove_role") {
      if (!payload.user_id || !payload.role) throw new Error("user_id and role required");
      const { error } = await service.from("user_roles").delete().eq("user_id", payload.user_id).eq("role", payload.role);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("admin-users error:", message);
    return new Response(JSON.stringify({ error: message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: message === "Unauthorized" ? 401 : 500 });
  }
});
