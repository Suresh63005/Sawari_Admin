export type Role = 'super_admin' | 'admin' | 'executive_admin' | 'hotel_admin';

export interface User {
  role: Role;
  permissions: {
    dashboard: boolean;
    drivers: boolean;
    vehicles: boolean;
    rides: boolean;
    hotels: boolean;
    earnings: boolean;
    support: boolean;
    notifications: boolean;
    admin_management: boolean;
  };
}

export const DEFAULT_PERMISSIONS: Record<Role, User['permissions']> = {
  super_admin: {
    dashboard: true,
    drivers: true,
    vehicles: true,
    rides: true,
    hotels: true,
    earnings: true,
    support: true,
    notifications: true,
    admin_management: true,
  },
  admin: {
    dashboard: true,
    drivers: true,
    vehicles: true,
    rides: true,
    hotels: true,
    earnings: false,
    support: true,
    notifications: true,
    admin_management: true,
  },
  executive_admin: {
    dashboard: true,
    drivers: true,
    vehicles: true,
    rides: true,
    hotels: false,
    earnings: false,
    support: true,
    notifications: true,
    admin_management: true,
  },
  hotel_admin: {
    dashboard: true,
    drivers: false,
    vehicles: false,
    rides: true,
    hotels: false,
    earnings: false,
    support: false,
    notifications: false,
    admin_management: false,
  }
};

export const checkPermission = (user: User | null, permission: keyof User['permissions']): boolean => {
  if (!user || !user.permissions) return false;
  return user.permissions[permission] === true;
};

export const hasAnyPermission = (user: User | null, permissions: (keyof User['permissions'])[]): boolean => {
  if (!user || !user.permissions) return false;
  return permissions.some(permission => user.permissions[permission] === true);
};

export const getAdminHierarchy = (role: Role): Role[] => {
  const hierarchy: Record<Role, Role[]> = {
    super_admin: ['admin', 'executive_admin', 'hotel_admin'],
    admin: ['executive_admin', 'hotel_admin'],
    executive_admin: ['hotel_admin'],
    hotel_admin: []
  };
  return hierarchy[role] || [];
};

export const canCreateAdmin = (currentUserRole: Role, targetRole: Role): boolean => {
  const allowedRoles = getAdminHierarchy(currentUserRole);
  return allowedRoles.includes(targetRole);
};