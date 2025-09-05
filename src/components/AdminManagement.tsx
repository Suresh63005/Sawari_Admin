"use client";

import React, { useState, useEffect,useCallback } from "react";
import { Ban, CarTaxiFront, EyeOff, Sheet, Pencil } from "lucide-react"; // 👈 import at top
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { debounce } from "lodash";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Plus,
  Eye,
  UserPlus,
  Shield,
  Users,
  ShieldHalf,
  Car,
  MapPin,
  Lock,
  Unlock,
  Search
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import {
  DEFAULT_PERMISSIONS,
  getAdminHierarchy,
  canCreateAdmin,
  Role
} from "./utils/permissions";
import toast from "react-hot-toast";
import Loader from "@/components/ui/Loader";

interface Admin {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: "active" | "inactive" | "blocked";
  created_by: string;
  created_at: string;
  permissions: {
    dashboard: boolean;
    drivers: boolean;
    vehicles: boolean;
    rides: boolean;
    earnings: boolean;
    support: boolean;
    push_notifications: boolean;
    admin_management: boolean;
    fleet: boolean;
  };
}

interface EditingAdmin extends Omit<Admin, 'name'> {
  first_name: string;
  last_name: string;
}

interface AdminManagementProps {
  currentUser: Admin;
}

export const AdminManagement: React.FC<AdminManagementProps> = ({
  currentUser
}) => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<EditingAdmin | null>(null);
  const [showBlockConfirm, setShowBlockConfirm] = useState<boolean>(false);
  const [blockAdminId, setBlockAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const [newAdmin, setNewAdmin] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "" as Role,
    password: ""
  });

 const fetchAdmins = async (search: string = "", page: number = 1, limit: number = 10, isSearch: boolean = false) => {
  try {
    if (isSearch) {
      setSearchLoading(true);
    } else {
      setLoading(true);
    }

    const response = await apiClient.get('/v1/admin/auth/admin-management', {
      params: { search, page, limit },
    });

    setAdmins(response.data.data || []);
    setTotalItems(response.data.pagination?.total || 0);
  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Failed to fetch admins');
  } finally {
    if (isSearch) {
      setSearchLoading(false);
    } else {
      setLoading(false);
    }
  }
};

const debouncedSearch = useCallback(
  debounce((query: string) => fetchAdmins(query, currentPage, itemsPerPage, true), 500),
  [currentPage, itemsPerPage]
);

useEffect(() => {
  fetchAdmins(searchQuery, currentPage, itemsPerPage);
}, [currentPage, itemsPerPage]);

useEffect(() => {
  if (searchQuery.trim() !== '') {
    debouncedSearch(searchQuery);
  } else {
    fetchAdmins('', currentPage, itemsPerPage);
  }
  return () => debouncedSearch.cancel();
}, [searchQuery, debouncedSearch]);

  const getAvailableRoles = () => {
    return getAdminHierarchy(currentUser?.role);
  };

  const handleCreateAdmin = async () => {
    if (
      !newAdmin.first_name ||
      !newAdmin.last_name ||
      !newAdmin.email ||
      !newAdmin.phone ||
      !newAdmin.role ||
      !newAdmin.password
    ) {
      toast.error("All fields are required", {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
      return;
    }
    if (!canCreateAdmin(currentUser.role, newAdmin.role)) {
      toast.error("Insufficient permissions to create this role", {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
      return;
    }

    try {
      const response = await apiClient.post(
        "/v1/admin/auth/admin-management",
        newAdmin
      );
      setAdmins([...admins, response.data]);
      setNewAdmin({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "" as Role,
        password: ""
      });
      setShowCreateForm(false);
      toast.success("Admin created successfully", {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
    } catch (err: any) {
      console.error("Create admin error:", err);
      toast.error(err.response?.data?.message || "Failed to create admin", {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
    }
  };

  const handleEditClick = (admin: Admin) => {
    const [first_name, last_name] = admin.name.split(' ');
    setEditingAdmin({
      ...admin,
      first_name,
      last_name: last_name || '',
    });
    setShowEditDialog(true);
  };

  const handleUpdateAdmin = async () => {
  if (!editingAdmin) return;

  try {
    // Fix: explicitly rename id so it's always a string
    const { id: adminId, first_name, last_name, email, phone, role, status } = editingAdmin;

    const payload = {
      first_name,
      last_name,
      email,
      phone,
      role,
      status,
    };

    console.log("Updating admin with id:", adminId, typeof adminId);

    await apiClient.put(`/v1/admin/auth/admin-management/${adminId}`, payload);
    fetchAdmins(searchQuery, currentPage, itemsPerPage);
    setShowEditDialog(false);
    toast.success("Admin updated successfully", {
      style: {
        background: "#622A39",
        color: "hsl(42, 51%, 91%)"
      }
    });
  } catch (err: any) {
    console.error("Update admin error:", err);
    toast.error(err.response?.data?.message || "Failed to update admin", {
      style: {
        background: "#622A39",
        color: "hsl(42, 51%, 91%)"
      }
    });
  }
};


  const handleUpdatePermissions = async (
    adminId: string,
    permissions: Admin["permissions"]
  ) => {
    if (adminId === currentUser.id) {
      toast.error("You cannot modify your own permissions", {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
      return;
    }
    try {
      console.log(`Updating permissions for admin ${adminId}:`, permissions);
      const response = await apiClient.put(
        `/v1/admin/auth/admin-management/${adminId}/permissions`,
        permissions
      );
      setAdmins((prev) =>
        prev.map((a) =>
          a.id === adminId
            ? { ...a, permissions: response.data.permissions }
            : a
        )
      );
      setSelectedAdmin((prev) =>
        prev && prev.id === adminId
          ? { ...prev, permissions: response.data.permissions }
          : prev
      );
      toast.success("Permissions updated successfully", {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
    } catch (err: any) {
      console.error("Update permissions error:", err);
      toast.error(
        err.response?.data?.message || "Failed to update permissions",
        {
          style: {
            background: "#622A39",
            color: "hsl(42, 51%, 91%)"
          }
        }
      );
    }
  };

  const handleStatusSwitch = async (adminId: string, checked: boolean) => {
    if (adminId === currentUser.id) {
      toast.error("You cannot modify your own status", {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
      return;
    }
    const admin = admins.find((a: Admin) => a.id === adminId);
    if (!admin) return;

    const newStatus = checked ? "active" : "inactive";

    try {
      console.log(`Switching status for admin ${adminId} to ${newStatus}`);
      await apiClient.put(`/v1/admin/auth/admin-management/${adminId}/status`, {
        status: newStatus
      });
      const response = await apiClient.get("/v1/admin/auth/admin-management", {
        params: { search: searchQuery, page: currentPage, limit: itemsPerPage }
      });
      setAdmins(response.data.data || []);
      setTotalItems(response.data.pagination?.total || 0);
      toast.success(`Admin status updated to ${newStatus}`, {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
    } catch (err: any) {
      console.error("Switch status error:", err);
      toast.error(err.response?.data?.message || "Failed to update status", {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
    }
  };

  const handleBlockUnblockAdmin = async (adminId: string) => {
    if (adminId === currentUser.id) {
      toast.error("You cannot block or unblock yourself", {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
      return;
    }
    const admin = admins.find((a: Admin) => a.id === adminId);
    if (!admin) return;

    const newStatus = admin.status === "blocked" ? "active" : "blocked";

    try {
      console.log(`Toggling block status for admin ${adminId} to ${newStatus}`);
      await apiClient.put(`/v1/admin/auth/admin-management/${adminId}/status`, {
        status: newStatus
      });
      const response = await apiClient.get("/v1/admin/auth/admin-management", {
        params: { search: searchQuery, page: currentPage, limit: itemsPerPage }
      });
      setAdmins(response.data.data || []);
      setTotalItems(response.data.pagination?.total || 0);
      toast.success(
        `Admin ${newStatus === "blocked" ? "blocked" : "unblocked"}`,
        {
          style: {
            background: "#622A39",
            color: "hsl(42, 51%, 91%)"
          }
        }
      );
    } catch (err: any) {
      console.error("Block/Unblock admin error:", err);
      toast.error(
        err.response?.data?.message || "Failed to toggle block status",
        {
          style: {
            background: "#622A39",
            color: "hsl(42, 51%, 91%)"
          }
        }
      );
    } finally {
      setShowBlockConfirm(false);
      setBlockAdminId(null);
    }
  };

  const getRoleLabel = (role: Role) => {
    const labels: Record<Role, string> = {
      super_admin: "Super Admin",
      admin: "Admin",
      executive_admin: "Executive Admin",
      ride_manager: "Ride Manager"
    };
    return labels[role];
  };

  const getRoleIcon = (role: Role) => {
    const icons: Record<Role, JSX.Element> = {
      super_admin: <Shield className="w-4 h-4" />,
      admin: <Users className="w-4 h-4" />,
      executive_admin: <ShieldHalf className="w-4 h-4" />,
      ride_manager: <CarTaxiFront className="w-4 h-4" />
    };
    return icons[role];
  };

  const getStatusBadge = (status: "active" | "inactive" | "blocked") => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "blocked":
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  if (loading) {
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
      <div className="mb-4">
        {getAvailableRoles().length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="w-full max-w-xs relative">
                <Input
                  placeholder="Search admins..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              <div>
                <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                  <DialogTrigger asChild>
                    <Button className="ml-4">
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
                          onChange={(e) =>
                            setNewAdmin({
                              ...newAdmin,
                              first_name: e.target.value
                            })
                          }
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                          id="last_name"
                          value={newAdmin.last_name}
                          onChange={(e) =>
                            setNewAdmin({
                              ...newAdmin,
                              last_name: e.target.value
                            })
                          }
                          placeholder="Enter last name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newAdmin.email}
                          onChange={(e) =>
                            setNewAdmin({ ...newAdmin, email: e.target.value })
                          }
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={newAdmin.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ""); // only numbers
                            const maxLength = 10; // 👈 change here if you want 9 or something else
                            if (value.length <= maxLength) {
                              setNewAdmin({ ...newAdmin, phone: value });
                            }
                          }}
                          placeholder="Enter phone number"
                        />
                      </div>

                      <div>
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={newAdmin.password}
                            onChange={(e) =>
                              setNewAdmin({
                                ...newAdmin,
                                password: e.target.value
                              })
                            }
                            placeholder="Enter password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Select
                          value={newAdmin.role}
                          onValueChange={(value: Role) =>
                            setNewAdmin({ ...newAdmin, role: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableRoles().map((role) => (
                              <SelectItem key={role} value={role}>
                                {getRoleLabel(role)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter className="mt-6">
                      <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateAdmin}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Admin List</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>
                                {admin.name.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span>{admin.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{admin.email}</TableCell>
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
            checked={admin.status === "active"}
            onCheckedChange={(checked) => handleStatusSwitch(admin.id, checked)}
            disabled={admin.id === currentUser.id || admin.status === "blocked"}
          />
        </div>
      </TableCell>
                        <TableCell>{admin.created_at}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(admin)}
                              disabled={admin.id === currentUser.id}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedAdmin(admin)}
                                  disabled={admin.id === currentUser.id || admin.status === "blocked"}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                {selectedAdmin && (
                                  <Tabs defaultValue="details" className="w-full">
                                    <TabsList>
                                      <TabsTrigger value="details">Details</TabsTrigger>
                                      <TabsTrigger value="permissions">Permissions</TabsTrigger>
                                    </TabsList>
                                    <TabsContent
                                      value="details"
                                      className="space-y-4"
                                    >
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <Label>Full Name</Label>
                                          <p className="text-sm">
                                            {selectedAdmin.name}
                                          </p>
                                        </div>
                                        <div>
                                          <Label>Email</Label>
                                          <p className="text-sm">
                                            {selectedAdmin.email}
                                          </p>
                                        </div>
                                        <div>
                                          <Label>Phone</Label>
                                          <p className="text-sm">
                                            {selectedAdmin.phone}
                                          </p>
                                        </div>
                                        <div>
                                          <Label>Role</Label>
                                          <p className="text-sm">
                                            {getRoleLabel(selectedAdmin.role)}
                                          </p>
                                        </div>
                                        <div>
                                          <Label>Status</Label>
                                          <div className="flex items-center space-x-2">
                                            <p className="text-sm">
                                              {selectedAdmin.status}
                                            </p>
                                            <Switch
                                              checked={
                                                selectedAdmin.status === "active"
                                              }
                                              onCheckedChange={(checked) =>
                                                handleStatusSwitch(
                                                  selectedAdmin.id,
                                                  checked
                                                )
                                              }
                                              disabled={
                                                selectedAdmin.id === currentUser.id ||
                                                selectedAdmin.status === "blocked"
                                              }
                                            />
                                          </div>
                                        </div>
                                        <div>
                                          <Label>Created</Label>
                                          <p className="text-sm">
                                            {selectedAdmin.created_at}
                                          </p>
                                        </div>
                                      </div>
                                    </TabsContent>
                                    <TabsContent value="permissions" className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Dashboard */}
    <div className="flex items-center justify-between">
      <div>
        <Label>Dashboard Access</Label>
        <p className="text-sm text-muted-foreground">
          View dashboard and analytics
        </p>
      </div>
      <Switch
        checked={selectedAdmin.permissions.dashboard}
        onCheckedChange={(checked) =>
          setSelectedAdmin((prev) =>
            prev
              ? {
                  ...prev,
                  permissions: { ...prev.permissions, dashboard: checked },
                }
              : null
          )
        }
        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === "blocked"}
      />
    </div>

    {/* Drivers */}
    <div className="flex items-center justify-between">
      <div>
        <Label>Driver Management</Label>
        <p className="text-sm text-muted-foreground">
          Manage driver approvals and status
        </p>
      </div>
      <Switch
        checked={selectedAdmin.permissions.drivers}
        onCheckedChange={(checked) =>
          setSelectedAdmin((prev) =>
            prev
              ? {
                  ...prev,
                  permissions: { ...prev.permissions, drivers: checked },
                }
              : null
          )
        }
        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === "blocked"}
      />
    </div>

    {/* Vehicles */}
    <div className="flex items-center justify-between">
      <div>
        <Label>Vehicle Management</Label>
        <p className="text-sm text-muted-foreground">
          Manage vehicle approvals and status
        </p>
      </div>
      <Switch
        checked={selectedAdmin.permissions.vehicles}
        onCheckedChange={(checked) =>
          setSelectedAdmin((prev) =>
            prev
              ? {
                  ...prev,
                  permissions: { ...prev.permissions, vehicles: checked },
                }
              : null
          )
        }
        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === "blocked"}
      />
    </div>

    {/* Rides */}
    <div className="flex items-center justify-between">
      <div>
        <Label>Ride Management</Label>
        <p className="text-sm text-muted-foreground">
          Manage ride bookings and assignments
        </p>
      </div>
      <Switch
        checked={selectedAdmin.permissions.rides}
        onCheckedChange={(checked) =>
          setSelectedAdmin((prev) =>
            prev
              ? {
                  ...prev,
                  permissions: { ...prev.permissions, rides: checked },
                }
              : null
          )
        }
        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === "blocked"}
      />
    </div>

    {/* Earnings */}
    <div className="flex items-center justify-between">
      <div>
        <Label>Earnings & Reports</Label>
        <p className="text-sm text-muted-foreground">
          View financial reports and earnings
        </p>
      </div>
      <Switch
        checked={selectedAdmin.permissions.earnings}
        onCheckedChange={(checked) =>
          setSelectedAdmin((prev) =>
            prev
              ? {
                  ...prev,
                  permissions: { ...prev.permissions, earnings: checked },
                }
              : null
          )
        }
        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === "blocked"}
      />
    </div>

    {/* Support */}
    <div className="flex items-center justify-between">
      <div>
        <Label>Support & Tickets</Label>
        <p className="text-sm text-muted-foreground">
          Handle support tickets and disputes
        </p>
      </div>
      <Switch
        checked={selectedAdmin.permissions.support}
        onCheckedChange={(checked) =>
          setSelectedAdmin((prev) =>
            prev
              ? {
                  ...prev,
                  permissions: { ...prev.permissions, support: checked },
                }
              : null
          )
        }
        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === "blocked"}
      />
    </div>

    {/* Push Notifications */}
    <div className="flex items-center justify-between">
      <div>
        <Label>Push Notifications</Label>
        <p className="text-sm text-muted-foreground">
          Send notifications and alerts
        </p>
      </div>
      <Switch
        checked={selectedAdmin.permissions.push_notifications}
        onCheckedChange={(checked) =>
          setSelectedAdmin((prev) =>
            prev
              ? {
                  ...prev,
                  permissions: { ...prev.permissions, push_notifications: checked },
                }
              : null
          )
        }
        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === "blocked"}
      />
    </div>

    {/* Fleet */}
    <div className="flex items-center justify-between">
      <div>
        <Label>Fleet Management</Label>
        <p className="text-sm text-muted-foreground">
          Manage cars, packages, subpackages, and pricing
        </p>
      </div>
      <Switch
        checked={selectedAdmin.permissions.fleet}
        onCheckedChange={(checked) =>
          setSelectedAdmin((prev) =>
            prev
              ? {
                  ...prev,
                  permissions: { ...prev.permissions, fleet: checked },
                }
              : null
          )
        }
        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === "blocked"}
      />
    </div>

    {/* Admin Management */}
    <div className="flex items-center justify-between">
      <div>
        <Label>Admin Management</Label>
        <p className="text-sm text-muted-foreground">
          Create and manage admin accounts
        </p>
      </div>
      <Switch
        checked={selectedAdmin.permissions.admin_management}
        onCheckedChange={(checked) =>
          setSelectedAdmin((prev) =>
            prev
              ? {
                  ...prev,
                  permissions: { ...prev.permissions, admin_management: checked },
                }
              : null
          )
        }
        disabled={selectedAdmin.id === currentUser.id || selectedAdmin.status === "blocked"}
      />
    </div>
  </div>

  {/* Footer Buttons */}
  <div className="flex justify-end space-x-2 mt-4">
    <Button
      className="bg-primary text-card"
      onClick={() => setSelectedAdmin(null)}
    >
      Cancel
    </Button>
    <Button
      className="bg-primary text-card"
      onClick={() => {
        if (selectedAdmin) {
          handleUpdatePermissions(selectedAdmin.id, selectedAdmin.permissions);
        }
      }}
    >
      Confirm
    </Button>
  </div>
</TabsContent>

                                  </Tabs>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Dialog
                              open={showBlockConfirm && blockAdminId === admin.id}
                              onOpenChange={(open) => {
                                if (!open) {
                                  setShowBlockConfirm(false);
                                  setBlockAdminId(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setBlockAdminId(admin.id);
                                    setShowBlockConfirm(true);
                                  }}
                                  disabled={admin.id === currentUser.id}
                                >
                                  {admin.status === "blocked" ? (
                                    <Unlock className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Ban className="w-4 h-4 text-red-500" />
                                  )}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Confirm{" "}
                                    {admin.status === "blocked" ? "Unblock" : "Block"}{" "}
                                    Admin
                                  </DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to{" "}
                                    {admin.status === "blocked" ? "unblock" : "block"}{" "}
                                    this admin? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setShowBlockConfirm(false);
                                      setBlockAdminId(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                  className="bg-primary text-card hover:bg-primary hover:text-card"
                                    variant="destructive"
                                    onClick={() => handleBlockUnblockAdmin(admin.id)}
                                  >
                                    Confirm
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {!loading && totalItems > 0 && (
                  <div className="mt-4 flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-2 md:mb-0">
                      <label className="mr-2 text-sm text-primary">
                        Items per page:
                      </label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="p-2 border border-primary rounded-md bg-card"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        className="text-primary"
                      >
                        Previous
                      </Button>
                      {Array.from(
                        { length: Math.ceil(totalItems / itemsPerPage) },
                        (_, i) => i + 1
                      ).map((page) => (
                        <Button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          variant={currentPage === page ? "default" : "outline"}
                          className={
                            currentPage === page
                              ? "bg-primary text-card"
                              : "bg-card text-primary"
                          }
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={
                          currentPage === Math.ceil(totalItems / itemsPerPage)
                        }
                        variant="outline"
                        className="text-primary"
                      >
                        Next
                      </Button>
                    </div>
                    <span className="text-sm text-primary mt-2 md:mt-0">
                      Page {currentPage} of {Math.ceil(totalItems / itemsPerPage)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
      {/* Edit Admin Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>
              Update admin details
            </DialogDescription>
          </DialogHeader>
          {editingAdmin && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={editingAdmin.first_name}
                  onChange={(e) =>
                    setEditingAdmin({
                      ...editingAdmin,
                      first_name: e.target.value,
                    })
                  }
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={editingAdmin.last_name}
                  onChange={(e) =>
                    setEditingAdmin({
                      ...editingAdmin,
                      last_name: e.target.value,
                    })
                  }
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingAdmin.email}
                  onChange={(e) =>
                    setEditingAdmin({ ...editingAdmin, email: e.target.value })
                  }
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={editingAdmin.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    const maxLength = 10;
                    if (value.length <= maxLength) {
                      setEditingAdmin({ ...editingAdmin, phone: value });
                    }
                  }}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  value={editingAdmin.role}
                  onValueChange={(value: Role) =>
                    setEditingAdmin({ ...editingAdmin, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRoles().map((role) => (
                      <SelectItem key={role} value={role}>
                        {getRoleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={editingAdmin.status}
                  onValueChange={(value: "active" | "inactive" | "blocked") =>
                    setEditingAdmin({ ...editingAdmin, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAdmin}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export type { Admin };