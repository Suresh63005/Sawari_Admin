'use client';

import { DashboardLayout } from "@/components/DashboardLayout";
import { usePathname, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import { User } from '@/components/DashboardLayout';

export default function DashboardRootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Fetching user with token:', token); // Debug log
        if (token) {
          const response = await apiClient.get('/v1/admin/auth/me');
          console.log('User data fetched:', response.data); // Debug log
          setUser({
            name: response.data.name,
            role: response.data.role,
            permissions: response.data.permissions
          });
          console.log(Object.keys(response.data.permissions),"perrrrrrmissionsssssssssssss"); // Debug log
        } else {
          console.log('No token found, redirecting to login'); // Debug log
          router.push('/login');
        }
      } catch (error: any) {
        console.error('Failed to fetch user:', error); // Debug log
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        }); // Detailed error log
        setError(error.response?.data?.message || 'Failed to fetch user data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log('No user data, redirecting to login'); // Debug log
    return null;
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        user={user}
        currentPage={pathname}
        onLogout={() => {
          localStorage.removeItem('token');
          console.log("Logout clicked"); // Debug log
          window.location.href = '/';
        }}
      > 
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}