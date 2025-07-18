// components/ProtectedRoute.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getToken } from '@/lib/getToken';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const router = useRouter();
  const token = getToken();

  useEffect(() => {
    if (!token) {
      router.push('/'); // Redirect to login if no token
    }
  }, [token, router]);

  if (!token) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
};