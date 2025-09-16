import {
  LayoutDashboard,
  Users,
  Car,
  CarFront,
  MapPin,
  DollarSign,
  Combine,
  HeadphonesIcon,
  Bell,
  Settings,
  LucideIcon,
  Package,
  Boxes,
  FileText,
} from "lucide-react";
import { use } from "react";

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
  permission?: string;
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

// Define the shape of userPermissions with an index signature
export interface UserPermissions {
  dashboard: boolean;
  drivers: boolean;
  vehicles: boolean;
  rides: boolean;
  earnings: boolean;
  support: boolean;
  push_notifications: boolean;
  admin_management: boolean;
  fleet: boolean;
  reports: boolean;
  [key: string]: boolean; // Index signature to allow string-based indexing
}


export function getMenuList(pathname: string, userPermissions: UserPermissions): Group[] {
  console.log('userPermissions passed to getMenuList:', userPermissions);
  const allMenus: Group[] = [
    {
      groupLabel: "",
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          active: pathname === "/dashboard",
          icon: LayoutDashboard,
          permission: "dashboard",
        },
      ],
    },
    {
      groupLabel: "Management",
      menus: [
        {
          href: "/drivers",
          label: "Drivers",
          active: pathname === "/drivers",
          icon: Users,
          permission: "drivers",
        },
        {
          href: "/vehicles",
          label: "Vehicles",
          active: pathname === "/vehicles",
          icon: CarFront,
          permission: "vehicles",
        },
        {
          href: "/rides",
          label: "Rides",
          active: pathname === "/rides",
          icon: MapPin,
          permission: "rides",
        },
        {
          href: "/earnings",
          label: "Earnings",
          active: pathname === "/earnings",
          icon: DollarSign,
          permission: "earnings",
        },
      ],
    },
    {
      groupLabel: "Fleet",
      menus: [
        {
          href: "/cars",
          label: "Cars",
          active: pathname === "/cars",
          icon: Car,
          permission: "fleet",
        },
        {
          href: "/packages",
          label: "Packages",
          active: pathname === "/packages",
          icon: Package,
          permission: "fleet",
        },
        {
          href: "/subpackages",
          label: "Subpackages",
          active: pathname === "/subpackages",
          icon: Combine,
          permission: "fleet",
        },
        {
          href: "/packageprice",
          label: "Package Price",
          active: pathname === "/packageprice",
          icon: Boxes,
          permission: "fleet",
        },
      ],
    },
    {
  groupLabel: "Reports",
  menus: [
    {
      href: "/reports/drivers",
      label: "Driver Reports",
      active: pathname === "/reports/drivers",
      icon: FileText, // you can pick a different icon for each if you want
      permission: "reports",
    },
    {
      href: "/reports/rides",
      label: "Ride Reports",
      active: pathname === "/reports/rides",
      icon: FileText, // or MapPin, whatever suits
      permission: "reports",
    },
    {
      href: "/reports/payments",
      label: "Payment Reports",
      active: pathname === "/reports/payments",
      icon: FileText, // or DollarSign for payments
      permission: "reports",
    },
  ],
},

    {
      groupLabel: "System",
      menus: [
        {
          href: "/support",
          label: "Support",
          active: pathname === "/support",
          icon: HeadphonesIcon,
          permission: "support",
        },
        {
          href: "/notifications",
          label: "Push Notifications",
          active: pathname === "/notifications",
          icon: Bell,
          permission: "push_notifications",
        },
        {
          href: "/admin-management",
          label: "Admin Management",
          active: pathname === "/admin-management",
          icon: Settings,
          permission: "admin_management",
        },
      ],
    },
  ];

  return allMenus
    .map(group => ({
      ...group,
      menus: group.menus.filter(menu => !menu.permission || userPermissions[menu.permission]),
    }))
    
    .filter(group => group.menus.length > 0);
}
