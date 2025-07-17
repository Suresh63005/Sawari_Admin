'use client';

import { RideManagement } from "@/components/RideManagement";

export default function RidesPage({ user }: { user: any }) {
  return <RideManagement user={user} />;
}