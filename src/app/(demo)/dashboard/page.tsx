"use client";

import { Dashboard } from "@/components/Dashboard";

// Define the props interface for DashboardPage
interface DashboardPageProps {
  user: {
    name: string;
    role: string;
    permissions: Record<string, boolean>;
  };
}

export default function DashboardPage({ user }: DashboardPageProps) {
  

  return (
        
      <Dashboard user={user} />

  );
}