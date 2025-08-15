import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  email: string;
  otp: string;
  fullName?: string;
  password?: string;
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
    const { email, otp, fullName, password, type }: VerifyOTPRequest = await req.json();

    // Verify OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('email_otps')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (otpError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired OTP' }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mark OTP as verified
    await supabase
      .from('email_otps')
      .update({ verified: true })
      .eq('id', otpRecord.id);

    if (type === 'signup' && password && fullName) {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Skip email confirmation since we verified OTP
        user_metadata: {
          full_name: fullName
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        return new Response(
          JSON.stringify({ error: authError.message }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Account created successfully",
        user: authData.user
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } else if (type === 'login') {
      // For login, just verify the OTP was correct
      return new Response(JSON.stringify({ 
        success: true, 
        message: "OTP verified successfully"
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request type' }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
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