import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderRequest {
  delivery_address?: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    lat?: number;
    lng?: number;
  };
  notes?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Parse request body
    const body: CreateOrderRequest = await req.json();

    // Create service role client for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Call the database function to create order from cart
    const { data: orderId, error: orderError } = await supabaseService.rpc(
      'create_order_from_cart',
      {
        p_user_id: user.id,
        p_delivery_address: body.delivery_address ? JSON.stringify(body.delivery_address) : null,
        p_notes: body.notes || null,
      }
    );

    if (orderError) {
      console.error("Order creation error:", orderError);
      return new Response(
        JSON.stringify({ 
          error: "Order creation failed",
          details: orderError.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get the created order details
    const { data: order, error: fetchError } = await supabaseService
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_id,
          quantity,
          unit_price_cents,
          products (
            name,
            image_urls
          )
        ),
        vendors (
          name,
          user_id
        )
      `)
      .eq('id', orderId)
      .single();

    if (fetchError) {
      console.error("Order fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve order details" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Log successful order creation
    console.log(`Order created successfully: ${orderId} for user: ${user.id}`);

    return new Response(
      JSON.stringify({ 
        order_id: orderId,
        order: order,
        message: "Order created successfully" 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Order creation error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});