import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface VerificationRequest {
  id: string;
  email_id: string;
  receiver_id: string;
  receiver_photo_data: string;
  status: string;
  created_at: string;
  secure_emails: {
    subject: string;
    recipient_email: string;
    attachment_name: string;
  };
  profiles: {
    email: string;
  };
}

interface VerificationDashboardProps {
  onBack: () => void;
}

export const VerificationDashboard = ({ onBack }: VerificationDashboardProps) => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchVerificationRequests();
    }
  }, [user]);

  const fetchVerificationRequests = async () => {
    const { data, error } = await supabase
      .from('verification_requests')
      .select(`
        *,
        secure_emails (subject, recipient_email, attachment_name)
      `)
      .eq('sender_id', user?.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching verification requests:', error);
      return;
    }

    // Get receiver emails separately
    const requestsWithEmails = await Promise.all(
      (data || []).map(async (request) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', request.receiver_id)
          .single();
        
        return {
          ...request,
          profiles: { email: profile?.email || 'Unknown' }
        };
      })
    );

    setRequests(requestsWithEmails);
    setLoading(false);
  };

  const handleVerification = async (requestId: string, approved: boolean) => {
    const { error } = await supabase
      .from('verification_requests')
      .update({ status: approved ? 'approved' : 'denied' })
      .eq('id', requestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: approved ? "Access Approved" : "Access Denied",
      description: approved 
        ? "Receiver can now access the attachment" 
        : "Receiver's access has been denied"
    });

    // Refresh the list
    fetchVerificationRequests();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <p>Loading verification requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card rounded-3xl p-8 max-w-2xl w-full">
        <h2 className="text-3xl font-bold text-foreground mb-6 text-center">
          🔐 Verification Requests
        </h2>
        
        <Button onClick={onBack} variant="outline" className="mb-6">
          ← Back to Dashboard
        </Button>

        {requests.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-muted-foreground">No pending verification requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-background/50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <img 
                      src={request.receiver_photo_data} 
                      alt="Receiver verification photo"
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">
                      {request.secure_emails.subject}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-muted-foreground mb-4">
                      <p><strong>Requester:</strong> {request.profiles.email}</p>
                      <p><strong>Attachment:</strong> {request.secure_emails.attachment_name}</p>
                      <p><strong>Requested:</strong> {new Date(request.created_at).toLocaleString()}</p>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => handleVerification(request.id, true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        ✅ Approve
                      </Button>
                      
                      <Button 
                        onClick={() => handleVerification(request.id, false)}
                        variant="destructive"
                      >
                        ❌ Deny
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};