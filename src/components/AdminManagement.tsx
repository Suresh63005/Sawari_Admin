'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
import { Plus, Eye, UserPlus, Shield, Users, Car, MapPin, Lock, Unlock } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { DEFAULT_PERMISSIONS, getAdminHierarchy, canCreateAdmin, Role } from './utils/permissions';
import { useToast } from './ui/use-toast';
import Loader from '@/components/ui/Loader';
interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: 'active' | 'inactive' | 'blocked';
  created_by: string;
  created_at: string;
  permissions: {
    dashboard: boolean;
    drivers: boolean;
    vehicles: boolean;
    rides: boolean;
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
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newAdmin, setNewAdmin] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '' as Role,
    password: '',
  });

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/v1/admin/auth/admin-management');
        console.log('Fetched admins:', response.data); // Debug log
        setAdmins(response.data);
      } catch (err: any) {
        console.error('Fetch admins error:', err);
        setError(err.response?.data?.message || 'Failed to fetch admins');
        toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to fetch admins' });
      } finally {
        setLoading(false);
      }
    };
    fetchAdmins();
  }, []);

  const getAvailableRoles = () => {
    return getAdminHierarchy(currentUser?.role);
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.first_name || !newAdmin.last_name || !newAdmin.email || !newAdmin.phone || !newAdmin.role || !newAdmin.password) {
      toast({ variant: 'destructive', title: 'Error', description: 'All fields are required' });
      return;
    }
    if (!canCreateAdmin(currentUser.role, newAdmin.role)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Insufficient permissions to create this role' });
      return;
    }

    try {
      const response = await apiClient.post('/v1/admin/auth/admin-management', newAdmin);
      setAdmins([...admins, response.data]);
      setNewAdmin({ first_name: '', last_name: '', email: '', phone: '', role: '' as Role, password: '' });
      setShowCreateForm(false);
      toast({ title: 'Success', description: 'Admin created successfully' });
    } catch (err: any) {
      console.error('Create admin error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to create admin' });
    }
  };

  const handleUpdatePermissions = async (adminId: string, permissions: Admin['permissions']) => {
    if (adminId === currentUser.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'You cannot modify your own permissions' });
      return;
    }
    try {
      console.log(`Updating permissions for admin ${adminId}:`, permissions); // Debug log
      const response = await apiClient.put(`/v1/admin/auth/admin-management/${adminId}/permissions`, permissions);
      // Update local state optimistically
      setAdmins(prev =>
        prev.map(a => (a.id === adminId ? { ...a, permissions: response.data.permissions } : a))
      );
      setSelectedAdmin(prev => (prev && prev.id === adminId ? { ...prev, permissions: response.data.permissions } : prev));
      toast({ title: 'Success', description: 'Permissions updated successfully' });
    } catch (err: any) {
      console.error('Update permissions error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to update permissions' });
    }
  };

  const handleStatusSwitch = async (adminId: string, checked: boolean) => {
    if (adminId === currentUser.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'You cannot modify your own status' });
      return;
    }
    const admin = admins.find((a: Admin) => a.id === adminId);
    if (!admin) return;

    const newStatus = checked ? 'active' : 'inactive'; // Only active/inactive toggle

    try {
      console.log(`Switching status for admin ${adminId} to ${newStatus}`); // Debug log
      await apiClient.put(`/v1/admin/auth/admin-management/${adminId}/status`, { status: newStatus });
      // Re-fetch admins to ensure sync
      const response = await apiClient.get('/v1/admin/auth/admin-management');
      setAdmins(response.data);
      toast({ title: 'Success', description: `Admin status updated to ${newStatus}` });
    } catch (err: any) {
      console.error('Switch status error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to update status' });
    }
  };

  const handleBlockUnblockAdmin = async (adminId: string) => {
    if (adminId === currentUser.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'You cannot block or unblock yourself' });
      return;
    }
    const admin = admins.find((a: Admin) => a.id === adminId);
    if (!admin) return;

    const newStatus = admin.status === 'blocked' ? 'active' : 'blocked'; // Toggle between blocked and active

    try {
      console.log(`Toggling block status for admin ${adminId} to ${newStatus}`); // Debug log
      await apiClient.put(`/v1/admin/auth/admin-management/${adminId}/status`, { status: newStatus });
      // Re-fetch admins to ensure sync
      const response = await apiClient.get('/v1/admin/auth/admin-management');
      setAdmins(response.data);
      toast({ title: 'Success', description: `Admin ${newStatus === 'blocked' ? 'blocked' : 'unblocked'}` });
    } catch (err: any) {
      console.error('Block/Unblock admin error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to toggle block status' });
    }
  };

  const getRoleLabel = (role: Role) => {
    const labels: Record<Role, string> = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      executive_admin: 'Executive Admin',
      ride_manager: 'Ride Manager',
    };
    return labels[role];
  };

  const getRoleIcon = (role: Role) => {
    const icons: Record<Role, JSX.Element> = {
      super_admin: <Shield className="w-4 h-4" />,
      admin: <Users className="w-4 h-4" />,
      executive_admin: <Car className="w-4 h-4" />,
      ride_manager: <MapPin className="w-4 h-4" />,
    };
    return icons[role];
  };

  const getStatusBadge = (status: 'active' | 'inactive' | 'blocked') => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  if (loading ) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-red-600 text-xl font-semibold">Error</h2>
          <p className="text-gray-700 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {/* <div>
          <h2 className="text-2xl font-bold">Admin Management</h2>
          <p className="text-muted-foreground">Manage admin accounts and permissions</p>
        </div> */}
        {getAvailableRoles().length > 0 && (
  <>
    <div className="flex justify-end mb-4">
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
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={newAdmin.first_name}
                onChange={(e) => setNewAdmin({ ...newAdmin, first_name: e.target.value })}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={newAdmin.last_name}
                onChange={(e) => setNewAdmin({ ...newAdmin, last_name: e.target.value })}
                placeholder="Enter last name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={newAdmin.phone}
                onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                placeholder="+971 XX XXX XXXX"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={newAdmin.role}
                onValueChange={(value: Role) => setNewAdmin({ ...newAdmin, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map((role) => (
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
              <Button
                onClick={handleCreateAdmin}
                disabled={!canCreateAdmin(currentUser.role, newAdmin.role)}
              >
                Create Admin
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  </>
)}

      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Accounts ({admins.length})</CardTitle>
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
              {admins.map((admin: Admin) => (
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
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(admin.status)}
                      <Switch
                        checked={admin.status === 'active'}
                        onCheckedChange={(checked) => handleStatusSwitch(admin.id, checked)}
                        disabled={admin.id === currentUser.id || admin.status === 'blocked'}
                      />
                    </div>
                  </TableCell>
                  <TableCell>{admin.created_at}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await apiClient.get('/v1/admin/auth/admin-management');
                                const freshAdmin = response.data.find((a: Admin) => a.id === admin.id);
                                if (freshAdmin) {
                                  setSelectedAdmin(freshAdmin);
                                } else {
                                  setSelectedAdmin(admin); // Fallback
                                }
                              } catch (err) {
                                console.error('Failed to fetch admin:', err);
                                setSelectedAdmin(admin); // Fallback
                              }
                            }}
                          >
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
                                    <div className="flex items-center space-x-2">
                                      <p className="text-sm">{selectedAdmin.status}</p>
                                      <Switch
                                        checked={selectedAdmin.status === 'active'}
                                        onCheckedChange={(checked) => handleStatusSwitch(selectedAdmin.id, checked)}
                                        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === 'blocked'}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Created</Label>
                                    <p className="text-sm">{selectedAdmin.created_at}</p>
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="permissions" className="space-y-4">
                                <div className="space-y-4">
                                  {currentUser.role === 'super_admin' || currentUser.permissions.dashboard ? (
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <Label>Dashboard Access</Label>
                                        <p className="text-sm text-muted-foreground">View dashboard and analytics</p>
                                      </div>
                                      <Switch
                                        checked={selectedAdmin.permissions.dashboard}
                                        onCheckedChange={(checked) => {
                                          const newPermissions = { ...selectedAdmin.permissions, dashboard: checked };
                                          console.log('Updating dashboard permission:', newPermissions); // Debug log
                                          setSelectedAdmin(prev => prev ? { ...prev, permissions: newPermissions } : null);
                                          handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                        }}
                                        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === 'blocked'}
                                      />
                                    </div>
                                  ) : null}
                                  {currentUser.role === 'super_admin' || currentUser.permissions.drivers ? (
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <Label>Driver Management</Label>
                                        <p className="text-sm text-muted-foreground">Manage driver approvals and status</p>
                                      </div>
                                      <Switch
                                        checked={selectedAdmin.permissions.drivers}
                                        onCheckedChange={(checked) => {
                                          const newPermissions = { ...selectedAdmin.permissions, drivers: checked };
                                          console.log('Updating drivers permission:', newPermissions); // Debug log
                                          setSelectedAdmin(prev => prev ? { ...prev, permissions: newPermissions } : null);
                                          handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                        }}
                                        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === 'blocked'}
                                      />
                                    </div>
                                  ) : null}
                                  {currentUser.role === 'super_admin' || currentUser.permissions.vehicles ? (
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <Label>Vehicle Management</Label>
                                        <p className="text-sm text-muted-foreground">Manage vehicle approvals and status</p>
                                      </div>
                                      <Switch
                                        checked={selectedAdmin.permissions.vehicles}
                                        onCheckedChange={(checked) => {
                                          const newPermissions = { ...selectedAdmin.permissions, vehicles: checked };
                                          console.log('Updating vehicles permission:', newPermissions); // Debug log
                                          setSelectedAdmin(prev => prev ? { ...prev, permissions: newPermissions } : null);
                                          handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                        }}
                                        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === 'blocked'}
                                      />
                                    </div>
                                  ) : null}
                                  {currentUser.role === 'super_admin' || currentUser.permissions.rides ? (
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <Label>Ride Management</Label>
                                        <p className="text-sm text-muted-foreground">Manage ride bookings and assignments</p>
                                      </div>
                                      <Switch
                                        checked={selectedAdmin.permissions.rides}
                                        onCheckedChange={(checked) => {
                                          const newPermissions = { ...selectedAdmin.permissions, rides: checked };
                                          console.log('Updating rides permission:', newPermissions); // Debug log
                                          setSelectedAdmin(prev => prev ? { ...prev, permissions: newPermissions } : null);
                                          handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                        }}
                                        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === 'blocked'}
                                      />
                                    </div>
                                  ) : null}
                                  {currentUser.role === 'super_admin' || currentUser.permissions.earnings ? (
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <Label>Earnings & Reports</Label>
                                        <p className="text-sm text-muted-foreground">View financial reports and earnings</p>
                                      </div>
                                      <Switch
                                        checked={selectedAdmin.permissions.earnings}
                                        onCheckedChange={(checked) => {
                                          const newPermissions = { ...selectedAdmin.permissions, earnings: checked };
                                          console.log('Updating earnings permission:', newPermissions); // Debug log
                                          setSelectedAdmin(prev => prev ? { ...prev, permissions: newPermissions } : null);
                                          handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                        }}
                                        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === 'blocked'}
                                      />
                                    </div>
                                  ) : null}
                                  {currentUser.role === 'super_admin' || currentUser.permissions.support ? (
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <Label>Support & Tickets</Label>
                                        <p className="text-sm text-muted-foreground">Handle support tickets and disputes</p>
                                      </div>
                                      <Switch
                                        checked={selectedAdmin.permissions.support}
                                        onCheckedChange={(checked) => {
                                          const newPermissions = { ...selectedAdmin.permissions, support: checked };
                                          console.log('Updating support permission:', newPermissions); // Debug log
                                          setSelectedAdmin(prev => prev ? { ...prev, permissions: newPermissions } : null);
                                          handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                        }}
                                        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === 'blocked'}
                                      />
                                    </div>
                                  ) : null}
                                  {currentUser.role === 'super_admin' || currentUser.permissions.notifications ? (
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <Label>Notifications</Label>
                                        <p className="text-sm text-muted-foreground">Send notifications and alerts</p>
                                      </div>
                                      <Switch
                                        checked={selectedAdmin.permissions.notifications}
                                        onCheckedChange={(checked) => {
                                          const newPermissions = { ...selectedAdmin.permissions, notifications: checked };
                                          console.log('Updating notifications permission:', newPermissions); // Debug log
                                          setSelectedAdmin(prev => prev ? { ...prev, permissions: newPermissions } : null);
                                          handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                        }}
                                        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === 'blocked'}
                                      />
                                    </div>
                                  ) : null}
                                  {currentUser.role === 'super_admin' || currentUser.permissions.admin_management ? (
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <Label>Admin Management</Label>
                                        <p className="text-sm text-muted-foreground">Create and manage admin accounts</p>
                                      </div>
                                      <Switch
                                        checked={selectedAdmin.permissions.admin_management}
                                        onCheckedChange={(checked) => {
                                          const newPermissions = { ...selectedAdmin.permissions, admin_management: checked };
                                          console.log('Updating admin_management permission:', newPermissions); // Debug log
                                          setSelectedAdmin(prev => prev ? { ...prev, permissions: newPermissions } : null);
                                          handleUpdatePermissions(selectedAdmin.id, newPermissions);
                                        }}
                                        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === 'blocked'}
                                      />
                                    </div>
                                  ) : null}
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBlockUnblockAdmin(admin.id)}
                        disabled={admin.id === currentUser.id}
                      >
                        {admin.status === 'blocked' ? (
                          <Unlock className="w-4 h-4 text-green-500"  />
                        ) : (
                          <Lock className="w-4 h-4 text-red-500"  />
                        )}
                      </Button>
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

export type { Admin };