'use client';

import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

export const AuthButton = () => {
  const { data: session, isPending: loading } = authClient.useSession();
  const router = useRouter();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOutClick = () => {
    setShowSignOutConfirm(true);
  };

  const confirmSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      setShowSignOutConfirm(false);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (session) {
    return (
      <>
        <ConfirmationModal
          isOpen={showSignOutConfirm}
          onClose={() => setShowSignOutConfirm(false)}
          onConfirm={confirmSignOut}
          title="Sign Out"
          description="Are you sure you want to sign out?"
          confirmLabel="Sign Out"
          isLoading={isSigningOut}
        />
        <Button
          onClick={handleSignOutClick}
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </>
    );
  }

  return (
    <Button
      onClick={() => router.push('/sign-in')}
      variant="default"
      size="sm"
      className="gap-2"
    >
      <LogIn className="h-4 w-4" />
      Sign In
    </Button>
  );
};