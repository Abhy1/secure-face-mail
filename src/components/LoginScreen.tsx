import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onSignupRedirect: () => void;
}

export const LoginScreen = ({ onLoginSuccess, onSignupRedirect }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Welcome Back!",
        description: "You have successfully logged in."
      });
      onLoginSuccess();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-foreground mb-6 text-center">Welcome Back</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-muted-foreground">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-2"
              placeholder="Enter your email"
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
              placeholder="Enter your password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <button 
              onClick={onSignupRedirect}
              className="text-primary hover:underline font-medium"
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};