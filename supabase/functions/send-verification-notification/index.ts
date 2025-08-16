import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationNotificationRequest {
  senderId: string;
  receiverEmail: string;
  attachmentName: string;
  emailId: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { senderId, receiverEmail, attachmentName, emailId }: VerificationNotificationRequest = await req.json();

    // Get sender's email
    const { data: senderProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', senderId)
      .single();

    if (profileError || !senderProfile) {
      throw new Error('Failed to fetch sender profile');
    }

    // Send notification email to sender
    const emailResponse = await resend.emails.send({
      from: "SecureMail <onboarding@resend.dev>",
      to: [senderProfile.email],
      subject: "Verification Request - Attachment Access",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🔐 Attachment Access Verification</h2>
          <p>Someone is trying to access an attachment you sent:</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Receiver:</strong> ${receiverEmail}<br>
            <strong>Attachment:</strong> ${attachmentName}
          </div>
          
          <p>The receiver has provided their photo for verification. Please log in to your SecureMail account to approve or deny this request.</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${Deno.env.get('SITE_URL') || 'https://kusduxuxxaqtddhjnclj.supabase.co'}" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review Verification Request
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This request will expire in 10 minutes for security purposes.
          </p>
        </div>
      `,
    });

    console.log('Verification notification sent:', emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error sending verification notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);