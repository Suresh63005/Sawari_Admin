"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Add useSearchParams
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from './ui/dialog';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Search, Eye, CheckCircle, XCircle, Ban, Unlock, Star, Calendar, Languages, Phone, Mail, CarFront, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import Loader from '@/components/ui/Loader';
import { debounce } from 'lodash';
import { format, parseISO } from 'date-fns';

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string;
  experience: number;
  languages: string[];
  status: 'active' | 'inactive' | 'blocked' | 'rejected';
  is_approved: boolean;
  rating: number;
  createdAt: string;
  license_expiry: string;
  license_front: string;
  license_back: string;
  emirates_doc_front: string;
  emirates_doc_back: string;
  license_verification_status?: 'pending' | 'verified' | 'rejected';
  emirates_verification_status?: 'pending' | 'verified' | 'rejected';
  completedRidesCount: number;
  completionRate: string;
  lastRideTime: string | null;
  totalEarnings: number;
}

export default function DriverManagement() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Add useSearchParams
  const [drivers, setDrivers] = useState<Driver[]>([]);
  console.log(drivers, "Drivers State");
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  console.log(selectedDriver, "Selected Driver");
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [emiratesModalOpen, setEmiratesModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [driverIdFilter, setDriverIdFilter] = useState<string | null>(null); // Add driverIdFilter state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: string;
    driverId: string;
    reason?: string;
  }>({ open: false, action: '', driverId: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  const debouncedFetchDrivers = useCallback(
    debounce(async (search: string, status: string, page: number, limit: number, driverId?: string | null) => {
      try {
        setSearchLoading(true);
        let response;
        if (driverId) {
          console.log("Fetching driver for driverId:", driverId);
          response = await apiClient.get(`/v1/admin/driver/${driverId}`);
          console.log("Driver Response:", response.data);
          const driver = response.data; // Assuming single driver response
          setDrivers(driver ? [driver] : []);
          setTotalItems(driver ? 1 : 0);
          if (!driver) {
            toast.error('No driver found for this ID');
          }
        } else {
          response = await apiClient.get('/v1/admin/driver', {
            params: {
              page,
              limit,
              search,
              status: status === 'all' ? undefined : status === 'pending' ? 'inactive' : status,
              is_approved: status === 'pending' ? false : status === 'approved' ? true : undefined,
            },
          });
          console.log(response.data, "Fetched Drivers");
          const { drivers: fetchedDrivers, total } = response.data;
          setDrivers(fetchedDrivers);
          setTotalItems(total);
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to fetch drivers', {
          style: {
            background: '#622A39',
            color: 'hsl(42, 51%, 91%)',
          },
        });
      } finally {
        setSearchLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    const fetchInitialDrivers = async () => {
      setLoading(true);
      try {
        const driverId = searchParams.get('driverId');
        if (driverId) {
          setDriverIdFilter(driverId);
          await debouncedFetchDrivers('', 'all', 1, 5, driverId);
          setItemsPerPage(5);
          setCurrentPage(1);
        } else {
          await debouncedFetchDrivers(searchTerm, statusFilter, currentPage, itemsPerPage);
        }
      } catch (err) {
        console.error('Error in initial driver fetch:', err);
        toast.error('Failed to initialize driver data', {
          style: {
            background: '#622A39',
            color: 'hsl(42, 51%, 91%)',
          },
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialDrivers();
  }, [searchParams]);

  useEffect(() => {
    if (driverIdFilter) {
      debouncedFetchDrivers('', 'all', 1, itemsPerPage, driverIdFilter);
    } else {
      debouncedFetchDrivers(searchTerm, statusFilter, currentPage, itemsPerPage);
    }
    if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchTerm, statusFilter, currentPage, itemsPerPage, driverIdFilter, debouncedFetchDrivers]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const verifiedBy = 'some-user-id'; // Replace with actual user ID from auth context

  const handleConfirmAction = async (providedReason?: string) => {
    const { action, driverId } = confirmDialog;
    const reason = providedReason?.trim();
    setIsDeleting(true);
    try {
      if (action === 'license-verify') {
        await apiClient.post(`/v1/admin/driver/${driverId}/verify-license`, { verified_by: verifiedBy });
        setDrivers(drivers.map(d => d.id === driverId ? { ...d, license_verification_status: 'verified' } : d));
        setSelectedDriver(prev => (prev && prev.id === driverId ? { ...prev, license_verification_status: 'verified' } : prev));
        toast.success('License verified');
      } else if (action === 'license-reject') {
        await apiClient.post(`/v1/admin/driver/${driverId}/reject-license`, { verified_by: verifiedBy });
        setDrivers(drivers.map(d => d.id === driverId ? { ...d, license_verification_status: 'rejected' } : d));
        setSelectedDriver(prev => (prev && prev.id === driverId ? { ...prev, license_verification_status: 'rejected' } : prev));
        toast.success('License rejected');
      } else if (action === 'emirates-verify') {
        await apiClient.post(`/v1/admin/driver/${driverId}/verify-emirates`, { verified_by: verifiedBy });
        setDrivers(drivers.map(d => d.id === driverId ? { ...d, emirates_verification_status: 'verified' } : d));
        setSelectedDriver(prev => (prev && prev.id === driverId ? { ...prev, emirates_verification_status: 'verified' } : prev));
        toast.success('Emirates ID verified');
      } else if (action === 'emirates-reject') {
        await apiClient.post(`/v1/admin/driver/${driverId}/reject-emirates`, { verified_by: verifiedBy });
        setDrivers(drivers.map(d => d.id === driverId ? { ...d, emirates_verification_status: 'rejected' } : d));
        setSelectedDriver(prev => (prev && prev.id === driverId ? { ...prev, emirates_verification_status: 'rejected' } : prev));
        toast.success('Emirates ID rejected');
      } else if (action === 'approve') {
        await apiClient.post(`/v1/admin/driver/${driverId}/approve`, { verified_by: verifiedBy });
        setDrivers(drivers.map(d => d.id === driverId ? { ...d, is_approved: true, status: 'active' } : d));
        setSelectedDriver(prev => (prev && prev.id === driverId ? { ...prev, is_approved: true, status: 'active' } : prev));
        toast.success('Driver approved');
      } else if (action === 'reject') {
        if (!reason) {
          toast.error('A reason is required to reject the driver');
          return;
        }
        await apiClient.post(`/v1/admin/driver/${driverId}/reject`, { reason, verified_by: verifiedBy });
        setDrivers(drivers.map(d => d.id === driverId ? { ...d, is_approved: false, status: 'rejected' } : d));
        setSelectedDriver(prev => (prev && prev.id === driverId ? { ...prev, is_approved: false, status: 'rejected' } : prev));
        toast.success('Driver rejected');
      } else if (action === 'block') {
        await apiClient.post(`/v1/admin/driver/${driverId}/block`, { verified_by: verifiedBy });
        setDrivers(drivers.map(d => d.id === driverId ? { ...d, status: 'blocked' } : d));
        setSelectedDriver(prev => (prev && prev.id === driverId ? { ...prev, status: 'blocked' } : prev));
        toast.success('Driver blocked');
      } else if (action === 'unblock') {
        await apiClient.post(`/v1/admin/driver/${driverId}/unblock`, { verified_by: verifiedBy });
        setDrivers(drivers.map(d => d.id === driverId ? { ...d, status: 'active' } : d));
        setSelectedDriver(prev => (prev && prev.id === driverId ? { ...prev, status: 'active' } : prev));
        toast.success('Driver unblocked');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${action.split('-')[0]} ${action.includes('license') ? 'license' : action.includes('emirates') ? 'emirates ID' : 'driver'}`);
    } finally {
      setConfirmDialog({ open: false, action: '', driverId: '' });
      setRejectReason('');
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (driver: Driver) => {
    if (driver.status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    if (driver.status === 'blocked') return <Badge variant="destructive">Blocked</Badge>;
    if (driver.status === 'inactive' && !driver.is_approved) return <Badge className='bg-red-600'>Pending</Badge>;
    if (driver.status === 'inactive' && driver.is_approved) return <Badge variant="outline">Inactive</Badge>;
    if (driver.status === 'active') return <Badge variant="default">Active</Badge>;
    return <Badge variant="outline">{driver.status}</Badge>;
  };

  const getDocStatusBadge = (status: 'pending' | 'verified' | 'rejected' | undefined) => {
    if (!status || status === 'pending') return <Badge variant="secondary">Pending</Badge>;
    if (status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    return <Badge variant="default">Verified</Badge>;
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  if (loading) {
    return <Loader />;
  }

 return (
  <div className="space-y-6">
    {driverIdFilter && (
      <Button
        variant="outline"
        onClick={() => {
          setDriverIdFilter(null);
          setCurrentPage(1);
          router.push('/drivers');
        }}
        className="mb-4"
      >
        Back to All Drivers
      </Button>
    )}
    <Card className="bg-card p-4 rounded-lg border border-primary">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            console.log('Form submission prevented');
          }}
          className="flex items-center space-x-4 flex-wrap"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-primary">Search Drivers</label>
            <div className="relative mt-1">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search drivers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1 block w-full p-2 border border-primary rounded-md bg-card"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              className={statusFilter === 'all' ? 'bg-primary text-card' : 'bg-card text-primary'}
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              className={statusFilter === 'pending' ? 'bg-primary text-card' : 'bg-card text-primary'}
              onClick={() => {
                setStatusFilter('pending');
                setCurrentPage(1);
              }}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === 'approved' ? 'default' : 'outline'}
              className={statusFilter === 'approved' ? 'bg-primary text-card' : 'bg-card text-primary'}
              onClick={() => {
                setStatusFilter('approved');
                setCurrentPage(1);
              }}
            >
              Approved
            </Button>
            <Button
              variant={statusFilter === 'blocked' ? 'default' : 'outline'}
              className={statusFilter === 'blocked' ? 'bg-primary text-card' : 'bg-card text-primary'}
              onClick={() => {
                setStatusFilter('blocked');
                setCurrentPage(1);
              }}
            >
              Blocked
            </Button>
            <Button
              variant={statusFilter === 'rejected' ? 'default' : 'outline'}
              className={statusFilter === 'rejected' ? 'bg-primary text-card' : 'bg-card text-primary'}
              onClick={() => {
                setStatusFilter('rejected');
                setCurrentPage(1);
              }}
            >
              Rejected
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Drivers ({totalItems})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S.NO</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {searchLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <Loader />
                </TableCell>
              </TableRow>
            )}
            {drivers.length === 0 && !searchLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No drivers found</TableCell>
              </TableRow>
            ) : (
              drivers.map((driver, index) => (
                <TableRow key={driver.id}>
                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>{`${(driver.first_name?.[0] || '').toUpperCase()}${(driver.last_name?.[0] || '').toUpperCase()}` || 'NA'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{`${driver.first_name} ${driver.last_name}`}</p>
                        <p className="text-sm text-muted-foreground">{driver.completedRidesCount || 0} rides completed</p>
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
                  <TableCell>{getStatusBadge(driver)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedDriver(driver)} title='View Details'>
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
                                <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-card">Profile</TabsTrigger>
                                <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-card">Documents</TabsTrigger>
                                <TabsTrigger value="performance" className="data-[state=active]:bg-primary data-[state=active]:text-card">Performance</TabsTrigger>
                              </TabsList>
                              <TabsContent value="profile" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Personal Information</label>
                                    <div className="space-y-1">
                                      <p className="flex items-center text-sm"><Calendar className="w-4 h-4 mr-2" /> Born: {selectedDriver.dob ? format(parseISO(selectedDriver.dob), 'dd/MM/yyyy') : 'N/A'}</p>
                                      <p className="flex items-center text-sm"><Phone className="w-4 h-4 mr-2" />{selectedDriver.phone || 'N/A'}</p>
                                      <p className="flex items-center text-sm"><Mail className="w-4 h-4 mr-2" />{selectedDriver.email || 'N/A'}</p>
                                      <p className="flex items-center text-sm"><Languages className="w-4 h-4 mr-2" />
                                        {selectedDriver.languages
                                          ? (typeof selectedDriver.languages === 'string' ? JSON.parse(selectedDriver.languages).join(', ') : selectedDriver.languages.join(', '))
                                          : 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Professional Info</label>
                                    <div className="space-y-1">
                                      <p className="text-sm">Experience: {selectedDriver.experience} years</p>
                                      <p className="text-sm">Joined: {selectedDriver.createdAt ? format(new Date(selectedDriver.createdAt), 'dd/MM/yy HH:mm') : 'N/A'}</p>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="documents" className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Required Documents</label>
                                    <div className="space-y-4">
                                      <div className="flex items-center space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => setLicenseModalOpen(true)}>
                                          View License Documents
                                        </Button>
                                        {getDocStatusBadge(selectedDriver.license_verification_status)}
                                      </div>
                                      <Dialog open={licenseModalOpen} onOpenChange={setLicenseModalOpen}>
                                        <DialogContent className="max-w-4xl">
                                          <DialogHeader>
                                            <DialogTitle>License Documents</DialogTitle>
                                          </DialogHeader>
                                          <div className="flex space-x-4">
                                            <img
                                              src={selectedDriver.license_front}
                                              alt="License Front"
                                              className="w-[400px] h-[250px] object-contain rounded cursor-pointer"
                                              onClick={() => handleImageClick(selectedDriver.license_front)}
                                            />
                                            <img
                                              src={selectedDriver.license_back}
                                              alt="License Back"
                                              className="w-[400px] h-[250px] object-contain rounded cursor-pointer"
                                              onClick={() => handleImageClick(selectedDriver.license_back)}
                                            />
                                          </div>
                                          {selectedDriver.license_verification_status === 'pending' && (
                                            <div className="flex justify-end space-x-2 mt-4">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setConfirmDialog({ open: true, action: 'license-verify', driverId: selectedDriver.id })}
                                                className="text-green-600 hover:text-green-700"
                                              >
                                                Verify
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setConfirmDialog({ open: true, action: 'license-reject', driverId: selectedDriver.id })}
                                                className="text-red-600 hover:text-red-700"
                                              >
                                                Reject
                                              </Button>
                                            </div>
                                          )}
                                        </DialogContent>
                                      </Dialog>
                                      <div className="flex items-center space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => setEmiratesModalOpen(true)}>
                                          View Emirates Documents
                                        </Button>
                                        {getDocStatusBadge(selectedDriver.emirates_verification_status)}
                                      </div>
                                      <Dialog open={emiratesModalOpen} onOpenChange={setEmiratesModalOpen}>
                                        <DialogContent className="max-w-4xl">
                                          <DialogHeader>
                                            <DialogTitle>Emirates Documents</DialogTitle>
                                          </DialogHeader>
                                          <div className="flex space-x-4">
                                            <img
                                              src={selectedDriver.emirates_doc_front}
                                              alt="Emirates Front"
                                              className="w-[400px] h-[250px] object-contain rounded cursor-pointer"
                                              onClick={() => handleImageClick(selectedDriver.emirates_doc_front)}
                                            />
                                            <img
                                              src={selectedDriver.emirates_doc_back}
                                              alt="Emirates Back"
                                              className="w-[400px] h-[250px] object-contain rounded cursor-pointer"
                                              onClick={() => handleImageClick(selectedDriver.emirates_doc_back)}
                                            />
                                          </div>
                                          {selectedDriver.emirates_verification_status === 'pending' && (
                                            <div className="flex justify-end space-x-2 mt-4">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setConfirmDialog({ open: true, action: 'emirates-verify', driverId: selectedDriver.id })}
                                                className="text-green-600 hover:text-green-700"
                                              >
                                                Verify
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setConfirmDialog({ open: true, action: 'emirates-reject', driverId: selectedDriver.id })}
                                                className="text-red-600 hover:text-red-700"
                                              >
                                                Reject
                                              </Button>
                                            </div>
                                          )}
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
                                      <CardTitle className="text-md">Performance Stats</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-sm">Total Completed Rides</span>
                                          <span className="text-sm font-medium">{selectedDriver.completedRidesCount || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm">Completion Rate</span>
                                          <span className="text-sm font-medium">{selectedDriver.completionRate || 0}%</span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-md">Recent Activity</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">
                                          Last Ride: {selectedDriver.lastRideTime ? format(parseISO(selectedDriver.lastRideTime), 'dd/MM/yy HH:mm') : 'N/A'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          Total Earnings: AED {selectedDriver?.totalEarnings != null ? selectedDriver.totalEarnings.toFixed(2) : '0.00'}
                                        </p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                      {(!driver.is_approved && driver.status !== 'rejected') && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (
                                driver.license_verification_status !== 'verified' ||
                                driver.emirates_verification_status !== 'verified'
                              ) {
                                toast.error('Please verify all documents before approving the driver');
                                return;
                              }
                              setConfirmDialog({ open: true, action: 'approve', driverId: driver.id });
                            }}
                            className="text-green-600 hover:text-green-700"
                            title='Approve Driver'
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDialog({ open: true, action: 'reject', driverId: driver.id })}
                            className="text-red-600 hover:text-red-700"
                            title='Reject Driver'
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
                              onClick={() => setConfirmDialog({ open: true, action: 'unblock', driverId: driver.id })}
                              className="text-green-600 hover:text-green-700"
                              title='Unblock Driver'
                            >
                              <Unlock className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmDialog({ open: true, action: 'block', driverId: driver.id })}
                              className="text-red-600 hover:text-red-700"
                              title='Block Driver'
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
                          router.push(`/vehicles?driverId=${driver.id}`);
                        }}
                        title='View Vehicles'
                      >
                        <CarFront className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!loading && totalItems > 0 && !driverIdFilter && (
          <div className="mt-4 flex flex-col md:flex-row justify-between items-center">
            <div className="mb-2 md:mb-0">
              <label className="mr-2 text-sm text-primary">Items per page:</label>
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
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                className="text-primary"
              >
                Previous
              </Button>
              {(() => {
                const renderPages = () => {
                  const visiblePages: number[] = [];
                  const showFirstEllipsis = currentPage > 5 && totalPages > 5;
                  const showLastEllipsis = currentPage <= 5 && totalPages > 5;

                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) {
                      visiblePages.push(i);
                    }
                  } else if (currentPage <= 5) {
                    for (let i = 1; i <= 5; i++) {
                      visiblePages.push(i);
                    }
                    if (totalPages > 5) {
                      visiblePages.push(totalPages);
                    }
                  } else {
                    visiblePages.push(1);
                    for (let i = totalPages - 4; i <= totalPages; i++) {
                      if (i > 1) {
                        visiblePages.push(i);
                      }
                    }
                  }

                  return (
                    <>
                      {showFirstEllipsis && (
                        <span className="px-2 py-1 text-sm text-muted-foreground">...</span>
                      )}
                      {visiblePages.map((page) => (
                        <Button
                          key={page}
                          onClick={() => paginate(page)}
                          variant={currentPage === page ? 'default' : 'outline'}
                          className={currentPage === page ? 'bg-primary text-card' : 'bg-card text-primary'}
                        >
                          {page}
                        </Button>
                      ))}
                      {showLastEllipsis && (
                        <span className="px-2 py-1 text-sm text-muted-foreground">...</span>
                      )}
                    </>
                  );
                };
                return renderPages();
              })()}
              <Button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                className="text-primary"
              >
                Next
              </Button>
            </div>
            <span className="text-sm text-primary mt-2 md:mt-0">
              Page {currentPage} of {totalPages} ({totalItems} total items)
            </span>
          </div>
        )}
      </CardContent>
    </Card>

    <Dialog open={confirmDialog.open} onOpenChange={() => setConfirmDialog({ open: false, action: '', driverId: '' })}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {confirmDialog.action.includes('verify') ? 'Confirm Verification' :
             confirmDialog.action.includes('reject') ? 'Confirm Rejection' :
             confirmDialog.action === 'approve' ? 'Confirm Approval' :
             confirmDialog.action === 'block' ? 'Confirm Block' : 'Confirm Unblock'}
          </DialogTitle>
          <DialogDescription>
            {confirmDialog.action.includes('verify')
              ? `Are you sure you want to verify the ${confirmDialog.action.includes('license') ? 'license' : 'emirates ID'}?`
              : confirmDialog.action.includes('reject') && confirmDialog.action === 'reject'
              ? 'Please provide a reason for rejecting the driver.'
              : confirmDialog.action.includes('reject')
              ? `Are you sure you want to reject the ${confirmDialog.action.includes('license') ? 'license' : 'emirates ID'}?`
              : confirmDialog.action === 'approve'
              ? 'Are you sure you want to approve this driver?'
              : confirmDialog.action === 'block'
              ? 'Are you sure you want to block this driver?'
              : 'Are you sure you want to unblock this driver?'}
          </DialogDescription>
        </DialogHeader>
        {confirmDialog.action === 'reject' && (
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Rejection Reason</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection"
              className="w-full bg-card"
            />
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setConfirmDialog({ open: false, action: '', driverId: '' })}
          >
            Cancel
          </Button>
          <Button
            className={
              confirmDialog.action === 'block'
                ? 'bg-primary text-card'
                : confirmDialog.action === 'approve' || confirmDialog.action === 'unblock'
                ? 'bg-primary text-card'
                : confirmDialog.action.includes('verify')
                ? 'bg-primary text-card'
                : confirmDialog.action.includes('reject')
                ? 'bg-primary text-card'
                : ''
            }
            onClick={() =>
              handleConfirmAction(
                confirmDialog.action === 'reject' ? rejectReason : undefined
              )
            }
            disabled={
              isDeleting ||
              (confirmDialog.action === 'reject' && !rejectReason)
            }
          >
            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {confirmDialog.action.includes('verify')
              ? 'Verify'
              : confirmDialog.action.includes('reject')
              ? 'Reject'
              : confirmDialog.action === 'approve'
              ? 'Approve'
              : confirmDialog.action === 'block'
              ? 'Block'
              : 'Unblock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enlarged Document</DialogTitle>
        </DialogHeader>
        {selectedImage && (
          <img src={selectedImage} alt="Enlarged Document" className="w-[50vw] h-[80vh] rounded" />
        )}
      </DialogContent>
    </Dialog>
  </div>
);
}