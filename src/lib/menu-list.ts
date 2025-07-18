// lib/menu-list.ts
import {
  LayoutDashboard,
  Users,
  Car,
  MapPin,
  Building2,
  DollarSign,
  HeadphonesIcon,
  Bell,
  Settings,
  LucideIcon,
  LogOut
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
  permission: string;
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

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
          permission: "dashboard"
        }
      ]
    },
    {
      groupLabel: "Management",
      menus: [
        {
          href: "/drivers",
          label: "Drivers",
          active: pathname === "/drivers",
          icon: Users,
          permission: "drivers"
        },
        {
          href: "/vehicles",
          label: "Vehicles",
          active: pathname === "/vehicles",
          icon: Car,
          permission: "vehicles"
        },
        {
          href: "/rides",
          label: "Rides",
          active: pathname === "/rides",
          icon: MapPin,
          permission: "rides"
        },
        {
          href: "/hotels",
          label: "Hotels",
          active: pathname === "/hotels",
          icon: Building2,
          permission: "hotels"
        },
        {
          href: "/earnings",
          label: "Earnings",
          active: pathname === "/earnings",
          icon: DollarSign,
          permission: "earnings"
        }
      ]
    },
    {
      groupLabel: "System",
      menus: [
        {
          href: "/support",
          label: "Support",
          active: pathname === "/support",
          icon: HeadphonesIcon,
          permission: "support"
        },
        {
          href: "/notifications",
          label: "Notifications",
          active: pathname === "/notifications",
          icon: Bell,
          permission: "notifications"
        },
        {
          href: "/admin-management",
          label: "Admin Management",
          active: pathname === "/admin-management",
          icon: Settings,
          permission: "admin_management"
        },
        {
          href: "/logout",
          label: "Logout",
          active: pathname === "/logout",
          icon: LogOut,
          permission: "admin_management"
        }
      ]
    }
  ];

  return allMenus.map(group => ({
    ...group,
    menus: group.menus.filter(menu => userPermissions[menu.permission])
  })).filter(group => group.menus.length > 0);
}