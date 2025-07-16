export const checkPermission = (user: any, permission: string): boolean => {
  if (!user || !user.permissions) return false;
  return user.permissions[permission] === true;
};

export const hasAnyPermission = (user: any, permissions: string[]): boolean => {
  if (!user || !user.permissions) return false;
  return permissions.some(permission => user.permissions[permission] === true);
};

export const getAdminHierarchy = (role: string): string[] => {
  const hierarchy = {
    super_admin: ['admin', 'executive_admin', 'hotel_admin'],
    admin: ['executive_admin'],
    executive_admin: ['hotel_admin'],
    hotel_admin: []
  };
  return hierarchy[role as keyof typeof hierarchy] || [];
};

export const canCreateAdmin = (currentUserRole: string, targetRole: string): boolean => {
  const allowedRoles = getAdminHierarchy(currentUserRole);
  return allowedRoles.includes(targetRole);
};

export const DEFAULT_PERMISSIONS = {
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