'use client';

import { AdminManagement } from "@/components/AdminManagement";
import { dummyUser } from "@/lib/dummy-user"; // ✅ don't add .js or .ts extension // or your actual file path

export default function AdminManagementPage() {
  return <AdminManagement currentUser={dummyUser} />;
}
