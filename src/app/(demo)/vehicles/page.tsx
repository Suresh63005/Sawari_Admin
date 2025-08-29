"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye, CheckCircle, XCircle, User } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import Loader from "@/components/ui/Loader";

interface Vehicle {
  id: string;
  driver_id: string;
  car_model: string;
  car_brand: string;
  license_plate: string;
  car_photos: string[];
  rc_doc: string;
  insurance_doc: string;
  rc_doc_status: "pending" | "verified" | "rejected";
  insurance_doc_status: "pending" | "verified" | "rejected";
  is_approved: boolean;
  status: "active" | "inactive" | "rejected";
  verified_by?: string;
}

export default function VehicleApproval() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
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
  }>({ open: false, action: "", vehicleId: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  useEffect(() => {
    const driverId = localStorage.getItem("selectedDriverId");

 const fetchVehicles = async (isSearch = false) => {
  try {
    if (isSearch) {
      setSearchLoading(false);
    } else {
      setLoading(false);
    }

    const response = await apiClient.get(
      `/v1/admin/vehicles?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}&status=${statusFilter}`
    );

    let data = response.data.data;
    // normalize data
    data = data.map((vehicle: any) => ({
      ...vehicle,
      car_photos: Array.isArray(vehicle.car_photos) ? vehicle.car_photos : [],
      rc_doc_status: vehicle.rc_doc_status || "pending",
      insurance_doc_status: vehicle.insurance_doc_status || "pending",
    }));

    setVehicles(data);
    setTotalItems(response.data.total);
  } catch (err: any) {
    toast({
      variant: "destructive",
      title: "Error",
      description: err.response?.data?.message || "Failed to fetch vehicles",
    });
  } finally {
    if (isSearch) {
      setSearchLoading(false);
    } else {
      setLoading(false);
    }
  }
};


    fetchVehicles();
  }, [currentPage, itemsPerPage, searchTerm, statusFilter]);

  // Wild search implementation
  const filteredVehicles = vehicles.filter((vehicle) => {
    const searchTerms = searchTerm
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 0);
    const vehicleString =
      `${vehicle.car_brand} ${vehicle.car_model} ${vehicle.license_plate}`.toLowerCase();
    const matchesSearch = searchTerms.every(
      (term) =>
        vehicleString.includes(term) ||
        vehicle.car_brand.toLowerCase().includes(term) ||
        vehicle.car_model.toLowerCase().includes(term) ||
        vehicle.license_plate.toLowerCase().includes(term)
    );
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && !vehicle.is_approved) ||
      (statusFilter === "approved" &&
        vehicle.is_approved &&
        vehicle.status === "active") ||
      (statusFilter === "rejected" && vehicle.status === "rejected");
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVehicles = filteredVehicles.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const verifiedBy = "some-user-id"; // Replace with actual user ID from auth context

  const handleConfirmAction = async (providedReason?: string) => {
  const { action, vehicleId } = confirmDialog;
  const reason = providedReason?.trim();

  try {
    if (action === "rc-verify") {
      await apiClient.post(`/v1/admin/vehicles/${vehicleId}/verify-rc`, {
        verified_by: verifiedBy,
      });
      setVehicles(
        vehicles.map((v) =>
          v.id === vehicleId ? { ...v, rc_doc_status: "verified" } : v
        )
      );
      setSelectedVehicle((prev) =>
        prev && prev.id === vehicleId ? { ...prev, rc_doc_status: "verified" } : prev
      );
      toast({ title: "Success", description: "RC document verified" });
    } else if (action === "rc-reject") {
      await apiClient.post(`/v1/admin/vehicles/${vehicleId}/reject-rc`, {
        verified_by: verifiedBy,
      });
      setVehicles(
        vehicles.map((v) =>
          v.id === vehicleId ? { ...v, rc_doc_status: "rejected" } : v
        )
      );
      setSelectedVehicle((prev) =>
        prev && prev.id === vehicleId ? { ...prev, rc_doc_status: "rejected" } : prev
      );
      toast({ title: "Success", description: "RC document rejected" });
    } else if (action === "insurance-verify") {
      await apiClient.post(`/v1/admin/vehicles/${vehicleId}/verify-insurance`, {
        verified_by: verifiedBy,
      });
      setVehicles(
        vehicles.map((v) =>
          v.id === vehicleId ? { ...v, insurance_doc_status: "verified" } : v
        )
      );
      setSelectedVehicle((prev) =>
        prev && prev.id === vehicleId
          ? { ...prev, insurance_doc_status: "verified" }
          : prev
      );
      toast({ title: "Success", description: "Insurance document verified" });
    } else if (action === "insurance-reject") {
      await apiClient.post(`/v1/admin/vehicles/${vehicleId}/reject-insurance`, {
        verified_by: verifiedBy,
      });
      setVehicles(
        vehicles.map((v) =>
          v.id === vehicleId ? { ...v, insurance_doc_status: "rejected" } : v
        )
      );
      setSelectedVehicle((prev) =>
        prev && prev.id === vehicleId
          ? { ...prev, insurance_doc_status: "rejected" }
          : prev
      );
      toast({ title: "Success", description: "Insurance document rejected" });
    } else if (action === "approve") {
      await apiClient.post(`/v1/admin/vehicles/${vehicleId}/approve`, {
        verified_by: verifiedBy,
      });
      setVehicles(
        vehicles.map((v) =>
          v.id === vehicleId ? { ...v, is_approved: true, status: "active" } : v
        )
      );
      setSelectedVehicle((prev) =>
        prev && prev.id === vehicleId
          ? { ...prev, is_approved: true, status: "active" }
          : prev
      );
      toast({ title: "Success", description: "Vehicle approved" });
    } else if (action === "reject") {
      if (!reason) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "A reason is required to reject the vehicle",
        });
        return;
      }
      await apiClient.post(`/v1/admin/vehicles/${vehicleId}/reject`, {
        reason,
        verified_by: verifiedBy,
      });
      setVehicles(
        vehicles.map((v) =>
          v.id === vehicleId ? { ...v, is_approved: false, status: "rejected" } : v
        )
      );
      setSelectedVehicle((prev) =>
        prev && prev.id === vehicleId
          ? { ...prev, is_approved: false, status: "rejected" }
          : prev
      );
      toast({ title: "Success", description: "Vehicle rejected" });
    }
  } catch (err: any) {
    toast({
      variant: "destructive",
      title: "Error",
      description:
        err.response?.data?.message ||
        `Failed to ${action.split("-")[0]} ${
          action.includes("rc")
            ? "RC document"
            : action.includes("insurance")
            ? "insurance document"
            : "vehicle"
        }`,
    });
  } finally {
    setConfirmDialog({ open: false, action: "", vehicleId: "" });
    setRejectReason("");
  }
};

const getStatusBadge = (vehicle: Vehicle) => {
  if (vehicle.status === "rejected")
    return <Badge variant="destructive">Rejected</Badge>;
  if (!vehicle.is_approved) return <Badge variant="secondary">Pending</Badge>;
  if (vehicle.status === "inactive")
    return <Badge variant="outline">Inactive</Badge>;
  return <Badge variant="default">Active</Badge>;
};

  const getDocStatusBadge = (status: "pending" | "verified" | "rejected") => {
    if (status === "pending") return <Badge variant="secondary">Pending</Badge>;
    if (status === "rejected")
      return <Badge variant="destructive">Rejected</Badge>;
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
      <div className="bg-card p-4 rounded-lg border border-primary">
        <div className="flex items-center space-x-4 px-6 pt-6 pb-6 ">
          <div className="flex-1">
            <h1 className="text-md font-semibold pb-5">Filter</h1>
            <label className="block text-sm font-medium text-primary">
              Search Vehicles
            </label>
            <div className="relative">
              <input
              type="text"
              placeholder="Search for vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block w-full p-2 border border-primary rounded-md bg-card"
            />
            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>

          </div>
          
          <div className="flex gap-2 mt-[65px]">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              className={
                statusFilter === "all"
                  ? "bg-primary text-card"
                  : "bg-card text-primary"
              }
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "pending" ? "default" : "outline"}
              className={
                statusFilter === "pending"
                  ? "bg-primary text-card"
                  : "bg-card text-primary"
              }
              onClick={() => {
                setStatusFilter("pending");
                setCurrentPage(1);
              }}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === "approved" ? "default" : "outline"}
              className={
                statusFilter === "approved"
                  ? "bg-primary text-card"
                  : "bg-card text-primary"
              }
              onClick={() => {
                setStatusFilter("approved");
                setCurrentPage(1);
              }}
            >
              Approved
            </Button>
            <Button
              variant={statusFilter === "rejected" ? "default" : "outline"}
              className={
                statusFilter === "rejected"
                  ? "bg-primary text-card"
                  : "bg-card text-primary"
              }
              onClick={() => {
                setStatusFilter("rejected");
                setCurrentPage(1);
              }}
            >
              Rejected
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicles ({filteredVehicles.length})</CardTitle>
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
  {currentVehicles.length === 0 ? (
    <TableRow>
      <TableCell colSpan={4} className="text-center">No vehicles found</TableCell>
    </TableRow>
  ) : (
    currentVehicles.map((vehicle,index) => (
      <TableRow key={vehicle.id}>
        <TableCell>{indexOfFirstItem + index + 1}</TableCell>
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
                      <TabsTrigger value="details"
                      className="data-[state=active]:bg-primary data-[state=active]:text-card">Details</TabsTrigger>
                      <TabsTrigger value="documents"
                      className="data-[state=active]:bg-primary data-[state=active]:text-card">Documents</TabsTrigger>
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
           {(vehicle.status !== "rejected" && !(vehicle.is_approved && vehicle.status === "active")) && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => setConfirmDialog({ open: true, action: 'approve', vehicleId: vehicle.id })}
    className="text-green-600 hover:text-green-700"
  >
    <CheckCircle className="w-4 h-4" />
  </Button>
)}

{(vehicle.status !== "rejected") && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => setConfirmDialog({ open: true, action: 'reject', vehicleId: vehicle.id })}
    className="text-red-600 hover:text-red-700"
  >
    <XCircle className="w-4 h-4" />
  </Button>
)}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.setItem("selectedDriverId", vehicle.driver_id);
                window.location.href = "/drivers";
              }}
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
          {!loading && filteredVehicles.length > 0 && (
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
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="text-primary"
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      onClick={() => paginate(page)}
                      variant={currentPage === page ? "default" : "outline"}
                      className={
                        currentPage === page
                          ? "bg-primary text-card"
                          : "bg-card text-primary"
                      }
                    >
                      {page}
                    </Button>
                  )
                )}
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
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
  open={confirmDialog.open}
  onOpenChange={() =>
    setConfirmDialog({ open: false, action: "", vehicleId: "" })
  }
>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>
        {confirmDialog.action.includes("verify")
          ? "Confirm Verification"
          : confirmDialog.action.includes("reject")
          ? "Confirm Rejection"
          : confirmDialog.action === "approve"
          ? "Confirm Approval"
          : "Confirm Rejection"}
      </DialogTitle>
      <DialogDescription>
        {confirmDialog.action.includes("verify")
          ? `Are you sure you want to verify the ${
              confirmDialog.action.includes("rc") ? "RC" : "insurance"
            } document?`
          : confirmDialog.action === "reject"
          ? "Please provide a reason for rejecting the vehicle."
          : confirmDialog.action.includes("rc-reject") || confirmDialog.action.includes("insurance-reject")
          ? `Are you sure you want to reject the ${
              confirmDialog.action.includes("rc") ? "RC" : "insurance"
            } document?`
          : confirmDialog.action === "approve"
          ? "Are you sure you want to approve this vehicle?"
          : "Are you sure you want to reject this vehicle?"}
      </DialogDescription>
    </DialogHeader>
    {confirmDialog.action === "reject" && (
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
        onClick={() =>
          setConfirmDialog({ open: false, action: "", vehicleId: "" })
        }
      >
        Cancel
      </Button>
      <Button
        variant={
          confirmDialog.action.includes("verify") || confirmDialog.action === "approve"
            ? "default"
            : "destructive"
        }
        onClick={() => handleConfirmAction(confirmDialog.action === "reject" ? rejectReason : undefined)}
        disabled={confirmDialog.action === "reject" && !rejectReason}
      >
        {confirmDialog.action.includes("verify")
          ? "Verify"
          : confirmDialog.action.includes("reject")
          ? "Reject"
          : confirmDialog.action === "approve"
          ? "Approve"
          : "Reject"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Enlarged Document</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Enlarged Document"
              className="w-full h-auto rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
