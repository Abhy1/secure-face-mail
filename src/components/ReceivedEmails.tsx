import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ReceivedEmailsProps {
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
  profiles: {
    email: string;
    full_name: string;
  };
}

export const ReceivedEmails = ({ onBack, onDecrypt }: ReceivedEmailsProps) => {
  const [emails, setEmails] = useState<SecureEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchReceivedEmails();
    }
  }, [user]);

  const fetchReceivedEmails = async () => {
    if (!user) return;

    // Get current user's profile to get their email
    const { data: profileData } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .single();

    if (!profileData) {
      setLoading(false);
      return;
    }

    // Fetch emails sent to this user's email
    const { data, error } = await supabase
      .from('secure_emails')
      .select('*')
      .eq('recipient_email', profileData.email)
      .eq('is_destroyed', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching emails:', error);
      toast({
        title: "Error",
        description: "Failed to fetch received emails",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Fetch sender profiles for each email
    const emailsWithProfiles = await Promise.all(
      (data || []).map(async (email) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('user_id', email.sender_id)
          .single();

        return {
          ...email,
          profiles: profile || { email: 'Unknown', full_name: 'Unknown' }
        };
      })
    );

    setEmails(emailsWithProfiles as SecureEmail[]);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground">Loading received emails...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card rounded-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-foreground">📥 Received Emails</h2>
            <Button onClick={onBack} variant="outline">
              Back to Dashboard
            </Button>
          </div>

          {emails.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-muted-foreground">No received emails yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {emails.map((email) => (
                <div key={email.id} className="glass-card rounded-xl p-6 hover:bg-accent/10 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {email.subject}
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        From: {email.profiles.full_name} ({email.profiles.email})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Received: {new Date(email.created_at).toLocaleString()}
                      </p>
                      {email.attachment_name && (
                        <p className="text-sm text-accent mt-2">
                          📎 Attachment: {email.attachment_name}
                        </p>
                      )}
                    </div>
                    <Button 
                      onClick={() => onDecrypt(email.id)}
                      variant="default"
                    >
                      Open & Decrypt
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
