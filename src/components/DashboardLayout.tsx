'use client';
import React, { useState } from 'react';
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
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';
import { getMenuList } from '../lib/menu-list';
import { useRouter } from 'next/navigation';

// Define and export the User interface
export interface User {
  name: string;
  role: string;
  permissions: Record<string, boolean>;
}

// Define and export the DashboardLayoutProps interface
export interface DashboardLayoutProps {
  user: User;
  children: React.ReactNode;
  currentPage: string;
  onLogout: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  children,
  currentPage,
  onLogout
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  // Get and filter menu list based on permissions
  const menuGroups = getMenuList(currentPage).map(group => ({
    ...group,
    menus: group.menus.filter(item => user.permissions[item.permission])
  })).filter(group => group.menus.length > 0);

  const getRoleLabel = (role: string) => {
    const labels = {
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'executive_admin': 'Executive Admin',
      'hotel_admin': 'Hotel Admin'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants = {
      'super_admin': 'destructive',
      'admin': 'default',
      'executive_admin': 'secondary',
      'hotel_admin': 'outline'
    };
    return variants[role as keyof typeof variants] || 'default';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                <Car className="w-5 h-5" />
              </div>
              <span className="text-xl font-semibold">Sawari</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback>
                  {user?.name
                    ? user.name.split(' ').map((n: string) => n[0]).join('')
                    : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.name ?? 'Unknown User'}
                </p>
                <Badge variant={getRoleBadgeVariant(user?.role ?? '')} className="text-xs">
                  {getRoleLabel(user?.role ?? '')}
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuGroups.map((group, index) => (
              <div key={index} className="space-y-2">
                {group.groupLabel && (
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {group.groupLabel}
                  </h3>
                )}
                {group.menus.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.href}
                      variant={item.active ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => {
                        router.push(item.href);
                        setSidebarOpen(false);
                      }}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <Menu className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-semibold capitalize">
              {currentPage.replace('/', '').replace('_', ' ')}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                onLogout();
                router.push('/');
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;