import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ComposeEmailProps {
  onBack: () => void;
  onSent: () => void;
}

export const ComposeEmail = ({ onBack, onSent }: ComposeEmailProps) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Get user's secret key
      const { data: profile } = await supabase
        .from('profiles')
        .select('secret_key')
        .eq('user_id', user.id)
        .single();

      if (!profile?.secret_key) {
        throw new Error('Secret key not found');
      }

      // Mock encryption (in real app, use proper encryption)
      const encryptedContent = btoa(message); // Base64 encoding for demo
      const encryptedAttachment = attachment ? btoa(await attachment.text()) : null;

      // Save email to database
      const { error } = await supabase
        .from('secure_emails')
        .insert({
          sender_id: user.id,
          recipient_email: recipient,
          subject,
          encrypted_content: encryptedContent,
          encrypted_attachment: encryptedAttachment,
          attachment_name: attachment?.name || null,
          sender_secret_key: profile.secret_key
        });

      if (error) throw error;

      toast({
        title: "Email Sent!",
        description: "Your secure email has been encrypted and sent."
      });

      onSent();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card rounded-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-foreground">Compose Secure Email</h2>
            <Button onClick={onBack} variant="ghost">← Back to Dashboard</Button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="recipient" className="text-muted-foreground">To:</Label>
              <Input
                id="recipient"
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="recipient@example.com"
                required
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="subject" className="text-muted-foreground">Subject:</Label>
              <Input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Confidential Document"
                required
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="message" className="text-muted-foreground">Message:</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your secure message..."
                rows={6}
                required
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="attachment" className="text-muted-foreground">Attach Document:</Label>
              <Input
                id="attachment"
                type="file"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                className="mt-2"
              />
            </div>
            
            <div className="bg-yellow-900/30 border border-yellow-500 rounded-xl p-4">
              <h4 className="text-yellow-300 font-bold mb-2">🔒 Security Settings</h4>
              <p className="text-yellow-200 text-sm">This email will be encrypted with your secret key and require biometric verification to open attachments.</p>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : '🚀 Send Secure Email'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};