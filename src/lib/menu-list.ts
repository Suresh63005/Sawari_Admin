import {
  LayoutDashboard,
  Users,
  Car,
  MapPin,
  DollarSign,
  HeadphonesIcon,
  Bell,
  Settings,
  LucideIcon,
  LogOut,
  Package,
} from "lucide-react";

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
  permission?: string; // Made optional to allow menu items without permission checks
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

// getMenuList
export function getMenuList(pathname: string, userPermissions: { [key: string]: boolean }): Group[] {
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
          icon: Car,
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
          permission: "fleet", // Updated
        },
        {
          href: "/packages",
          label: "Packages",
          active: pathname === "/packages",
          icon: Package,
          permission: "fleet", // Updated
        },
        {
          href: "/subpackages",
          label: "Subpackages",
          active: pathname === "/subpackages",
          icon: Package,
          permission: "fleet", // Updated
        },
        {
          href: "/packageprice",
          label: "Package Price",
          active: pathname === "/packageprice",
          icon: Package,
          permission: "fleet", // Updated
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
          permission: "push_notifications", // Renamed
        },
        {
          href: "/admin-management",
          label: "Admin Management",
          active: pathname === "/admin-management",
          icon: Settings,
          permission: "admin_management",
        },
        {
          href: "/logout",
          label: "Logout",
          active: pathname === "/logout",
          icon: LogOut,
          // No permission required for logout
        },
      ],
    },
  ];

  return allMenus.map(group => ({
    ...group,
    menus: group.menus.filter(menu => !menu.permission || userPermissions[menu.permission]),
  })).filter(group => group.menus.length > 0);
}