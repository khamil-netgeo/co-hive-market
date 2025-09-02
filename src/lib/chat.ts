// Chat helpers: ensure we have a thread between a buyer and a vendor
// Keeps logic in one place and respects RLS policies.
import { supabase } from "@/integrations/supabase/client";

// Ensure a thread exists for the CURRENT user (buyer) and a vendor
export async function ensureThreadWithVendor(vendorId: string): Promise<string | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return null;

    // Try to insert a new thread, but if it already exists due to unique constraint, just fetch it
    const { data: inserted, error: insErr } = await supabase
      .from("chat_threads")
      .insert({ buyer_user_id: userId, vendor_id: vendorId, subject: null })
      .select("id")
      .single();
    
    if (!insErr && inserted?.id) {
      return inserted.id;
    }

    // If insert failed due to unique constraint violation, fetch the existing thread
    if (insErr && insErr.code === '23505') {
      const { data: existing, error: selErr } = await supabase
        .from("chat_threads")
        .select("id")
        .eq("buyer_user_id", userId)
        .eq("vendor_id", vendorId)
        .single();
      if (selErr) throw selErr;
      return existing?.id || null;
    }

    // For other errors, throw them
    if (insErr) throw insErr;
    return null;
  } catch (e) {
    console.error("ensureThreadWithVendor error", e);
    return null;
  }
}

// Ensure a thread exists between a specific buyer and vendor (for vendor-initiated chats)
export async function ensureThreadBetween(buyerUserId: string, vendorId: string): Promise<string | null> {
  try {
    // Try to insert a new thread, but if it already exists due to unique constraint, just fetch it
    const { data: inserted, error: insErr } = await supabase
      .from("chat_threads")
      .insert({ buyer_user_id: buyerUserId, vendor_id: vendorId, subject: null })
      .select("id")
      .single();
    
    if (!insErr && inserted?.id) {
      return inserted.id;
    }

    // If insert failed due to unique constraint violation, fetch the existing thread
    if (insErr && insErr.code === '23505') {
      const { data: existing, error: selErr } = await supabase
        .from("chat_threads")
        .select("id")
        .eq("buyer_user_id", buyerUserId)
        .eq("vendor_id", vendorId)
        .single();
      if (selErr) throw selErr;
      return existing?.id || null;
    }

    // For other errors, throw them
    if (insErr) throw insErr;
    return null;
  } catch (e) {
    console.error("ensureThreadBetween error", e);
    return null;
  }
}
