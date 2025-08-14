import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SignupScreenProps {
  onSignupComplete: () => void;
}

export const SignupScreen = ({ onSignupComplete }: SignupScreenProps) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account."
      });
      onSignupComplete();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-foreground mb-6 text-center">Create Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fullName" className="text-muted-foreground">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="password" className="text-muted-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-2"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </div>
    </div>
  );
};