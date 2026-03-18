'use client';

import { useEffect, useState, Suspense } from 'react';
import { UserDashboard } from '@/components/user/user-dashboard';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { FirebaseClientProvider, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader } from 'lucide-react';

function UserAuthGuard() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [profileId, setProfileId] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.push('/login');
      } else {
        // Try to get the tab-specific session ID
        const storedId = sessionStorage.getItem('evacway_profile_id');
        setProfileId(storedId || user.uid);
        setIsReady(true);
      }
    }
  }, [user, isUserLoading, router]);

  if (!isReady || isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center gap-2">
        <Loader className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Synchronizing Session...</span>
      </div>
    );
  }

  return (
    <>
      <Header section="User" />
      <div className="container mx-auto py-8 px-4">
        <UserDashboard userId={profileId} />
      </div>
    </>
  );
}

export default function UserPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center gap-2">
        <Loader className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Initializing Navigator...</span>
      </div>
    }>
      <FirebaseClientProvider>
        <UserAuthGuard />
      </FirebaseClientProvider>
    </Suspense>
  );
}
