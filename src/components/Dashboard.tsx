import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface DashboardProps {
  onCompose: () => void;
  onInbox: () => void;
  onVerifications?: () => void;
  onReceivedEmails?: () => void;
}

export const Dashboard = ({ onCompose, onInbox, onVerifications, onReceivedEmails }: DashboardProps) => {
  const [secretKey, setSecretKey] = useState('Loading...');
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('secret_key')
      .eq('user_id', user.id)
      .single();

    if (data && !error) {
      setSecretKey(data.secret_key || 'Not generated');
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="glass-card rounded-3xl p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-foreground">SecureMail Dashboard</h1>
            <div className="flex flex-wrap gap-3">
              <Button onClick={onCompose} className="flex items-center gap-2">
                📧 Compose Email
              </Button>
              <Button onClick={onInbox} variant="secondary" className="flex items-center gap-2">
                📤 Sent Emails
              </Button>
              {onReceivedEmails && (
                <Button onClick={onReceivedEmails} variant="secondary" className="flex items-center gap-2">
                  📥 Received Emails
                </Button>
              )}
              {onVerifications && (
                <Button onClick={onVerifications} variant="outline" className="flex items-center gap-2">
                  🔐 Verifications
                </Button>
              )}
              <Button onClick={signOut} variant="outline" size="sm">
                Sign Out
              </Button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">🔐</div>
              <h3 className="text-foreground font-bold mb-2">Your Secret Key</h3>
              <p className="text-muted-foreground text-sm font-mono break-all">{secretKey}</p>
            </div>
            
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">👤</div>
              <h3 className="text-foreground font-bold mb-2">Biometric Status</h3>
              <p className="text-accent">✅ Face ID Registered</p>
            </div>
            
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="text-foreground font-bold mb-2">Security Level</h3>
              <p className="text-accent">🛡️ Maximum</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};