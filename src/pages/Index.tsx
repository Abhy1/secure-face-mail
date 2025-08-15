import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { SignupScreen } from '@/components/SignupScreen';
import { LoginScreen } from '@/components/LoginScreen';
import { KeyGeneration } from '@/components/KeyGeneration';
import { BiometricCapture } from '@/components/BiometricCapture';
import { Dashboard } from '@/components/Dashboard';
import { ComposeEmail } from '@/components/ComposeEmail';
import { Inbox } from '@/components/Inbox';
import { EmailDecryption } from '@/components/EmailDecryption';
import { SuccessScreen } from '@/components/SuccessScreen';

type Screen = 'welcome' | 'login' | 'signup' | 'keyGeneration' | 'biometric' | 'dashboard' | 'compose' | 'inbox' | 'decrypt' | 'success';

const SecureMailApp = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [selectedEmailId, setSelectedEmailId] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const { user, loading } = useAuth();

  // Show dashboard if user is authenticated
  React.useEffect(() => {
    if (user && currentScreen === 'welcome') {
      setCurrentScreen('dashboard');
    }
  }, [user, currentScreen]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <WelcomeScreen 
            onLogin={() => setCurrentScreen('login')}
            onSignup={() => setCurrentScreen('signup')} 
          />
        );
      
      case 'login':
        return (
          <LoginScreen 
            onLoginSuccess={() => setCurrentScreen('dashboard')}
            onSignupRedirect={() => setCurrentScreen('signup')}
          />
        );
      
      case 'signup':
        return (
          <SignupScreen 
            onSignupComplete={() => setCurrentScreen('keyGeneration')}
            onLoginRedirect={() => setCurrentScreen('login')}
          />
        );
      
      case 'keyGeneration':
        return (
          <KeyGeneration 
            onComplete={(key) => {
              setSecretKey(key);
              setCurrentScreen('biometric');
            }} 
          />
        );
      
      case 'biometric':
        return <BiometricCapture onComplete={() => setCurrentScreen('dashboard')} />;
      
      case 'dashboard':
        return (
          <Dashboard 
            onCompose={() => setCurrentScreen('compose')}
            onInbox={() => setCurrentScreen('inbox')}
          />
        );
      
      case 'compose':
        return (
          <ComposeEmail 
            onBack={() => setCurrentScreen('dashboard')}
            onSent={() => setCurrentScreen('success')}
          />
        );
      
      case 'inbox':
        return (
          <Inbox 
            onBack={() => setCurrentScreen('dashboard')}
            onDecrypt={(emailId) => {
              setSelectedEmailId(emailId);
              setCurrentScreen('decrypt');
            }}
          />
        );
      
      case 'decrypt':
        return (
          <EmailDecryption 
            emailId={selectedEmailId}
            onBack={() => setCurrentScreen('inbox')}
          />
        );
      
      case 'success':
        return <SuccessScreen onReturn={() => setCurrentScreen('dashboard')} />;
      
      default:
        return (
          <WelcomeScreen 
            onLogin={() => setCurrentScreen('login')}
            onSignup={() => setCurrentScreen('signup')} 
          />
        );
    }
  };

  return (
    <div className="relative">
      {/* Demo Badge */}
      <div className="fixed top-4 right-4 z-50 bg-yellow-400 text-black px-4 py-2 rounded-full font-bold text-sm">
        🔒 DEMO PROTOTYPE
      </div>
      
      {renderScreen()}
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <SecureMailApp />
    </AuthProvider>
  );
};

export default Index;
