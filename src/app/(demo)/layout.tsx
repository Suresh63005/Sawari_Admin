// app/dashboard/layout.tsx
'use client';

import { DashboardLayout } from "@/components/DashboardLayout";
import { dummyUser } from "@/lib/dummy-user";
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DashboardRootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ProtectedRoute>
              <DashboardLayout
        user={dummyUser}
        currentPage={pathname}
        onLogout={() => console.log("Logout clicked")}
      >
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}