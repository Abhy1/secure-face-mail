import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { AttachmentVerification } from './AttachmentVerification';
import { decryptData } from '@/lib/encryption';

interface EmailDecryptionProps {
  emailId: string;
  onBack: () => void;
}

interface SecureEmail {
  id: string;
  subject: string;
  sender_id: string;
  encrypted_content: string;
  encrypted_attachment: string | null;
  attachment_name: string | null;
  sender_secret_key: string;
}

export const EmailDecryption = ({ emailId, onBack }: EmailDecryptionProps) => {
  const [email, setEmail] = useState<SecureEmail | null>(null);
  const [decryptionKey, setDecryptionKey] = useState('');
  const [keyVerified, setKeyVerified] = useState(false);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [securityAlert, setSecurityAlert] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('Ready for verification');
  const [showAttachmentVerification, setShowAttachmentVerification] = useState(false);
  const [attachmentApproved, setAttachmentApproved] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchEmail();
  }, [emailId]);

  const fetchEmail = async () => {
    const { data, error } = await supabase
      .from('secure_emails')
      .select('*')
      .eq('id', emailId)
      .single();

    if (data && !error) {
      setEmail(data);
    }
  };

  const verifyKey = async () => {
    if (!email || !user) return;

    try {
      // Try to decrypt content with the provided key
      const content = decryptData(email.encrypted_content, decryptionKey);
      
      // If decryption succeeds, key is valid
      setDecryptedContent(content);
      setKeyVerified(true);
      setVerificationStatus('Key verified! Proceed with face verification.');

      // Log successful security attempt
      await supabase.from('security_logs').insert({
        email_id: emailId,
        recipient_email: user.email || '',
        attempt_type: 'key_verification',
        success: true,
        user_agent: navigator.userAgent,
        ip_address: 'client'
      });

      toast({
        title: "Key Verified",
        description: "Content decrypted successfully. Proceed with biometric verification.",
      });
    } catch (error) {
      // Log failed security attempt
      await supabase.from('security_logs').insert({
        email_id: emailId,
        recipient_email: user.email || '',
        attempt_type: 'key_verification',
        success: false,
        user_agent: navigator.userAgent,
        ip_address: 'client'
      });

      toast({
        title: "Invalid Key",
        description: "The secret key is incorrect. Please check with the sender.",
        variant: "destructive"
      });
    }
  };

  const performBiometricVerification = async () => {
    if (!email || !user) return;

    // Simulate biometric verification (70% success rate for demo)
    const success = Math.random() > 0.3;

    // Log security attempt
    await supabase.from('security_logs').insert({
      email_id: emailId,
      recipient_email: user.email || '',
      attempt_type: 'biometric_verification',
      success,
      attempt_count: 4 - attemptsLeft,
      user_agent: navigator.userAgent,
      ip_address: 'demo_ip'
    });

    if (success) {
      setVerificationStatus('✅ Face verification successful!');
      setBiometricVerified(true);
      toast({
        title: "Access Granted",
        description: "Biometric verification successful!"
      });
    } else {
      const newAttemptsLeft = attemptsLeft - 1;
      setAttemptsLeft(newAttemptsLeft);

      if (newAttemptsLeft > 0) {
        setVerificationStatus(`❌ Face verification failed. ${newAttemptsLeft} attempts remaining.`);
        setSecurityAlert(`Security alert sent to sender: Failed biometric verification attempt from ${user.email}`);
      } else {
        setVerificationStatus('🚨 Maximum attempts exceeded. Email destroyed.');
        setSecurityAlert('SECURITY BREACH: Email and attachments have been automatically destroyed after 3 failed attempts. Sender has been notified.');
        
        // Destroy email in database
        await supabase
          .from('secure_emails')
          .update({ is_destroyed: true })
          .eq('id', emailId);

        setTimeout(() => {
          onBack();
        }, 5000);
      }
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground">Loading email...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="glass-card rounded-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-foreground">Decrypt Email</h2>
            <Button onClick={onBack} variant="ghost">← Back to Inbox</Button>
          </div>
          
          <div className="space-y-6">
            <div className="bg-destructive/20 border border-destructive rounded-xl p-4">
              <h4 className="text-destructive-foreground font-bold mb-2">🔐 Step 1: Enter Secret Key</h4>
              <Input
                type="text"
                value={decryptionKey}
                onChange={(e) => setDecryptionKey(e.target.value)}
                placeholder="Enter sender's secret key..."
                className="font-mono mb-3"
              />
              <Button onClick={verifyKey} disabled={keyVerified}>
                Verify Key
              </Button>
            </div>
            
            {keyVerified && (
              <div className="bg-yellow-900/30 border border-yellow-500 rounded-xl p-4">
                <h4 className="text-yellow-300 font-bold mb-2">👤 Step 2: Biometric Verification</h4>
                <p className="text-yellow-200 mb-4">Face recognition required to access attachments</p>
                
                <div className="relative mx-auto w-32 h-32 mb-4">
                  <div className="biometric-scanner w-full h-full rounded-full border-2 border-yellow-400 flex items-center justify-center relative overflow-hidden">
                    <div className="text-3xl">👤</div>
                    <div className="scanning-line absolute w-full h-0.5 bg-yellow-400 opacity-70"></div>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-yellow-200 mb-3">{verificationStatus}</p>
                  <p className="text-sm text-yellow-300 mb-3">Attempts remaining: {attemptsLeft}</p>
                  {!biometricVerified && attemptsLeft > 0 && (
                    <Button onClick={performBiometricVerification}>
                      Verify Face
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {biometricVerified && (
              <div className="bg-accent/20 border border-accent rounded-xl p-4">
                <h4 className="text-accent-foreground font-bold mb-2">✅ Email Decrypted Successfully</h4>
                <div className="bg-background/30 rounded-lg p-4">
                  <h5 className="text-foreground font-bold">Subject: {email.subject}</h5>
                  <p className="text-muted-foreground text-sm mb-3">From: {email.sender_id}</p>
                  <p className="text-foreground">{decryptedContent}</p>
                  
                  {email.attachment_name && !showAttachmentVerification && !attachmentApproved && (
                    <Button 
                      className="mt-3" 
                      size="sm"
                      onClick={() => setShowAttachmentVerification(true)}
                    >
                      📎 Access {email.attachment_name}
                    </Button>
                  )}
                  
                  {email.attachment_name && attachmentApproved && (
                    <Button className="mt-3" size="sm">
                      📎 Download {email.attachment_name}
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {showAttachmentVerification && !attachmentApproved && (
              <AttachmentVerification
                emailId={emailId}
                senderId={email.sender_id}
                attachmentName={email.attachment_name || ''}
                onVerificationComplete={(approved) => {
                  setAttachmentApproved(approved);
                  setShowAttachmentVerification(false);
                  if (approved) {
                    toast({
                      title: "Access Granted",
                      description: "Sender approved your identity. You can now access the attachment."
                    });
                  } else {
                    toast({
                      title: "Access Denied",
                      description: "Sender denied verification. Attachment access blocked.",
                      variant: "destructive"
                    });
                  }
                }}
              />
            )}
            
            {securityAlert && (
              <div className="bg-destructive/30 border border-destructive rounded-xl p-4">
                <h4 className="text-destructive-foreground font-bold mb-2">🚨 Security Alert</h4>
                <p className="text-destructive-foreground">{securityAlert}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};