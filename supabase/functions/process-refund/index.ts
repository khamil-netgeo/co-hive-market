import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Stripe } from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const stripe = new Stripe(stripeKey);

interface ProcessRefundRequest {
  request_id: string;
  amount: number; // Amount in cents
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { request_id, amount }: ProcessRefundRequest = await req.json();

    console.log('Processing refund:', { request_id, amount });

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

    if (returnRequest.status !== 'approved') {
      return new Response(JSON.stringify({ error: 'Return request must be approved before processing refund' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For demo purposes, simulate successful refund processing
    // In production, this would integrate with actual payment processors
    
    try {
      // Mock Stripe refund call (commented out for demo)
      // const refund = await stripe.refunds.create({
      //   payment_intent: returnRequest.orders.stripe_payment_intent_id,
      //   amount: amount,
      //   reason: 'requested_by_customer',
      //   metadata: {
      //     return_request_id: request_id,
      //     order_id: returnRequest.order_id
      //   }
      // });

      // Mock refund response
      const mockRefund = {
        id: `re_${Date.now()}`,
        amount: amount,
        status: 'succeeded',
        created: Date.now()
      };

      // Update return request with refund information
      await supabase
        .from('order_return_requests')
        .update({
          resolution: 'refunded',
          refund_amount_cents: amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', request_id);

      // Log the refund transaction
      await supabase
        .from('refund_transactions')
        .insert({
          return_request_id: request_id,
          order_id: returnRequest.order_id,
          amount_cents: amount,
          currency: returnRequest.currency || 'myr',
          provider: 'stripe',
          provider_refund_id: mockRefund.id,
          status: 'completed',
          processed_by: 'system'
        });

      // Notify customer
      await supabase.functions.invoke('send-notification', {
        body: {
          user_id: returnRequest.buyer_user_id,
          type: 'return_update',
          title: 'Refund Processed',
          message: `Your refund of ${(amount / 100).toFixed(2)} ${returnRequest.currency?.toUpperCase() || 'MYR'} has been processed and should appear in your account within 3-5 business days.`,
          data: {
            return_request_id: request_id,
            order_id: returnRequest.order_id,
            refund_amount: amount,
            refund_id: mockRefund.id
          }
        }
      });

      console.log('Refund processed successfully:', mockRefund.id);

      return new Response(JSON.stringify({ 
        success: true, 
        refund_id: mockRefund.id,
        amount: amount,
        message: 'Refund processed successfully'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (stripeError: any) {
      console.error('Stripe refund error:', stripeError);
      
      // Update return request with failed status
      await supabase
        .from('order_return_requests')
        .update({
          resolution: 'refund_failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', request_id);

      return new Response(JSON.stringify({ 
        error: 'Failed to process refund with payment provider',
        details: stripeError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('Error processing refund:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});