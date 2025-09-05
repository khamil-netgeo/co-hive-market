import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SubmitReturnRequest {
  order_id: string;
  reason: string;
  description?: string;
  photos?: string[];
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

    // Get user from auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { order_id, reason, description = '', photos = [] }: SubmitReturnRequest = await req.json();

    console.log('Submitting return request:', { order_id, reason, user_id: user.id });

    // Validate order exists and belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, vendors(*)')
      .eq('id', order_id)
      .eq('buyer_user_id', user.id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found or not owned by user' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if order is eligible for return (e.g., delivered, within return window)
    if (order.status !== 'delivered') {
      return new Response(JSON.stringify({ error: 'Order must be delivered to request return' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create return request
    const { data: returnRequest, error: insertError } = await supabase
      .from('order_return_requests')
      .insert({
        order_id,
        buyer_user_id: user.id,
        vendor_id: order.vendor_id,
        reason,
        status: 'requested',
        currency: order.currency || 'myr'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating return request:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create return request' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Store photos if provided
    if (photos.length > 0) {
      const photoInserts = photos.map(photo => ({
        return_request_id: returnRequest.id,
        photo_url: photo,
        uploaded_by: user.id
      }));

      await supabase
        .from('return_photos')
        .insert(photoInserts);
    }

    // Notify vendor
    await supabase.functions.invoke('send-notification', {
      body: {
        user_id: order.vendors.user_id,
        type: 'return_update',
        title: 'New Return Request',
        message: `A customer has requested a return for order ${order_id}`,
        data: {
          return_request_id: returnRequest.id,
          order_id,
          reason
        }
      }
    });

    console.log('Return request created successfully:', returnRequest.id);

    return new Response(JSON.stringify({ 
      success: true, 
      return_request_id: returnRequest.id,
      message: 'Return request submitted successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error submitting return request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});