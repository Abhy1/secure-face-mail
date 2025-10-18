import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AttachmentVerificationProps {
  emailId: string;
  senderId: string;
  attachmentName: string;
  onVerificationComplete: (approved: boolean) => void;
}

export const AttachmentVerification = ({
  emailId,
  senderId,
  attachmentName,
  onVerificationComplete
}: AttachmentVerificationProps) => {
  const [capturing, setCapturing] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [verificationId, setVerificationId] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const capturePhoto = async () => {
    try {
      setCapturing(true);
      
      // Request camera permission and capture photo
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Wait for video to be ready
      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });
      
      // Capture frame to canvas
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      // Convert to base64
      const photoData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Stop camera
      stream.getTracks().forEach(track => track.stop());
      
      // Send verification request to sender
      await sendVerificationRequest(photoData);
      
      setPhotoTaken(true);
      setAwaitingApproval(true);
      
      toast({
        title: "Photo Captured",
        description: "Your photo has been sent to the sender for verification"
      });
      
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please allow camera permission.",
        variant: "destructive"
      });
    } finally {
      setCapturing(false);
    }
  };

  const sendVerificationRequest = async (photoData: string) => {
    const { error } = await supabase
      .from('verification_requests')
      .insert({
        email_id: emailId,
        sender_id: senderId,
        receiver_id: user?.id,
        receiver_photo_data: photoData
      });

    if (error) {
      console.error('Error creating verification request:', error);
      throw error;
    }

    // Send notification to sender via edge function
    await supabase.functions.invoke('send-verification-notification', {
      body: {
        senderId,
        receiverEmail: user?.email,
        attachmentName,
        emailId
      }
    });
  };

  // Poll for verification status
  React.useEffect(() => {
    if (!awaitingApproval) return;

    const pollInterval = setInterval(async () => {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('status')
        .eq('email_id', emailId)
        .eq('receiver_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && data.status !== 'pending') {
        setAwaitingApproval(false);
        clearInterval(pollInterval);
        onVerificationComplete(data.status === 'approved');
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [awaitingApproval, emailId, user?.id, onVerificationComplete]);

  return (
    <div className="bg-background/50 rounded-xl p-6 mb-6 text-center">
      <div className="text-4xl mb-4">📸</div>
      <h3 className="text-xl font-semibold mb-4">Verify Identity to Access Attachment</h3>
      
      {!photoTaken && (
        <>
          <p className="text-muted-foreground mb-6">
            To access the attachment "{attachmentName}", we need to verify your identity.
            Your photo will be sent to the sender for approval.
          </p>
          
          <Button 
            onClick={capturePhoto} 
            disabled={capturing}
            className="w-full mb-4"
          >
            {capturing ? 'Capturing Photo...' : 'Take Photo for Verification'}
          </Button>
        </>
      )}
      
      {photoTaken && awaitingApproval && (
        <div className="space-y-4">
          <div className="text-green-500">✅ Photo captured successfully!</div>
          <p className="text-muted-foreground">
            Waiting for sender approval... This may take a few minutes.
          </p>
          <div className="animate-pulse text-accent">Awaiting verification...</div>
        </div>
      )}
    </div>
  );
};