import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

interface NotificationRequest {
  user_id: string;
  type: 'order_update' | 'payment_confirmation' | 'delivery_assigned' | 'return_update';
  title: string;
  message: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, type, title, message, data = {} }: NotificationRequest = await req.json();

    console.log('Processing notification:', { user_id, type, title });

    // Get user notification preferences
    const { data: channels } = await supabase
      .from('notification_channels')
      .select('*')
      .eq('user_id', user_id);

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user_id)
      .single();

    if (!profile?.email) {
      console.log('No email found for user:', user_id);
      return new Response(JSON.stringify({ error: 'User email not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const emailChannel = channels?.find(c => c.channel_type === 'email' && c.is_enabled);
    
    if (emailChannel) {
      console.log('Sending email notification to:', profile.email);
      
      await resend.emails.send({
        from: 'notifications@coopmart.local',
        to: [profile.email],
        subject: title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${title}</h2>
            <p style="color: #666; font-size: 16px;">${message}</p>
            ${data.order_id ? `<p style="color: #999; font-size: 14px;">Order ID: ${data.order_id}</p>` : ''}
            <hr style="margin: 20px 0; border: 1px solid #eee;">
            <p style="color: #999; font-size: 12px;">This is an automated notification from CoopMart.</p>
          </div>
        `
      });
    }

    // Create in-app notification
    await supabase.from('notifications').insert({
      user_id,
      type,
      title,
      message,
      data,
      status: 'sent'
    });

    console.log('Notification sent successfully');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error sending notification:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});