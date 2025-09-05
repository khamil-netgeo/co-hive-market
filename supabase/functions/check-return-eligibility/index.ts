import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CheckReturnEligibilityRequest {
  order_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { order_id }: CheckReturnEligibilityRequest = await req.json();

    console.log('Checking return eligibility for order:', order_id);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, vendors(*)')
      .eq('id', order_id)
      .eq('buyer_user_id', user.id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ 
        eligible: false, 
        reason: 'Order not found or not owned by user' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return new Response(JSON.stringify({ 
        eligible: false, 
        reason: 'Order must be delivered to be eligible for return' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if return period has expired (default 14 days)
    const deliveredDate = new Date(order.updated_at);
    const now = new Date();
    const daysSinceDelivery = Math.floor((now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get vendor return rules
    const { data: returnRules } = await supabase
      .from('return_rules')
      .select('*')
      .eq('vendor_id', order.vendor_id)
      .eq('is_active', true);

    let returnWindow = 14; // Default 14 days
    const timeRule = returnRules?.find(rule => rule.rule_type === 'time_limit');
    if (timeRule) {
      returnWindow = timeRule.parameters?.days || 14;
    }

    if (daysSinceDelivery > returnWindow) {
      return new Response(JSON.stringify({ 
        eligible: false, 
        reason: `Return period has expired. Returns must be requested within ${returnWindow} days of delivery.` 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if return request already exists
    const { data: existingReturn } = await supabase
      .from('order_return_requests')
      .select('*')
      .eq('order_id', order_id)
      .eq('buyer_user_id', user.id)
      .single();

    if (existingReturn) {
      return new Response(JSON.stringify({ 
        eligible: false, 
        reason: 'Return request already exists for this order',
        existing_status: existingReturn.status
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Order is eligible for return
    return new Response(JSON.stringify({ 
      eligible: true, 
      return_window_days: returnWindow,
      days_remaining: returnWindow - daysSinceDelivery
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error checking return eligibility:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});