import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProcessReturnRequest {
  request_id: string;
  action: 'approve' | 'reject';
  notes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { request_id, action, notes = '' }: ProcessReturnRequest = await req.json();

    console.log('Processing return request:', { request_id, action });

    // Get return request details
    const { data: returnRequest, error: fetchError } = await supabase
      .from('order_return_requests')
      .select('*, orders(*)')
      .eq('id', request_id)
      .single();

    if (fetchError || !returnRequest) {
      return new Response(JSON.stringify({ error: 'Return request not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let newStatus;
    let resolution = null;
    
    if (action === 'approve') {
      newStatus = 'approved';
      resolution = 'refund_approved';
      
      // Calculate refund amount (for now, full order amount)
      const refundAmount = returnRequest.orders.total_amount_cents;
      
      // Update return request with refund details
      await supabase
        .from('order_return_requests')
        .update({
          status: newStatus,
          resolution,
          refund_amount_cents: refundAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', request_id);

      console.log('Return approved, refund amount:', refundAmount);
      
    } else {
      newStatus = 'rejected';
      resolution = 'rejected';
      
      await supabase
        .from('order_return_requests')
        .update({
          status: newStatus,
          resolution,
          updated_at: new Date().toISOString()
        })
        .eq('id', request_id);
    }

    // Send notification to buyer
    await supabase.functions.invoke('send-notification', {
      body: {
        user_id: returnRequest.buyer_user_id,
        type: 'return_update',
        title: `Return Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        message: action === 'approve' 
          ? 'Your return request has been approved. Refund will be processed shortly.'
          : 'Your return request has been rejected. Please contact support for details.',
        data: {
          return_request_id: request_id,
          order_id: returnRequest.order_id,
          status: newStatus
        }
      }
    });

    console.log('Return request processed successfully');

    return new Response(JSON.stringify({ 
      success: true, 
      status: newStatus,
      message: `Return request ${action}d successfully` 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error processing return request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});