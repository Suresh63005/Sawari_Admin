'use client';

import { DashboardLayout } from "@/components/DashboardLayout";
import { dummyUser } from "@/lib/dummy-user";
import { usePathname } from 'next/navigation';

export default function DashboardRootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Get the current route dynamically

  return (
    <DashboardLayout
      user={dummyUser}
      currentPage={pathname} // Pass the dynamic pathname as currentPage
      onLogout={() => console.log("Logout clicked")}
    >
      {children}
    </DashboardLayout>
  );
}