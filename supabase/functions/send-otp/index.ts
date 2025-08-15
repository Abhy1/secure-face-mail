import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
  type: 'signup' | 'login';
}

// Initialize Supabase client for database operations
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type }: SendOTPRequest = await req.json();

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database with expiration (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    // Create or update OTP record
    const { error: dbError } = await supabase
      .from('email_otps')
      .upsert({
        email,
        otp,
        expires_at: expiresAt,
        verified: false,
        type
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store OTP');
    }

    // Send OTP email
    const emailResponse = await resend.emails.send({
      from: "SecureMail Pro <onboarding@resend.dev>",
      to: [email],
      subject: `Your verification code: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">🔐 SecureMail Pro</h1>
          <h2 style="color: #555; text-align: center;">Verification Code</h2>
          <p style="font-size: 16px; color: #666;">
            Your verification code for ${type === 'signup' ? 'account creation' : 'login'} is:
          </p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="font-size: 36px; color: #333; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p style="font-size: 14px; color: #888;">
            This code will expire in 5 minutes. If you didn't request this code, please ignore this email.
          </p>
          <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 30px;">
            SecureMail Pro - Enhanced Email Encryption with Biometric Security
          </p>
        </div>
      `,
    });

    console.log("OTP email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, message: "OTP sent successfully" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);