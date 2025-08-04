import { DEFAULT_PERMISSIONS, Role } from "@/components/utils/permissions";
import type { Admin } from "@/components/AdminManagement";

export const dummyUser: Admin = {
  id: "1",
  name: "Super Admin",
  email: "super@sawari.com",
  phone: "+971 50 123 4567",
  role: "super_admin",
  status: "active",
  created_by: "0",
  created_at: "2024-01-01",
  permissions: DEFAULT_PERMISSIONS["super_admin"],
};
