import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  onLogin: () => void;
  onSignup: () => void;
}

export const WelcomeScreen = ({ onLogin, onSignup }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-6">🔐</div>
        <h1 className="text-4xl font-bold text-foreground mb-4">SecureMail Pro</h1>
        <p className="text-muted-foreground mb-8">Enhanced Email Encryption with Biometric Security</p>
        
        <div className="space-y-4">
          <Button onClick={onLogin} className="w-full" size="lg" variant="default">
            Sign In
          </Button>
          <Button onClick={onSignup} className="w-full" size="lg" variant="outline">
            Create Account
          </Button>
        </div>
      </div>
    </div>
  );
};