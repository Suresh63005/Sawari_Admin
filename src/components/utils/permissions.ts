export type Role = 'super_admin' | 'admin' | 'executive_admin' | 'ride_manager';

// permissions.ts
export const DEFAULT_PERMISSIONS: Record<Role, {
  dashboard: boolean;
  drivers: boolean;
  vehicles: boolean;
  rides: boolean;
  earnings: boolean;
  support: boolean;
  push_notifications: boolean; // Renamed
  admin_management: boolean;
  fleet: boolean; // New
}> = {
  super_admin: {
    dashboard: true,
    drivers: true,
    vehicles: true,
    rides: true,
    earnings: true,
    support: true,
    push_notifications: true, // Renamed
    admin_management: true,
    fleet: true, // New
  },
  admin: {
    dashboard: true,
    drivers: true,
    vehicles: true,
    rides: true,
    earnings: false,
    support: true,
    push_notifications: true, // Renamed
    admin_management: true,
    fleet: true, // New
  },
  executive_admin: {
    dashboard: true,
    drivers: true,
    vehicles: true,
    rides: true,
    earnings: false,
    support: true,
    push_notifications: true, // Renamed
    admin_management: false,
    fleet: true, // New
  },
  ride_manager: {
    dashboard: true,
    drivers: false,
    vehicles: false,
    rides: true,
    earnings: false,
    support: false,
    push_notifications: false, // Renamed
    admin_management: false,
    fleet: false, // New
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