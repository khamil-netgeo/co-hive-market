import { supabase } from "@/integrations/supabase/client";

// Lightweight helper to write audit logs without breaking UI flows
// - Never throws; swallows errors so admin actions don't fail due to logging issues
// - Usage: await logAudit('action.key', 'entity_type', 'entity_id', { any: 'metadata' })
export async function logAudit(
  action: string,
  entity_type?: string | null,
  entity_id?: string | null,
  metadata?: Record<string, any>
) {
  try {
    // Ensure user is authenticated; edge function requires admin/superadmin
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return;

    await supabase.functions.invoke("log-audit", {
      body: {
        action,
        entity_type: entity_type ?? null,
        entity_id: entity_id ?? null,
        metadata: metadata ?? {},
      },
    });
  } catch (e) {
    // noop
    console.warn("audit log failed", e);
  }
}
