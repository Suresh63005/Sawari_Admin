'use client';

import { DashboardLayout } from "@/components/DashboardLayout";
import { usePathname, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useState, useEffect } from 'react';
import apiClient from '@/lib/apiClient';
import { User } from '@/components/DashboardLayout';
import Loader from '@/components/ui/Loader';
import { Suspense } from 'react';

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
        if (!token) {
          console.log('No token found, redirecting to login'); // Debug log
          router.push('/');
          return;
        }

        const response = await apiClient.get('/v1/admin/auth/me');
        console.log('User data fetched:', response.data); // Debug log
        const permissions = response.data.permissions || {};
        console.log('Permissions received:', permissions); // Debug log
        console.log('Permission keys:', Object.keys(permissions)); // Debug log

        // Validate required permissions
        const expectedPermissions = [
          'dashboard',
          'drivers',
          'vehicles',
          'rides',
          'earnings',
          'support',
          'push_notifications',
          'admin_management',
          'fleet',
        ];
        const missingPermissions = expectedPermissions.filter(
          (perm) => !(perm in permissions)
        );
        if (missingPermissions.length > 0) {
          console.warn('Missing permissions:', missingPermissions); // Debug log
        }

        setUser({
          name: response.data.name,
          role: response.data.role,
          permissions: {
            dashboard: !!permissions.dashboard,
            drivers: !!permissions.drivers,
            vehicles: !!permissions.vehicles,
            rides: !!permissions.rides,
            earnings: !!permissions.earnings,
            support: !!permissions.support,
            push_notifications: !!permissions.push_notifications,
            admin_management: !!permissions.admin_management,
            fleet: !!permissions.fleet,
          },
        });
      } catch (error: any) {
        console.error('Failed to fetch user:', error); // Debug log
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        }); // Detailed error log
        setError(error.response?.data?.message || 'Failed to fetch user data. Please try again.');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  if (loading) {
    return <Loader />;
  }

  if (error || !user) {
    console.log('Error or no user data:', { error, user }); // Debug log
    router.push('/');
    return null;
  }

  return (
    <ProtectedRoute>
      <DashboardLayout
        user={user}
        currentPage={pathname}
        onLogout={() => {
          localStorage.removeItem('token');
          console.log('Logout clicked'); // Debug log
          window.location.href = '/';
        }}
      >
        <Suspense fallback={<Loader />}>
          {children}
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}