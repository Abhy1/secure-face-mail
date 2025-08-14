import { Button } from "@/components/ui/button";

interface SuccessScreenProps {
  onReturn: () => void;
}

export const SuccessScreen = ({ onReturn }: SuccessScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-3xl font-bold text-foreground mb-4">Email Sent Successfully!</h2>
        <p className="text-muted-foreground mb-6">
          Your secure email has been encrypted and sent. The recipient will need your secret key and biometric verification to access attachments.
        </p>
        <Button onClick={onReturn} className="w-full">
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};