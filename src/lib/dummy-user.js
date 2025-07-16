import { AdminManagement } from "@/components/AdminManagement";

export const dummyUser = {
  name: "Super Admin",
  role: "Super Admin",
  permissions: {
    dashboard: true,
    rides: true,
    earnings: true,
    drivers: true,
    vehicles: true,
    hotels: true,
    support: true,
    admin_management:true,
  }
};
