// app/dashboard/page.tsx
"use client";

import { Dashboard } from "@/components/Dashboard";

export default function DashboardPage() {
  const user = {
    name: "Suresh",
    role: "admin", 
    permissions: {
      rides: true,
      earnings: true,
      drivers: true,
      vehicles: true,
      hotels: true
    }
  };

  return <Dashboard user={user} />;
}
