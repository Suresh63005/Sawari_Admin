"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Eye, CheckCircle, XCircle, User } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Loader from '@/components/ui/Loader';

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
  verified_by?: string;
}

export default function VehicleApproval() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [rcModalOpen, setRcModalOpen] = useState(false);
  const [insuranceModalOpen, setInsuranceModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: string;
    vehicleId: string;
    reason?: string;
  }>({ open: false, action: '', vehicleId: '' });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const driverId = localStorage.getItem("selectedDriverId");

    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/v1/admin/vehicles');
        let data = response.data;

        // Normalize car_photos to ensure it's always an array
        data = data.map((vehicle: any) => ({
          ...vehicle,
          car_photos: Array.isArray(vehicle.car_photos) ? vehicle.car_photos : [],
          rc_doc_status: vehicle.rc_doc_status || 'pending',
          insurance_doc_status: vehicle.insurance_doc_status || 'pending',
        }));

        if (driverId) {
          data = data.filter((v: any) => v.driver_id === driverId);
          localStorage.removeItem("selectedDriverId");
        }

        setVehicles(data);
      } catch (err: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err.response?.data?.message || 'Failed to fetch vehicles',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch =
      `${vehicle.car_brand} ${vehicle.car_model}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.license_plate.includes(searchTerm);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && !vehicle.is_approved) ||
      (statusFilter === 'approved' && vehicle.is_approved && vehicle.status === 'active') ||
      (statusFilter === 'rejected' && vehicle.status === 'rejected');
    return matchesSearch && matchesStatus;
  });

  const verifiedBy = 'some-user-id'; // Replace with actual user ID from auth context

  const handleConfirmAction = async (providedReason?: string) => {
  const { action, vehicleId } = confirmDialog; // No need for stateReason
  const reason = providedReason?.trim(); // Use provided, trim for safety

  try {
    if (action === 'rc-verify') {
      await apiClient.post(`/v1/admin/vehicles/${vehicleId}/verify-rc`, { verified_by: verifiedBy });
      setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, rc_doc_status: 'verified' } : v));
      setSelectedVehicle(prev => (prev && prev.id === vehicleId ? { ...prev, rc_doc_status: 'verified' } : prev));
      toast({ title: 'Success', description: 'RC document verified' });
    } else if (action === 'rc-reject') {
      if (!reason) {
        toast({ variant: 'destructive', title: 'Error', description: 'A reason is required to reject the RC document' });
        return;
      }
      await apiClient.post(`/v1/admin/vehicles/${vehicleId}/reject-rc`, { reason, verified_by: verifiedBy });
      setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, rc_doc_status: 'rejected' } : v));
      setSelectedVehicle(prev => (prev && prev.id === vehicleId ? { ...prev, rc_doc_status: 'rejected' } : prev));
      toast({ title: 'Success', description: 'RC document rejected' });
    } else if (action === 'insurance-verify') {
      await apiClient.post(`/v1/admin/vehicles/${vehicleId}/verify-insurance`, { verified_by: verifiedBy });
      setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, insurance_doc_status: 'verified' } : v));
      setSelectedVehicle(prev => (prev && prev.id === vehicleId ? { ...prev, insurance_doc_status: 'verified' } : prev));
      toast({ title: 'Success', description: 'Insurance document verified' });
    } else if (action === 'insurance-reject') {
      if (!reason) {
        toast({ variant: 'destructive', title: 'Error', description: 'A reason is required to reject the insurance document' });
        return;
      }
      await apiClient.post(`/v1/admin/vehicles/${vehicleId}/reject-insurance`, { reason, verified_by: verifiedBy });
      setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, insurance_doc_status: 'rejected' } : v));
      setSelectedVehicle(prev => (prev && prev.id === vehicleId ? { ...prev, insurance_doc_status: 'rejected' } : prev));
      toast({ title: 'Success', description: 'Insurance document rejected' });
    } else if (action === 'approve') {
      await apiClient.post(`/v1/admin/vehicles/${vehicleId}/approve`, { verified_by: verifiedBy });
      setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, is_approved: true, status: 'active' } : v));
      setSelectedVehicle(prev => (prev && prev.id === vehicleId ? { ...prev, is_approved: true, status: 'active' } : prev));
      toast({ title: 'Success', description: 'Vehicle approved' });
    } else if (action === 'reject') {
      if (!reason) {
        toast({ variant: 'destructive', title: 'Error', description: 'A reason is required to reject the vehicle' });
        return;
      }
      await apiClient.post(`/v1/admin/vehicles/${vehicleId}/reject`, { reason, verified_by: verifiedBy });
      setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, is_approved: false, status: 'rejected' } : v));
      setSelectedVehicle(prev => (prev && prev.id === vehicleId ? { ...prev, is_approved: false, status: 'rejected' } : prev));
      toast({ title: 'Success', description: 'Vehicle rejected' });
    }
  } catch (err: any) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: err.response?.data?.message || `Failed to ${action.split('-')[0]} ${action.includes('rc') ? 'RC document' : action.includes('insurance') ? 'insurance document' : 'vehicle'}`,
    });
  } finally {
    setConfirmDialog({ open: false, action: '', vehicleId: '' });
    setRejectReason('');
  }
};

  const getStatusBadge = (vehicle: Vehicle) => {
    if (!vehicle.is_approved) return <Badge variant="secondary">Pending</Badge>;
    if (vehicle.status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
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
  if (loading) {
    return <Loader />;
  }
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
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant={statusFilter === 'all' ? 'default' : 'outline'} onClick={() => setStatusFilter('all')}>
                All
              </Button>
              <Button variant={statusFilter === 'pending' ? 'default' : 'outline'} onClick={() => setStatusFilter('pending')}>
                Pending
              </Button>
              <Button variant={statusFilter === 'approved' ? 'default' : 'outline'} onClick={() => setStatusFilter('approved')}>
                Approved
              </Button>
              <Button variant={statusFilter === 'rejected' ? 'default' : 'outline'} onClick={() => setStatusFilter('rejected')}>
                Rejected
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicles ({filteredVehicles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>License Plate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
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
                          <Button variant="outline" size="sm" onClick={() => setSelectedVehicle(vehicle)}>
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
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="documents">Documents</TabsTrigger>
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
                                      <p className="text-sm">RC Doc Status: {getDocStatusBadge(selectedVehicle.rc_doc_status)}</p>
                                      <p className="text-sm">Insurance Doc Status: {getDocStatusBadge(selectedVehicle.insurance_doc_status)}</p>
                                      <p className="text-sm">Verified By: {selectedVehicle.verified_by || 'N/A'}</p>
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
                                            className="w-full h-auto rounded cursor-pointer"
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
                                                className="text-red-600 hover:text-red-700"
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
                                            className="w-full h-auto rounded cursor-pointer"
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
                      <div className="flex space-x-2">
                        {!vehicle.is_approved && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmDialog({ open: true, action: 'approve', vehicleId: vehicle.id })}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmDialog({ open: true, action: 'reject', vehicleId: vehicle.id })}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                       
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              localStorage.setItem("selectedDriverId", vehicle.driver_id);
                              window.location.href = "/drivers"; // or use router.push("/drivers")
                            }}
                          >
                            <User className="w-4 h-4" />
                          </Button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
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
                : confirmDialog.action.includes('reject')
                ? `Please provide a reason for rejecting the ${confirmDialog.action.includes('rc') ? 'RC' : 'insurance'} document.`
                : confirmDialog.action === 'approve'
                ? 'Are you sure you want to approve this vehicle?'
                : 'Are you sure you want to reject this vehicle?'}
            </DialogDescription>
          </DialogHeader>
          {confirmDialog.action.includes('reject') && (
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection"
                className="w-full"
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
  variant={confirmDialog.action.includes('verify') || confirmDialog.action === 'approve' ? 'default' : 'destructive'}
  onClick={() => handleConfirmAction(rejectReason)} // Pass rejectReason directly
  disabled={confirmDialog.action.includes('reject') && !rejectReason}
>
  {confirmDialog.action.includes('verify') ? 'Verify' : 
   confirmDialog.action.includes('reject') ? 'Reject' : 
   confirmDialog.action === 'approve' ? 'Approve' : 'Reject'}
</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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