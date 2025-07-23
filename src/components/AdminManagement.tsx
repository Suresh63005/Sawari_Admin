'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DEFAULT_PERMISSIONS, getAdminHierarchy, canCreateAdmin, Role } from './utils/permissions';
import { 
  Plus, 
  Eye, 
  UserPlus, 
  Lock, 
  Unlock, 
  Shield, 
  Users, 
  Car, 
  Building2 
} from 'lucide-react';

interface Admin {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: 'active' | 'inactive';
  created_by: number;
  created_at: string;
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

interface AdminManagementProps {
  currentUser: Admin;
}

export const AdminManagement: React.FC<AdminManagementProps> = ({ currentUser }) => {
  const [admins, setAdmins] = useState<Admin[]>([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@sawari.com',
      phone: '+971 50 123 4567',
      role: 'super_admin',
      status: 'active',
      created_by: 0,
      created_at: '2024-01-01',
      permissions: DEFAULT_PERMISSIONS.super_admin
    },
    {
      id: 2,
      name: 'Sarah Manager',
      email: 'sarah@sawari.com',
      phone: '+971 55 234 5678',
      role: 'admin',
      status: 'active',
      created_by: 1,
      created_at: '2024-02-15',
      permissions: DEFAULT_PERMISSIONS.admin
    }
  ]);

  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    phone: '',
    role: '' as Role,
    permissions: DEFAULT_PERMISSIONS.admin
  });

  const getAvailableRoles = () => {
    return getAdminHierarchy(currentUser?.role);
  };

  const handleCreateAdmin = () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.phone || !newAdmin.role) return;
    if (!canCreateAdmin(currentUser.role, newAdmin.role)) return;

    const admin: Admin = {
      id: Date.now(),
      name: newAdmin.name,
      email: newAdmin.email,
      phone: newAdmin.phone,
      role: newAdmin.role,
      status: 'active',
      created_by: currentUser.id,
      created_at: new Date().toISOString().split('T')[0],
      permissions: DEFAULT_PERMISSIONS[newAdmin.role]
    };

    setAdmins([...admins, admin]);
    setNewAdmin({ name: '', email: '', phone: '', role: '' as Role, permissions: DEFAULT_PERMISSIONS.admin });
    setShowCreateForm(false);
  };

  const handleUpdatePermissions = (adminId: number, permissions: Admin['permissions']) => {
    setAdmins(admins.map(admin => 
      admin.id === adminId ? { ...admin, permissions } : admin
    ));
  };

  const handleToggleStatus = (adminId: number) => {
    setAdmins(admins.map(admin => 
      admin.id === adminId 
        ? { ...admin, status: admin.status === 'active' ? 'inactive' : 'active' }
        : admin
    ));
  };

  const getRoleLabel = (role: Role) => {
    const labels: Record<Role, string> = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      executive_admin: 'Executive Admin',
      hotel_admin: 'Hotel Admin'
    };
    return labels[role];
  };

  const getRoleIcon = (role: Role) => {
    const icons: Record<Role, JSX.Element> = {
      super_admin: <Shield className="w-4 h-4" />,
      admin: <Users className="w-4 h-4" />,
      executive_admin: <Car className="w-4 h-4" />,
      hotel_admin: <Building2 className="w-4 h-4" />
    };
    return icons[role];
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? 
      <Badge variant="default">Active</Badge> : 
      <Badge variant="secondary">Inactive</Badge>;
  };

  const filteredAdmins = admins.filter(admin => {
    if (currentUser && currentUser?.role === 'super_admin') return true;
    return admin.created_by === currentUser?.id || admin.id === currentUser?.id;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Admin Management</h2>
          <p className="text-muted-foreground">Manage admin accounts and permissions</p>
        </div>
        {getAvailableRoles().length > 0 && (
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Create Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Admin</DialogTitle>
                <DialogDescription>
                  Add a new admin account with specified permissions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newAdmin.phone}
                    onChange={(e) => setNewAdmin({...newAdmin, phone: e.target.value})}
                    placeholder="+971 XX XXX XXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={newAdmin.role} onValueChange={(value: Role) => {
                    setNewAdmin({
                      ...newAdmin, 
                      role: value,
                      permissions: DEFAULT_PERMISSIONS[value]
                    });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableRoles().map(role => (
                        <SelectItem key={role} value={role}>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(role)}
                            {getRoleLabel(role)}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAdmin} disabled={!canCreateAdmin(currentUser.role, newAdmin.role)}>
                    Create Admin
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Admin List */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Accounts ({filteredAdmins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>{admin.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{admin.name}</p>
                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                        <p className="text-sm text-muted-foreground">{admin.phone}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(admin.role)}
                      <span>{getRoleLabel(admin.role)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(admin.status)}</TableCell>
                  <TableCell>{admin.created_at}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedAdmin(admin)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Admin Details & Permissions</DialogTitle>
                            <DialogDescription>
                              Manage {admin.name}&apos;s account and permissions
                            </DialogDescription>
                          </DialogHeader>
                          {selectedAdmin && (
                            <Tabs defaultValue="details" className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                              </TabsList>
                              <TabsContent value="details" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Full Name</Label>
                                    <p className="text-sm">{selectedAdmin.name}</p>
                                  </div>
                                  <div>
                                    <Label>Email</Label>
                                    <p className="text-sm">{selectedAdmin.email}</p>
                                  </div>
                                  <div>
                                    <Label>Phone</Label>
                                    <p className="text-sm">{selectedAdmin.phone}</p>
                                  </div>
                                  <div>
                                    <Label>Role</Label>
                                    <p className="text-sm">{getRoleLabel(selectedAdmin.role)}</p>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <p className="text-sm">{selectedAdmin.status}</p>
                                  </div>
                                  <div>
                                    <Label>Created</Label>
                                    <p className="text-sm">{selectedAdmin.created_at}</p>
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="permissions" className="space-y-4">
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <Label>Dashboard Access</Label>
                                      <p className="text-sm text-muted-foreground">View dashboard and analytics</p>
                                    </div>
                                    <Switch
                                      checked={selectedAdmin.permissions.dashboard}
                                      onCheckedChange={(checked) => {
                                        const newPermissions = { ...selectedAdmin.permissions, dashboard: checked };
                                        setSelectedAdmin({ ...selectedAdmin, permissions: newPermissions });
                                        handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <Label>Driver Management</Label>
                                      <p className="text-sm text-muted-foreground">Manage driver approvals and status</p>
                                    </div>
                                    <Switch
                                      checked={selectedAdmin.permissions.drivers}
                                      onCheckedChange={(checked) => {
                                        const newPermissions = { ...selectedAdmin.permissions, drivers: checked };
                                        setSelectedAdmin({ ...selectedAdmin, permissions: newPermissions });
                                        handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <Label>Vehicle Management</Label>
                                      <p className="text-sm text-muted-foreground">Manage vehicle approvals and status</p>
                                    </div>
                                    <Switch
                                      checked={selectedAdmin.permissions.vehicles}
                                      onCheckedChange={(checked) => {
                                        const newPermissions = { ...selectedAdmin.permissions, vehicles: checked };
                                        setSelectedAdmin({ ...selectedAdmin, permissions: newPermissions });
                                        handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <Label>Ride Management</Label>
                                      <p className="text-sm text-muted-foreground">Manage ride bookings and assignments</p>
                                    </div>
                                    <Switch
                                      checked={selectedAdmin.permissions.rides}
                                      onCheckedChange={(checked) => {
                                        const newPermissions = { ...selectedAdmin.permissions, rides: checked };
                                        setSelectedAdmin({ ...selectedAdmin, permissions: newPermissions });
                                        handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <Label>Hotel Management</Label>
                                      <p className="text-sm text-muted-foreground">Manage hotel partnerships</p>
                                    </div>
                                    <Switch
                                      checked={selectedAdmin.permissions.hotels}
                                      onCheckedChange={(checked) => {
                                        const newPermissions = { ...selectedAdmin.permissions, hotels: checked };
                                        setSelectedAdmin({ ...selectedAdmin, permissions: newPermissions });
                                        handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <Label>Earnings & Reports</Label>
                                      <p className="text-sm text-muted-foreground">View financial reports and earnings</p>
                                    </div>
                                    <Switch
                                      checked={selectedAdmin.permissions.earnings}
                                      onCheckedChange={(checked) => {
                                        const newPermissions = { ...selectedAdmin.permissions, earnings: checked };
                                        setSelectedAdmin({ ...selectedAdmin, permissions: newPermissions });
                                        handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <Label>Support & Tickets</Label>
                                      <p className="text-sm text-muted-foreground">Handle support tickets and disputes</p>
                                    </div>
                                    <Switch
                                      checked={selectedAdmin.permissions.support}
                                      onCheckedChange={(checked) => {
                                        const newPermissions = { ...selectedAdmin.permissions, support: checked };
                                        setSelectedAdmin({ ...selectedAdmin, permissions: newPermissions });
                                        handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <Label>Notifications</Label>
                                      <p className="text-sm text-muted-foreground">Send notifications and alerts</p>
                                    </div>
                                    <Switch
                                      checked={selectedAdmin.permissions.notifications}
                                      onCheckedChange={(checked) => {
                                        const newPermissions = { ...selectedAdmin.permissions, notifications: checked };
                                        setSelectedAdmin({ ...selectedAdmin, permissions: newPermissions });
                                        handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <Label>Admin Management</Label>
                                      <p className="text-sm text-muted-foreground">Create and manage admin accounts</p>
                                    </div>
                                    <Switch
                                      checked={selectedAdmin.permissions.admin_management}
                                      onCheckedChange={(checked) => {
                                        const newPermissions = { ...selectedAdmin.permissions, admin_management: checked };
                                        setSelectedAdmin({ ...selectedAdmin, permissions: newPermissions });
                                        handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                      }}
                                    />
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {admin.id !== currentUser.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(admin.id)}
                        >
                          {admin.status === 'active' ? 
                            <Lock className="w-4 h-4" /> : 
                            <Unlock className="w-4 h-4" />
                          }
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
export type { Admin }; // add this at the bottom of the file
