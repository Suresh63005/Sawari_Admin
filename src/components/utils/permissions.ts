export type Role = 'super_admin' | 'admin' | 'executive_admin' | 'ride_manager';

export const DEFAULT_PERMISSIONS: Record<Role, {
  dashboard: boolean;
  drivers: boolean;
  vehicles: boolean;
  rides: boolean;
  earnings: boolean;
  support: boolean;
  notifications: boolean;
  admin_management: boolean;
}> = {
  super_admin: {
    dashboard: true,
    drivers: true,
    vehicles: true,
    rides: true,
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
    earnings: false,
    support: true,
    notifications: true,
    admin_management: false,
  },
  ride_manager: {
    dashboard: true,
    drivers: false,
    vehicles: false,
    rides: true,
    earnings: false,
    support: false,
    notifications: false,
    admin_management: false,
  },
};

export const getAdminHierarchy = (currentRole: Role): Role[] => {
  const hierarchy: Record<Role, Role[]> = {
    super_admin: ['super_admin', 'admin', 'executive_admin', 'ride_manager'],
    admin: ['admin', 'executive_admin', 'ride_manager'],
    executive_admin: ['executive_admin', 'ride_manager'],
    ride_manager: ['ride_manager'],
  };
  return hierarchy[currentRole] || ['ride_manager'];
};

export const canCreateAdmin = (currentRole: Role, newRole: Role): boolean => {
  const hierarchy = getAdminHierarchy(currentRole);
  return hierarchy.includes(newRole) && currentRole !== newRole;
};