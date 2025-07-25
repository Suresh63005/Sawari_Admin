"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Search, Eye, CheckCircle, XCircle, Ban, Unlock, Star, MapPin, Phone, Mail, Calendar, Languages, Car 
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import Swal from 'sweetalert2'; // Import SweetAlert2

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string;
  experience: number;
  languages: string[];
  status: 'active' | 'inactive' | 'blocked';
  is_approved: boolean;
  rating: number;
  ride_count: number;
  joined_date: string;
  license_expiry: string;
  license_front: string;
  license_back: string;
  emirates_doc_front: string;
  emirates_doc_back: string;
  license_verification_status?: string;
  emirates_verification_status?: string;
}

export default function DriverManagement() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [emiratesModalOpen, setEmiratesModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [driverIdFilter, setDriverIdFilter] = useState<string | null>(null);


 useEffect(() => {
  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/v1/admin/driver');
      const normalizedDrivers = response.data.map((driver: Driver) => ({
        ...driver,
        languages: Array.isArray(driver.languages) ? driver.languages : [],
      }));

      const storedDriverId = localStorage.getItem("selectedDriverId");

      if (storedDriverId) {
        setDriverIdFilter(storedDriverId); // store in state
        localStorage.removeItem("selectedDriverId"); // clear for next time
      }

      setDrivers(normalizedDrivers); // always store full list
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.message || 'Failed to fetch drivers',
      });
    } finally {
      setLoading(false);
    }
  };

  fetchDrivers();
}, []);



 const filteredDrivers = drivers.filter(driver => {
  const matchesDriverId = driverIdFilter ? driver.id === driverIdFilter : true;

  const matchesSearch =
    `${driver.first_name} ${driver.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone.includes(searchTerm);

  const matchesStatus = statusFilter === 'all' ||
    (statusFilter === 'pending' && !driver.is_approved) ||
    (statusFilter === 'approved' && driver.is_approved && driver.status === 'active') ||
    (statusFilter === 'blocked' && driver.status === 'blocked');

  return matchesDriverId && matchesSearch && matchesStatus;
});


  const verifiedBy = 'some-user-id'; // Replace with actual user ID from auth context

  const handleLicenseVerify = async (driverId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to verify the license?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, verify it!',
    });
    if (result.isConfirmed) {
      try {
        await apiClient.post(`/v1/admin/driver/${driverId}/verify-license`, { verified_by: verifiedBy });
        setDrivers(drivers.map(d => d.id === driverId ? { ...d, license_verification_status: 'verified' } : d));
        toast({ title: 'Success', description: 'License verified' });
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to verify license' });
      }
    }
  };

  const handleLicenseReject = async (driverId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to reject the license?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, reject it!',
      input: 'text',
      inputPlaceholder: 'Enter rejection reason',
      inputValidator: (value) => !value && 'You need to provide a reason!',
    });
    if (result.isConfirmed && result.value) {
      try {
        await apiClient.post(`/v1/admin/driver/${driverId}/reject-license`, { reason: result.value, verified_by: verifiedBy });
        setDrivers(drivers.map(d => d.id === driverId ? { ...d, license_verification_status: 'rejected' } : d));
        toast({ title: 'Success', description: 'License rejected' });
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to reject license' });
      }
    }
  };

  const handleEmiratesVerify = async (driverId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to verify the emirates ID?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, verify it!',
    });
    if (result.isConfirmed) {
      try {
        await apiClient.post(`/v1/admin/driver/${driverId}/verify-emirates`, { verified_by: verifiedBy });
        setDrivers(drivers.map(d => d.id === driverId ? { ...d, emirates_verification_status: 'verified' } : d));
        toast({ title: 'Success', description: 'Emirates ID verified' });
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to verify emirates ID' });
      }
    }
  };

  const handleEmiratesReject = async (driverId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to reject the emirates ID?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, reject it!',
      input: 'text',
      inputPlaceholder: 'Enter rejection reason',
      inputValidator: (value) => !value && 'You need to provide a reason!',
    });
    if (result.isConfirmed && result.value) {
      try {
        await apiClient.post(`/v1/admin/driver/${driverId}/reject-emirates`, { reason: result.value, verified_by: verifiedBy });
        setDrivers(drivers.map(d => d.id === driverId ? { ...d, emirates_verification_status: 'rejected' } : d));
        toast({ title: 'Success', description: 'Emirates ID rejected' });
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to reject emirates ID' });
      }
    }
  };

  const handleApprove = async (driverId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to approve this driver?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, approve!',
    });
    if (result.isConfirmed) {
      try {
        await apiClient.post(`/v1/admin/driver/${driverId}/approve`, { verified_by: verifiedBy });
        setDrivers(drivers.map(d => d.id === driverId ? { ...d, is_approved: true, status: 'active' } : d));
        toast({ title: 'Success', description: 'Driver approved' });
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to approve driver' });
      }
    }
  };

  const handleReject = async (driverId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to reject this driver?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, reject!',
      input: 'text',
      inputPlaceholder: 'Enter rejection reason',
      inputValidator: (value) => !value && 'You need to provide a reason!',
    });
    if (result.isConfirmed && result.value) {
      try {
        await apiClient.post(`/v1/admin/driver/${driverId}/reject`, { reason: result.value, verified_by: verifiedBy });
        setDrivers(drivers.map(d => d.id === driverId ? { ...d, is_approved: false } : d));
        toast({ title: 'Success', description: 'Driver rejected' });
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to reject driver' });
      }
    }
  };

  const handleBlock = async (driverId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to block this driver?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, block!',
    });
    if (result.isConfirmed) {
      try {
        await apiClient.post(`/v1/admin/driver/${driverId}/block`, { verified_by: verifiedBy });
        setDrivers(drivers.map(d => d.id === driverId ? { ...d, status: 'blocked' } : d));
        toast({ title: 'Success', description: 'Driver blocked' });
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to block driver' });
      }
    }
  };

  const handleUnblock = async (driverId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to unblock this driver?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, unblock!',
    });
    if (result.isConfirmed) {
      try {
        await apiClient.post(`/v1/admin/driver/${driverId}/unblock`, { verified_by: verifiedBy });
        setDrivers(drivers.map(d => d.id === driverId ? { ...d, status: 'active' } : d));
        toast({ title: 'Success', description: 'Driver unblocked' });
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to unblock driver' });
      }
    }
  };

  const getStatusBadge = (driver: Driver) => {
    if (!driver.is_approved) return <Badge variant="secondary">Pending</Badge>;
    if (driver.status === 'blocked') return <Badge variant="destructive">Blocked</Badge>;
    return <Badge variant="default">Active</Badge>;
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search drivers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')}>All</Button>
              <Button variant={statusFilter === 'pending' ? 'default' : 'outline'} onClick={() => setStatusFilter('pending')}>Pending</Button>
              <Button variant={statusFilter === 'approved' ? 'default' : 'outline'} onClick={() => setStatusFilter('approved')}>Approved</Button>
              <Button variant={statusFilter === 'blocked' ? 'default' : 'outline'} onClick={() => setStatusFilter('blocked')}>Blocked</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Drivers ({filteredDrivers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>{`${driver.first_name[0]}${driver.last_name[0]}`}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{`${driver.first_name} ${driver.last_name}`}</p>
                        <p className="text-sm text-muted-foreground">{driver.ride_count} rides</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{driver.phone}</p>
                      <p className="text-sm text-muted-foreground">{driver.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{driver.experience} years</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{driver.rating || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(driver)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedDriver(driver)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Driver Details</DialogTitle>
                            <DialogDescription>Complete information about {`${driver.first_name} ${driver.last_name}`}</DialogDescription>
                          </DialogHeader>
                          {selectedDriver && (
                            <Tabs defaultValue="profile" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="profile">Profile</TabsTrigger>
                                <TabsTrigger value="documents">Documents</TabsTrigger>
                                <TabsTrigger value="performance">Performance</TabsTrigger>
                              </TabsList>
                              <TabsContent value="profile" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Personal Information</label>
                                    <div className="space-y-1">
                                      <p className="flex items-center text-sm"><Calendar className="w-4 h-4 mr-2" />Born: {selectedDriver.dob}</p>
                                      <p className="flex items-center text-sm"><Phone className="w-4 h-4 mr-2" />{selectedDriver.phone}</p>
                                      <p className="flex items-center text-sm"><Mail className="w-4 h-4 mr-2" />{selectedDriver.email}</p>
                                      <p className="flex items-center text-sm"><Languages className="w-4 h-4 mr-2" />{Array.isArray(selectedDriver.languages) ? selectedDriver.languages.join(', ') : 'N/A'}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Professional Info</label>
                                    <div className="space-y-1">
                                      <p className="text-sm">Experience: {selectedDriver.experience} years</p>
                                      <p className="text-sm">License Expiry: {selectedDriver.license_expiry}</p>
                                      <p className="text-sm">Joined: {selectedDriver.joined_date}</p>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="documents" className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Required Documents</label>
                                    <div className="space-y-4">
                                      <Button variant="outline" size="sm" onClick={() => setLicenseModalOpen(true)}>
                                        View License Documents
                                      </Button>
                                      <Dialog open={licenseModalOpen} onOpenChange={setLicenseModalOpen}>
                                        <DialogContent className="max-w-4xl">
                                          <DialogHeader>
                                            <DialogTitle>License Documents</DialogTitle>
                                          </DialogHeader>
                                          <div className="flex space-x-4">
                                            <img 
                                              src={selectedDriver.license_front} 
                                              alt="License Front" 
                                              className="w-1/2 h-auto rounded cursor-pointer" 
                                              onClick={() => handleImageClick(selectedDriver.license_front)}
                                            />
                                            <img 
                                              src={selectedDriver.license_back} 
                                              alt="License Back" 
                                              className="w-1/2 h-auto rounded cursor-pointer" 
                                              onClick={() => handleImageClick(selectedDriver.license_back)}
                                            />
                                          </div>
                                          <div className="flex justify-end space-x-2 mt-4">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleLicenseVerify(selectedDriver.id)}
                                              className="text-green-600 hover:text-green-700"
                                            >
                                              Verify
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleLicenseReject(selectedDriver.id)}
                                              className="text-red-600 hover:text-red-700"
                                            >
                                              Reject
                                            </Button>
                                          </div>
                                        </DialogContent>
                                      </Dialog>

                                      <Button variant="outline" size="sm" onClick={() => setEmiratesModalOpen(true)}>
                                        View Emirates Documents
                                      </Button>
                                      <Dialog open={emiratesModalOpen} onOpenChange={setEmiratesModalOpen}>
                                        <DialogContent className="max-w-4xl">
                                          <DialogHeader>
                                            <DialogTitle>Emirates Documents</DialogTitle>
                                          </DialogHeader>
                                          <div className="flex space-x-4">
                                            <img 
                                              src={selectedDriver.emirates_doc_front} 
                                              alt="Emirates Front" 
                                              className="w-1/2 h-auto rounded cursor-pointer" 
                                              onClick={() => handleImageClick(selectedDriver.emirates_doc_front)}
                                            />
                                            <img 
                                              src={selectedDriver.emirates_doc_back} 
                                              alt="Emirates Back" 
                                              className="w-1/2 h-auto rounded cursor-pointer" 
                                              onClick={() => handleImageClick(selectedDriver.emirates_doc_back)}
                                            />
                                          </div>
                                          <div className="flex justify-end space-x-2 mt-4">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleEmiratesVerify(selectedDriver.id)}
                                              className="text-green-600 hover:text-green-700"
                                            >
                                              Verify
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleEmiratesReject(selectedDriver.id)}
                                              className="text-red-600 hover:text-red-700"
                                            >
                                              Reject
                                            </Button>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="performance" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Performance Stats</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-sm">Total Rides</span>
                                          <span className="text-sm font-medium">{selectedDriver.ride_count}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm">Rating</span>
                                          <span className="text-sm font-medium">{selectedDriver.rating}/5</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm">Completion Rate</span>
                                          <span className="text-sm font-medium">94%</span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Recent Activity</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Last ride: 2 hours ago</p>
                                        <p className="text-sm text-muted-foreground">Online time: 8h 30m today</p>
                                        <p className="text-sm text-muted-foreground">Earnings: AED 1,250 this week</p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                      {!driver.is_approved && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(driver.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(driver.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {driver.is_approved && (
                        <>
                          {driver.status === 'blocked' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnblock(driver.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Unlock className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBlock(driver.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    localStorage.setItem("selectedDriverId", driver.id);
    window.location.href = "/vehicles"; // or use router.push("/vehicles") in Next.js
  }}
>
  <Car className="w-4 h-4" />
</Button>

                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Enlarged Document</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img src={selectedImage} alt="Enlarged Document" className="w-full h-auto rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}