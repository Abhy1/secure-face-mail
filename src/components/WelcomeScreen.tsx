import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen = ({ onGetStarted }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-6">🔐</div>
        <h1 className="text-4xl font-bold text-foreground mb-4">SecureMail Pro</h1>
        <p className="text-muted-foreground mb-8">Enhanced Email Encryption with Biometric Security</p>
        <Button onClick={onGetStarted} className="w-full" size="lg">
          Get Started
        </Button>
      </div>
    </div>
  );
};