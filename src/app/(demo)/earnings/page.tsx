'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { EarningsManagement } from '@/components/EarningsManagement';
import apiClient from '@/lib/apiClient';
import { Admin } from '@/components/AdminManagement'; // Reusing Admin type for consistency
import Loader  from '@/components/ui/Loader'; // Assuming you have a Loader component

export default function EarningsManagementPage() {
  const [currentUser, setCurrentUser] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await apiClient.get('/v1/admin/auth/me');
          setCurrentUser({
            id: response.data.id,
            name: response.data.name,
            email: response.data.email,
            phone: response.data.phone || '',
            role: response.data.role,
            status: response.data.status || 'active',
            created_by: response.data.created_by || '',
            created_at: response.data.created_at || new Date().toISOString().split('T')[0],
            permissions: response.data.permissions,
          });
        } else {
          router.push('/');
        }
      } catch (err: any) {
        console.error('Fetch current user error:', err);
        setError(err.response?.data?.message || 'Failed to fetch user data');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentUser();
  }, [router]);

  // if (loading) {
  //   return <Loader />;
  // }

  if (error || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        {loading && <Loader />}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-red-600 text-xl font-semibold">Error</h2>
          <p className="text-gray-700 mt-2">{error || 'User not authenticated'}</p>
          <button
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => router.push('/')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return <EarningsManagement currentUser={currentUser} />;
}