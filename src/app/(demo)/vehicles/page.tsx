"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Eye, CheckCircle, XCircle, User } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import Swal from 'sweetalert2'; // Import SweetAlert2

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
  verified_by?: string; // Optional, for tracking
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

 useEffect(() => {
  const driverId = localStorage.getItem("selectedDriverId");

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/v1/admin/vehicles');
      let data = response.data;

      if (driverId) {
        data = data.filter((v: any) => v.driver_id === driverId);
        localStorage.removeItem("selectedDriverId"); // Clear after use
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
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'pending' && !vehicle.is_approved) ||
                         (statusFilter === 'approved' && vehicle.is_approved && vehicle.status === 'active') ||
                         (statusFilter === 'rejected' && vehicle.status === 'rejected');
    return matchesSearch && matchesStatus;
  });

  const verifiedBy = 'some-user-id'; // Replace with actual user ID from auth context

  const handleRcVerify = async (vehicleId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to verify the RC document?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, verify it!',
    });
    if (result.isConfirmed) {
      try {
        await apiClient.post(`/v1/admin/vehicles/${vehicleId}/verify-rc`, { verified_by: verifiedBy });
        setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, rc_doc_status: 'verified' } : v));
        toast({ title: 'Success', description: 'RC document verified' });
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to verify RC document' });
      }
    }
  };

  const handleRcReject = async (vehicleId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to reject the RC document?',
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
        await apiClient.post(`/v1/admin/vehicles/${vehicleId}/reject-rc`, { reason: result.value, verified_by: verifiedBy });
        setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, rc_doc_status: 'rejected' } : v));
        toast({ title: 'Success', description: 'RC document rejected' });
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to reject RC document' });
      }
    }
  };

  const handleInsuranceVerify = async (vehicleId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to verify the insurance document?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, verify it!',
    });
    if (result.isConfirmed) {
      try {
        await apiClient.post(`/v1/admin/vehicles/${vehicleId}/verify-insurance`, { verified_by: verifiedBy });
        setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, insurance_doc_status: 'verified' } : v));
        toast({ title: 'Success', description: 'Insurance document verified' });
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to verify insurance document' });
      }
    }
  };

  const handleInsuranceReject = async (vehicleId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to reject the insurance document?',
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
        await apiClient.post(`/v1/admin/vehicles/${vehicleId}/reject-insurance`, { reason: result.value, verified_by: verifiedBy });
        setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, insurance_doc_status: 'rejected' } : v));
        toast({ title: 'Success', description: 'Insurance document rejected' });
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to reject insurance document' });
      }
    }
  };

  const handleApprove = async (vehicleId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to approve this vehicle?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, approve!',
    });
    if (result.isConfirmed) {
      try {
        await apiClient.post(`/v1/admin/vehicles/${vehicleId}/approve`, { verified_by: verifiedBy });
        setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, is_approved: true, status: 'active' } : v));
        toast({ title: 'Success', description: 'Vehicle approved' });
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to approve vehicle' });
      }
    }
  };

  const handleReject = async (vehicleId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to reject this vehicle?',
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
        await apiClient.post(`/v1/admin/vehicles/${vehicleId}/reject`, { reason: result.value, verified_by: verifiedBy });
        setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, is_approved: false, status: 'rejected' } : v));
        toast({ title: 'Success', description: 'Vehicle rejected' });
      } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.message || 'Failed to reject vehicle' });
      }
    }
  };

  const getStatusBadge = (vehicle: Vehicle) => {
    if (!vehicle.is_approved) return <Badge variant="secondary">Pending</Badge>;
    if (vehicle.status === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
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
                  placeholder="Search vehicles..."
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
              <Button variant={statusFilter === 'rejected' ? 'default' : 'outline'} onClick={() => setStatusFilter('rejected')}>Rejected</Button>
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
            {/* ... Dialog content remains unchanged ... */}
          </Dialog>
          {!vehicle.is_approved && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleApprove(vehicle.id)} // Fix: Use vehicle.id
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReject(vehicle.id)} // Fix: Use vehicle.id
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="w-4 h-4" />
              </Button>
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
            </>
          )}
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