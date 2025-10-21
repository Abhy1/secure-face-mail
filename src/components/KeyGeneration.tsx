import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { generateSecretKey } from '@/lib/encryption';

interface KeyGenerationProps {
  onComplete: (secretKey: string) => void;
}

export const KeyGeneration = ({ onComplete }: KeyGenerationProps) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [secretKey, setSecretKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const generateKey = () => {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 10;
          
          if (newProgress === 30) {
            setStatus('Generating cryptographic keys...');
          } else if (newProgress === 60) {
            setStatus('Applying security protocols...');
          } else if (newProgress === 90) {
            setStatus('Finalizing encryption...');
          } else if (newProgress === 100) {
            setStatus('Key generation complete!');
            
            const generatedKey = generateSecretKey();
            setSecretKey(generatedKey);
            
            // Save key to database
            saveKeyToDatabase(generatedKey);
            
            setTimeout(() => {
              setShowKey(true);
            }, 500);
            
            clearInterval(interval);
          }
          
          return newProgress;
        });
      }, 200);
    };

    generateKey();
  }, [user]);

  const saveKeyToDatabase = async (key: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ secret_key: key })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save secret key",
        variant: "destructive"
      });
    }
  };

  const handleContinue = () => {
    onComplete(secretKey);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-6">🔑</div>
        <h2 className="text-3xl font-bold text-foreground mb-4">Generating Your Secret Key</h2>
        <p className="text-muted-foreground mb-6">Creating your unique encryption key...</p>
        
        <div className="bg-background/30 rounded-xl p-4 mb-6">
          <div 
            className="h-2 bg-accent rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
          <p className="text-accent-foreground mt-2">{status}</p>
        </div>
        
        {showKey && (
          <div className="bg-background/50 rounded-xl p-4 mb-6">
            <p className="text-muted-foreground mb-2">Your Secret Key:</p>
            <p className="font-mono text-accent text-sm break-all">{secretKey}</p>
            <p className="text-yellow-300 text-xs mt-2">⚠️ Save this key securely - you'll need it for decryption</p>
          </div>
        )}
        
        {showKey && (
          <Button onClick={handleContinue} className="w-full">
            Continue to Biometric Setup
          </Button>
        )}
      </div>
    </div>
  );
};