"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Eye, CheckCircle, XCircle, User, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast'; // Use react-hot-toast
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Loader from '@/components/ui/Loader';
import { debounce } from 'lodash';

interface VerifiedBy {
  id: string;
  name: string;
  role: string;
}

interface Vehicle {
  id: string;
  driver_id: string;
  car_model: string;
  car_brand: string;
  license_plate: string;
  car_photos: string[];
  rc_doc: string;
  insurance_doc: string;
  rc_doc_status: 'pending' | 'verified' | 'rejected';
  insurance_doc_status: 'pending' | 'verified' | 'rejected';
  is_approved: boolean;
  status: 'active' | 'inactive' | 'rejected';
  verified_by?: VerifiedBy | null;
}

export default function VehicleApproval() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [rcModalOpen, setRcModalOpen] = useState(false);
  const [insuranceModalOpen, setInsuranceModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [driverIdFilter, setDriverIdFilter] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: string;
    vehicleId: string;
    reason?: string;
  }>({ open: false, action: '', vehicleId: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  const debouncedFetchVehicles = useCallback(
    debounce(async (search: string, status: string, page: number, limit: number, driverId?: string | null) => {
      try {
        setSearchLoading(true);
        let response;
        if (driverId) {
          console.log("Fetching vehicles for driverId:", driverId);
          response = await apiClient.get(`/v1/admin/vehicles/${driverId}`);
          console.log("Driver Vehicles Response:", response.data);
          const data = (response.data.data || []).map((vehicle: any) => ({
            ...vehicle,
            car_photos: Array.isArray(vehicle.car_photos) ? vehicle.car_photos : [],
            rc_doc_status: vehicle.rc_doc_status || "pending",
            insurance_doc_status: vehicle.insurance_doc_status || "pending",
            verified_by: vehicle.verified_by || null,
          }));
          setVehicles(data);
          setTotalItems(data.length);
          if (data.length === 0) {
            toast.error('No vehicles found for this driver', {
              style: {
                background: 'card',
                color: 'primary',
              },
            });
          }
        } else {
          response = await apiClient.get("/v1/admin/vehicles", {
            params: {
              page,
              limit,
              search,
              status: status === "all" ? undefined : status === "pending" ? "inactive" : status,
              is_approved: status === "pending" ? false : status === "approved" ? true : undefined,
            },
          });
          console.log("All Vehicles Response:", response.data);
          const data = response.data.data.map((vehicle: any) => ({
            ...vehicle,
            car_photos: Array.isArray(vehicle.car_photos) ? vehicle.car_photos : [],
            rc_doc_status: vehicle.rc_doc_status || "pending",
            insurance_doc_status: vehicle.insurance_doc_status || "pending",
            verified_by: vehicle.verified_by || null,
          }));
          setVehicles(data);
          setTotalItems(response.data.total);
        }
      } catch (err: any) {
        console.error("Error fetching vehicles:", err);
        toast.error(err.response?.data?.message || 'Failed to fetch vehicles', {
          style: {
            background: 'card',
            color: 'primary',
          },
        });
      } finally {
        setSearchLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    const fetchInitialVehicles = async () => {
      setLoading(true);
      try {
        const driverId = searchParams.get('driverId');
        if (driverId) {
          setDriverIdFilter(driverId);
          await debouncedFetchVehicles('', 'all', 1, 5, driverId);
          setItemsPerPage(5);
          setCurrentPage(1);
        } else {
          await debouncedFetchVehicles(searchTerm, statusFilter, currentPage, itemsPerPage);
        }
      } catch (err) {
        console.error('Error in initial vehicle fetch:', err);
        toast.error('Failed to initialize vehicle data', {
          style: {
            background: 'card',
            color: 'primary',
          },
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialVehicles();
  }, [searchParams, debouncedFetchVehicles]);

  useEffect(() => {
    if (driverIdFilter) {
      debouncedFetchVehicles('', 'all', 1, itemsPerPage, driverIdFilter);
    } else {
      debouncedFetchVehicles(searchTerm, statusFilter, currentPage, itemsPerPage);
    }
    if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchTerm, statusFilter, currentPage, itemsPerPage, driverIdFilter, debouncedFetchVehicles]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const verifiedBy = 'some-user-id'; // Replace with actual user ID from auth context

  const handleConfirmAction = async (providedReason?: string) => {
    const { action, vehicleId } = confirmDialog;
    const reason = providedReason?.trim();
    setIsDeleting(true);
    try {
      if (action === 'rc-verify') {
        await apiClient.post(`/v1/admin/vehicles/${vehicleId}/verify-rc`, { verified_by: verifiedBy });
        setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, rc_doc_status: 'verified' } : v));
        setSelectedVehicle(prev => (prev && prev.id === vehicleId ? { ...prev, rc_doc_status: 'verified' } : prev));
        toast.success('RC document verified', {
          style: {
            background: 'card',
            color: 'primary',
          },
        });
      } else if (action === 'rc-reject') {
        if (!reason) {
          toast.error('A reason is required to reject the RC document', {
            style: {
              background: 'card',
              color: 'primary',
            },
          });
          return;
        }
        await apiClient.post(`/v1/admin/vehicles/${vehicleId}/reject-rc`, { reason, verified_by: verifiedBy });
        setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, rc_doc_status: 'rejected' } : v));
        setSelectedVehicle(prev => (prev && prev.id === vehicleId ? { ...prev, rc_doc_status: 'rejected' } : prev));
        toast.success('RC document rejected', {
          style: {
            background: 'card',
            color: 'primary',
          },
        });
      } else if (action === 'insurance-verify') {
        await apiClient.post(`/v1/admin/vehicles/${vehicleId}/verify-insurance`, { verified_by: verifiedBy });
        setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, insurance_doc_status: 'verified' } : v));
        setSelectedVehicle(prev => (prev && prev.id === vehicleId ? { ...prev, insurance_doc_status: 'verified' } : prev));
        toast.success('Insurance document verified', {
          style: {
            background: 'card',
            color: 'primary',
          },
        });
      } else if (action === 'insurance-reject') {
        if (!reason) {
          toast.error('A reason is required to reject the insurance document', {
            style: {
              background: 'card',
              color: 'primary',
            },
          });
          return;
        }
        await apiClient.post(`/v1/admin/vehicles/${vehicleId}/reject-insurance`, { reason, verified_by: verifiedBy });
        setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, insurance_doc_status: 'rejected' } : v));
        setSelectedVehicle(prev => (prev && prev.id === vehicleId ? { ...prev, insurance_doc_status: 'rejected' } : prev));
        toast.success('Insurance document rejected', {
          style: {
            background: 'card',
            color: 'primary',
          },
        });
      } else if (action === 'approve') {
        await apiClient.post(`/v1/admin/vehicles/${vehicleId}/approve`, { verified_by: verifiedBy });
        setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, is_approved: true, status: 'active' } : v));
        setSelectedVehicle(prev => (prev && prev.id === vehicleId ? { ...prev, is_approved: true, status: 'active' } : prev));
        toast.success('Vehicle approved', {
          style: {
            background: 'card',
            color: 'primary',
          },
        });
      } else if (action === 'reject') {
        if (!reason) {
          toast.error('A reason is required to reject the vehicle', {
            style: {
              background: 'card',
              color: 'primary',
            },
          });
          return;
        }
        await apiClient.post(`/v1/admin/vehicles/${vehicleId}/reject`, { reason, verified_by: verifiedBy });
        setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, is_approved: false, status: 'rejected' } : v));
        setSelectedVehicle(prev => (prev && prev.id === vehicleId ? { ...prev, is_approved: false, status: 'rejected' } : prev));
        toast.success('Vehicle rejected', {
          style: {
            background: 'card',
            color: 'primary',
          },
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${action.split('-')[0]} ${action.includes('rc') ? 'RC document' : action.includes('insurance') ? 'insurance document' : 'vehicle'}`, {
        style: {
          background: 'card',
          color: 'primary',
        },
      });
    } finally {
      setConfirmDialog({ open: false, action: '', vehicleId: '' });
      setRejectReason('');
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (vehicle: Vehicle) => {
    if (vehicle.status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
    if (!vehicle.is_approved) return <Badge className='bg-red-600'>Pending</Badge>;
    if (vehicle.status === 'inactive') return <Badge variant="outline">Inactive</Badge>;
    return <Badge variant="default">Active</Badge>;
  };

  const getDocStatusBadge = (status: 'pending' | 'verified' | 'rejected') => {
    if (status === 'pending') return <Badge variant="secondary">Pending</Badge>;
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
            router.push('/vehicles');
          }}
          className="mb-4"
        >
          Back to All Vehicles
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
              <label className="block text-sm font-medium text-primary">Search Vehicles</label>
              <div className="relative mt-1">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search vehicles..."
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
          <CardTitle>Vehicles ({totalItems})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>License Plate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <Loader />
                  </TableCell>
                </TableRow>
              )}
              {vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No vehicles found
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle, index) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{`${vehicle.car_brand} ${vehicle.car_model}`}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{vehicle.license_plate}</TableCell>
                    <TableCell>{getStatusBadge(vehicle)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedVehicle(vehicle)}
                              title='View Details'
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Vehicle Details</DialogTitle>
                              <DialogDescription>
                                Complete information about {`${vehicle.car_brand} ${vehicle.car_model}`}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedVehicle && (
                              <Tabs defaultValue="details" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="details" className="data-[state=active]:bg-primary data-[state=active]:text-card">
                                    Details
                                  </TabsTrigger>
                                  <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-card">
                                    Documents
                                  </TabsTrigger>
                                </TabsList>
                                <TabsContent value="details" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Vehicle Information</label>
                                      <div className="space-y-1">
                                        <p className="text-sm">Brand: {selectedVehicle.car_brand}</p>
                                        <p className="text-sm">Model: {selectedVehicle.car_model}</p>
                                        <p className="text-sm">License Plate: {selectedVehicle.license_plate}</p>
                                        <p className="text-sm">Status: {selectedVehicle.status}</p>
                                        <p className="text-sm">Approved: {selectedVehicle.is_approved ? 'Yes' : 'No'}</p>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Verification</label>
                                      <div className="space-y-1">
                                        <p className="text-sm">Mulkiya Status: {getDocStatusBadge(selectedVehicle.rc_doc_status)}</p>
                                        <p className="text-sm">Insurance Status: {getDocStatusBadge(selectedVehicle.insurance_doc_status)}</p>
                                        <p className="text-sm">Verified By: {selectedVehicle.verified_by ? `${selectedVehicle.verified_by.name} (${selectedVehicle.verified_by.role})` : 'N/A'}</p>
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
                                          <Button variant="outline" size="sm" onClick={() => setRcModalOpen(true)}>
                                            View RC Document
                                          </Button>
                                          {getDocStatusBadge(selectedVehicle.rc_doc_status)}
                                        </div>
                                        <Dialog open={rcModalOpen} onOpenChange={setRcModalOpen}>
                                          <DialogContent className="max-w-4xl">
                                            <DialogHeader>
                                              <DialogTitle>RC Document</DialogTitle>
                                            </DialogHeader>
                                            <img
                                              src={selectedVehicle.rc_doc}
                                              alt="RC Document"
                                              className="w-[400px] h-[250px] object-contain rounded cursor-pointer"
                                              onClick={() => handleImageClick(selectedVehicle.rc_doc)}
                                            />
                                            {selectedVehicle.rc_doc_status === 'pending' && (
                                              <div className="flex justify-end space-x-2 mt-4">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => setConfirmDialog({ open: true, action: 'rc-verify', vehicleId: selectedVehicle.id })}
                                                  className="text-green-600 hover:text-green-700"
                                                >
                                                  Verify
                                                </Button>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => setConfirmDialog({ open: true, action: 'rc-reject', vehicleId: selectedVehicle.id })}
                                                  className="text-card bg-primary"
                                                >
                                                  Reject
                                                </Button>
                                              </div>
                                            )}
                                          </DialogContent>
                                        </Dialog>
                                        <div className="flex items-center space-x-2">
                                          <Button variant="outline" size="sm" onClick={() => setInsuranceModalOpen(true)}>
                                            View Insurance Document
                                          </Button>
                                          {getDocStatusBadge(selectedVehicle.insurance_doc_status)}
                                        </div>
                                        <Dialog open={insuranceModalOpen} onOpenChange={setInsuranceModalOpen}>
                                          <DialogContent className="max-w-4xl">
                                            <DialogHeader>
                                              <DialogTitle>Insurance Document</DialogTitle>
                                            </DialogHeader>
                                            <img
                                              src={selectedVehicle.insurance_doc}
                                              alt="Insurance Document"
                                              className="w-[400px] h-[250px] object-contain rounded cursor-pointer"
                                              onClick={() => handleImageClick(selectedVehicle.insurance_doc)}
                                            />
                                            {selectedVehicle.insurance_doc_status === 'pending' && (
                                              <div className="flex justify-end space-x-2 mt-4">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => setConfirmDialog({ open: true, action: 'insurance-verify', vehicleId: selectedVehicle.id })}
                                                  className="text-green-600 hover:text-green-700"
                                                >
                                                  Verify
                                                </Button>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => setConfirmDialog({ open: true, action: 'insurance-reject', vehicleId: selectedVehicle.id })}
                                                  className="text-red-600 hover:text-red-700"
                                                >
                                                  Reject
                                                </Button>
                                              </div>
                                            )}
                                          </DialogContent>
                                        </Dialog>
                                        <div className="space-y-2">
                                          <label className="text-sm font-medium">Vehicle Photos</label>
                                          {Array.isArray(selectedVehicle.car_photos) && selectedVehicle.car_photos.length > 0 ? (
                                            <div className="grid grid-cols-3 gap-2">
                                              {selectedVehicle.car_photos.map((photo, index) => (
                                                <img
                                                  key={index}
                                                  src={photo}
                                                  alt={`Vehicle Photo ${index + 1}`}
                                                  className="w-full h-32 object-cover rounded cursor-pointer"
                                                  onClick={() => handleImageClick(photo)}
                                                />
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-sm text-muted-foreground">No photos available</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            )}
                          </DialogContent>
                        </Dialog>
                        {!vehicle.is_approved && vehicle.status !== 'rejected' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (vehicle.rc_doc_status !== 'verified' || vehicle.insurance_doc_status !== 'verified') {
                                  toast.error('Please verify all documents before approving the vehicle', {
                                    style: {
                                      background: 'card',
                                      color: 'primary',
                                    },
                                  });
                                  return;
                                }
                                setConfirmDialog({ open: true, action: 'approve', vehicleId: vehicle.id });
                              }}
                              className="text-green-600 hover:text-green-700"
                              title='Approve Vehicle'
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmDialog({ open: true, action: 'reject', vehicleId: vehicle.id })}
                              className="text-red-600 hover:text-red-700"
                              title='Reject Vehicle'
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            router.push(`/drivers?driverId=${vehicle.driver_id}`);
                          }}
                          title='View Driver Details'
                        >
                          <User className="w-4 h-4" />
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

      <Dialog open={confirmDialog.open} onOpenChange={() => setConfirmDialog({ open: false, action: '', vehicleId: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action.includes('verify') ? 'Confirm Verification' :
               confirmDialog.action.includes('reject') ? 'Confirm Rejection' :
               confirmDialog.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action.includes('verify')
                ? `Are you sure you want to verify the ${confirmDialog.action.includes('rc') ? 'RC' : 'insurance'} document?`
                : confirmDialog.action === 'reject' || confirmDialog.action.includes('rc-reject') || confirmDialog.action.includes('insurance-reject')
                ? `Please provide a reason for rejecting the ${confirmDialog.action.includes('rc') ? 'RC document' : confirmDialog.action.includes('insurance') ? 'insurance document' : 'vehicle'}.`
                : confirmDialog.action === 'approve'
                ? 'Are you sure you want to approve this vehicle?'
                : 'Are you sure you want to reject this vehicle?'}
            </DialogDescription>
          </DialogHeader>
          {(confirmDialog.action === 'reject' || confirmDialog.action.includes('rc-reject') || confirmDialog.action.includes('insurance-reject')) && (
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
              onClick={() => setConfirmDialog({ open: false, action: '', vehicleId: '' })}
            >
              Cancel
            </Button>
            <Button
            className='bg-primary text-card'
              variant={confirmDialog.action.includes('verify') || confirmDialog.action === 'approve' ? 'default' : 'destructive'}
              onClick={() => handleConfirmAction(rejectReason)}
              disabled={isDeleting || ((confirmDialog.action === 'rejesct' || confirmDialog.action.includes('rc-reject') || confirmDialog.action.includes('insurance-reject')) && !rejectReason)}
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {confirmDialog.action.includes('verify') ? 'Verify' :
               confirmDialog.action.includes('reject') ? 'Reject' :
               confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
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
            <img src={selectedImage} alt="Enlarged Document" className="w-[50vw] h-[80vh] object-contain rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}