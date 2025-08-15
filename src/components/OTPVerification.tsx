import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OTPVerificationProps {
  email: string;
  fullName: string;
  password: string;
  onVerificationSuccess: () => void;
  onBack: () => void;
}

export const OTPVerification = ({ email, fullName, password, onVerificationSuccess, onBack }: OTPVerificationProps) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { toast } = useToast();

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          email,
          otp,
          fullName,
          password,
          type: 'signup'
        }
      });

      if (error) {
        toast({
          title: "Verification Failed",
          description: error.message,
          variant: "destructive"
        });
      } else if (data?.error) {
        toast({
          title: "Verification Failed",
          description: data.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Account Created!",
          description: "Your account has been created successfully."
        });
        onVerificationSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to verify OTP. Please try again.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  const handleResendOTP = async () => {
    setResending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: {
          email,
          type: 'signup'
        }
      });

      if (error) {
        toast({
          title: "Failed to Resend",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "OTP Sent",
          description: "A new verification code has been sent to your email."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to resend OTP. Please try again.",
        variant: "destructive"
      });
    }

    setResending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Verify Your Email</h2>
          <p className="text-muted-foreground text-sm">
            We've sent a 6-digit verification code to
          </p>
          <p className="text-foreground font-medium">{email}</p>
        </div>

        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <Label htmlFor="otp" className="text-muted-foreground">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              className="mt-2 text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button 
            onClick={handleResendOTP}
            disabled={resending}
            className="text-primary hover:underline text-sm"
          >
            {resending ? 'Sending...' : "Didn't receive the code? Resend"}
          </button>
          
          <div>
            <button 
              onClick={onBack}
              className="text-muted-foreground hover:underline text-sm"
            >
              ← Back to signup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};