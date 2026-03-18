'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader } from 'lucide-react';
import { logoutUserAction } from '@/lib/actions';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();
  const db = useFirestore();
  const { user } = useUser();

  const handleLogout = () => {
    startTransition(async () => {
       const profileId = sessionStorage.getItem('evacway_profile_id') || user?.uid;
       
       if (profileId) {
          try {
            // 1. Explicitly mark the profile as offline in Firestore
            const userRef = doc(db, 'users', profileId);
            await updateDoc(userRef, { 
              status: 'offline',
              lastSeen: new Date().toISOString() 
            });
            
            // 2. Clear tab-specific session identity
            sessionStorage.removeItem('evacway_profile_id');
            
            // 3. Perform server-side cleanup and redirect
            await logoutUserAction();
          } catch (e) {
            console.error('Logout error:', e);
            // Fallback: clear session and redirect even if Firestore update fails
            sessionStorage.removeItem('evacway_profile_id');
            await logoutUserAction();
          }
       } else {
          await logoutUserAction();
       }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isPending}
    >
      {isPending ? (
        <Loader className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="mr-2 h-4 w-4" />
      )}
      Logout
    </Button>
  );
}
