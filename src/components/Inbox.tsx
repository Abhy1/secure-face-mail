import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface InboxProps {
  onBack: () => void;
  onDecrypt: (emailId: string) => void;
}

interface SecureEmail {
  id: string;
  subject: string;
  sender_id: string;
  encrypted_content: string;
  attachment_name: string | null;
  created_at: string;
  is_destroyed: boolean;
}

export const Inbox = ({ onBack, onDecrypt }: InboxProps) => {
  const [emails, setEmails] = useState<SecureEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchEmails();
    }
  }, [user]);

  const fetchEmails = async () => {
    if (!user) return;

    // For demo purposes, fetch all emails (in real app, filter by recipient)
    const { data, error } = await supabase
      .from('secure_emails')
      .select('*')
      .eq('is_destroyed', false)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setEmails(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground">Loading inbox...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card rounded-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-foreground">Secure Inbox</h2>
            <Button onClick={onBack} variant="ghost">← Back to Dashboard</Button>
          </div>
          
          <div className="space-y-4">
            {emails.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No secure emails found</p>
              </div>
            ) : (
              emails.map((email) => (
                <div key={email.id} className="glass-card rounded-xl p-4 border-l-4 border-destructive">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-foreground font-bold">🔒 Encrypted: {email.subject}</h4>
                      <p className="text-muted-foreground text-sm">From: {email.sender_id}</p>
                      <p className="text-primary text-sm mt-1">
                        Requires secret key and biometric verification
                        {email.attachment_name && ' • Has attachment'}
                      </p>
                    </div>
                    <Button 
                      onClick={() => onDecrypt(email.id)}
                      className="ml-4"
                      size="sm"
                    >
                      Open
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};