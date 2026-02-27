'use client';

import { useEffect, useState, Suspense } from 'react';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { FirebaseClientProvider, useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader, Lock } from 'lucide-react';

function AdminAuthGuard() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [profileId, setProfileId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  
  // Use session isolation to determine which profile this tab belongs to
  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.push('/login');
      } else {
        const storedId = sessionStorage.getItem('evacai_profile_id');
        // Fallback to user.uid if no session ID exists (legacy or direct link)
        setProfileId(storedId || user.uid);
        setIsReady(true);
      }
    }
  }, [user, isUserLoading, router]);

  const userRef = useMemoFirebase(() => profileId ? doc(firestore, 'users', profileId) : null, [firestore, profileId]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  const isDataReady = isReady && !isProfileLoading;
  const isAdminByRole = profile?.role === 'admin';

  useEffect(() => {
    if (!isDataReady || !profile) return;

    // If the active profile for this tab is NOT an admin, redirect them
    if (profile.role === 'user') {
      router.push('/user');
    }
  }, [isDataReady, profile, router]);

  if (!isDataReady || (isReady && profileId && !profile && !isProfileLoading)) {
    return (
      <div className="flex h-screen items-center justify-center gap-2">
        <Loader className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Verifying Admin Permissions...</span>
      </div>
    );
  }

  if (profile && !isAdminByRole) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4 text-center p-8">
        <Lock className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground max-w-md">
          You do not have the required permissions to view the Admin Central.
        </p>
      </div>
    );
  }

  return (
    <>
      <Header section="Admin" />
      <div className="container mx-auto py-8 px-4">
        <AdminDashboard userId={profileId} />
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center gap-2">
        <Loader className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Initializing Admin Dashboard...</span>
      </div>
    }>
      <FirebaseClientProvider>
        <AdminAuthGuard />
      </FirebaseClientProvider>
    </Suspense>
  );
}
