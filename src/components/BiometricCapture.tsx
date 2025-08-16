import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface BiometricCaptureProps {
  onComplete: () => void;
}

export const BiometricCapture = ({ onComplete }: BiometricCaptureProps) => {
  const [status, setStatus] = useState('Position your face and click scan');
  const [scanning, setScanning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const requestCameraPermission = async () => {
    try {
      setStatus('Requesting camera permission...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      setHasPermission(true);
      setStatus('Camera ready! Click to capture your face');
      
      // Stop the stream immediately after permission is granted
      mediaStream.getTracks().forEach(track => track.stop());
    } catch (error) {
      toast({
        title: "Camera Permission Required",
        description: "Please allow camera access for biometric registration",
        variant: "destructive"
      });
      setStatus('Camera permission denied. Please allow camera access.');
    }
  };

  const startBiometricScan = async () => {
    if (!hasPermission) {
      await requestCameraPermission();
      return;
    }

    setScanning(true);
    setStatus('📸 Capturing your face...');

    // Simulate face capture
    setTimeout(() => {
      setStatus('🔍 Analyzing facial features...');
      
      setTimeout(() => {
        setStatus('✅ Face captured and analyzed successfully!');
        setScanning(false);
        setCompleted(true);
        
        // Save biometric data to database
        saveBiometricData();
      }, 2000);
    }, 1000);
  };

  const saveBiometricData = async () => {
    if (!user) return;

    // Mock biometric data (in real app, this would be encrypted facial features)
    const mockBiometricData = JSON.stringify({
      faceId: `face_${user.id}_${Date.now()}`,
      features: Array.from({ length: 128 }, () => Math.random().toString(36)),
      timestamp: new Date().toISOString()
    });

    const { error } = await supabase
      .from('profiles')
      .update({ biometric_data: mockBiometricData })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save biometric data",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center">
        <h2 className="text-3xl font-bold text-foreground mb-4">Biometric Setup</h2>
        <p className="text-muted-foreground mb-6">Position your face in the scanner area</p>
        
        <div className="relative mx-auto w-64 h-64 mb-6">
          <div className="biometric-scanner w-full h-full rounded-full border-4 border-primary flex items-center justify-center relative overflow-hidden">
            <div className="text-6xl">👤</div>
            {scanning && <div className="scanning-line absolute w-full h-1 bg-primary opacity-70"></div>}
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-muted-foreground">{status}</p>
        </div>
        
        {!completed && !scanning && (
          <Button onClick={startBiometricScan} className="w-full mb-4">
            Start Face Scan
          </Button>
        )}
        
        {completed && (
          <Button onClick={onComplete} className="w-full">
            Complete Setup
          </Button>
        )}
      </div>
    </div>
  );
};