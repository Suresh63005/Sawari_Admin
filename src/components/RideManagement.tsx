"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Search,
  MapPin,
  Clock,
  Car,
  Phone,
  Mail,
  Edit,
  X,
  DollarSign,
  AlertCircle,
  User,
  Calendar,
  Eye,
  Loader2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import apiClient from "@/lib/apiClient";
import toast from "react-hot-toast";
import { debounce, set } from "lodash";
import MapView from "./MapView";
import Loader from "@/components/ui/Loader";
import { DebouncedFunc } from "lodash";

interface Package {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface SubPackage {
  id: string;
  name: string;
  package_id: string;
}

interface Car {
  id: string;
  name: string;
}

interface AvailableCar {
  car_id: string;
  car_model: string;
  base_fare: string;
}

interface Ride {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  pickup_address: string | null;
  pickup_location: string;
  drop_location: string;
  ride_date: string | null;
  car_id: string;
  package_id: string;
  subpackage_id: string;
  scheduled_time: string | null;
  driver_id: string | null;
  status: "pending" | "accepted" | "on-route" | "completed" | "cancelled";
  notes: string | null;
  Price: number;
  Total: number;
  payment_status: "pending" | "completed" | "failed" | null;
  accept_time: string;
  pickup_time: string | null;
  dropoff_time: string | null;
  rider_hours: number;
  createdAt: string;
  package_name: string | null;
  subpackage_name: string | null;
  car_name: string | null;
}

interface RideSummary {
  totalRides: number;
  pending: number;
  accepted: number;
  onRoute: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
}

interface FormData {
  customer_name: string;
  phone: string;
  email: string;
  pickup_address: string;
  pickup_location: string;
  drop_location: string;
  // ride_date: string;
  package_id: string;
  subpackage_id: string;
  car_id: string;
  scheduled_time: string;
  notes: string;
  Price: number;
  Total: number;
  rider_hours: number;
}

const Rides: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [rideSummary, setRideSummary] = useState<RideSummary>({
    totalRides: 0,
    pending: 0,
    accepted: 0,
    onRoute: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0
  });
  const [packages, setPackages] = useState<Package[]>([]);
  const [subPackages, setSubPackages] = useState<SubPackage[]>([]);
  const [modalCars, setModalCars] = useState<Car[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    customer_name: "",
    phone: "",
    email: "",
    pickup_address: "",
    pickup_location: "",
    drop_location: "",
    // ride_date: "",
    package_id: "",
    subpackage_id: "",
    car_id: "",
    scheduled_time: "",
    notes: "",
    Price: 0,
    Total: 0,
    rider_hours: 3
  });
  const [isLoading, setIsLoading] = useState<{
    packages: boolean;
    subPackages: boolean;
    cars: boolean;
    baseFare: boolean;
  }>({
    packages: false,
    subPackages: false,
    cars: false,
    baseFare: false
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [rideToCancel, setRideToCancel] = useState<any | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // Check if selected sub-package is 1-hour
  const isOneHourSubPackage = useMemo(() => {
    const subPackage = subPackages.find(
      (sp) => sp.id === formData.subpackage_id
    );
    return subPackage?.name.toLowerCase().includes("1 hour") || false;
  }, [subPackages, formData.subpackage_id]);

  const validateForm = useCallback(() => {
    const newErrors: Partial<FormData> = {};
    if (!formData.customer_name)
      newErrors.customer_name = "Customer name is required";
    if (!formData.phone || formData.phone.length !== 10)
      newErrors.phone = "Phone number must be exactly 10 digits";
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Valid email is required";
    if (!formData.pickup_location)
      newErrors.pickup_location = "Pickup location is required";
    if (!formData.drop_location)
      newErrors.drop_location = "Drop location is required";
    // if (!formData.ride_date) newErrors.ride_date = "Ride date is required";
    if (!formData.package_id) newErrors.package_id = "Package is required";
    if (!formData.subpackage_id)
      newErrors.subpackage_id = "Sub-package is required";
    if (!formData.car_id) newErrors.car_id = "Car is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  useEffect(() => {
    const fetchPackages = async () => {
      if (isLoading.packages) return;
      setIsLoading((prev) => ({ ...prev, packages: true }));
      try {
        console.log("Fetching packages...");
        const response = await apiClient.get("/v1/admin/package/active");
        console.log("Packages fetched:", response.data);
        setPackages(response.data || []);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } } };
        toast.error(err.response?.data?.error || "Failed to fetch packages", {
          style: {
            background: "#622A39",
            color: "hsl(42, 51%, 91%)"
          }
        });
        setPackages([]);
      } finally {
        setIsLoading((prev) => ({ ...prev, packages: false }));
      }
    };
    fetchPackages();
  }, []);

  useEffect(() => {
    const fetchSubPackages = async () => {
      if (!formData.package_id || isLoading.subPackages) return;
      setIsLoading((prev) => ({ ...prev, subPackages: true }));
      try {
        console.log(
          "Fetching sub-packages for package_id:",
          formData.package_id
        );
        const response = await apiClient.get(
          `/v1/admin/packageprice/sub-packages/${formData.package_id}`
        );
        console.log("Sub-packages fetched:", response.data.result?.data);
        setSubPackages(response.data.result?.data || []);
        if (
          !response.data.result?.data.some(
            (sp: SubPackage) => sp.id === formData.subpackage_id
          )
        ) {
          setFormData((prev) => ({
            ...prev,
            subpackage_id: "",
            car_id: "",
            Price: 0,
            Total: 0
          }));
          setModalCars([]);
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } } };
        toast.error(
          err.response?.data?.error || "Failed to fetch sub-packages",
          {
            style: {
              background: "#622A39",
              color: "hsl(42, 51%, 91%)"
            }
          }
        );
        setSubPackages([]);
        setFormData((prev) => ({
          ...prev,
          subpackage_id: "",
          car_id: "",
          Price: 0,
          Total: 0
        }));
        setModalCars([]);
      } finally {
        setIsLoading((prev) => ({ ...prev, subPackages: false }));
      }
    };
    fetchSubPackages();
    if (!formData.package_id) {
      setSubPackages([]);
      setModalCars([]);
      setFormData((prev) => ({
        ...prev,
        subpackage_id: "",
        car_id: "",
        Price: 0,
        Total: 0
      }));
    }
  }, [formData.package_id]);

  useEffect(() => {
    const fetchModalCarsAndPrice = async () => {
      if (!formData.subpackage_id || !formData.package_id || isLoading.cars)
        return;
      setIsLoading((prev) => ({ ...prev, cars: true, baseFare: true }));
      try {
        console.log(
          "Fetching available cars for package_id:",
          formData.package_id,
          "sub_package_id:",
          formData.subpackage_id
        );
        const response = await apiClient.get(
          `/v1/admin/ride/available-cars/${formData.package_id}/${formData.subpackage_id}`
        );
        console.log("Available cars response:", response.data);
        const availableCars: AvailableCar[] = response.data.data || [];
        console.log("Parsed availableCars:", availableCars);
        const mappedCars = availableCars.map((item: AvailableCar) => ({
          id: item.car_id,
          name: item.car_model || `${item.car_id} (Unknown)`
        }));
        console.log("Mapped modalCars:", mappedCars);
        setModalCars(mappedCars);
        if (formData.car_id) {
          const packagePrice = availableCars.find(
            (item: AvailableCar) => item.car_id === formData.car_id
          );
          if (packagePrice) {
            const baseFare = parseFloat(packagePrice.base_fare) || 0;
            const total = isOneHourSubPackage
              ? baseFare * formData.rider_hours
              : baseFare;
            console.log(total, "Total calculated for car:", formData.car_id);
            setFormData((prev) => ({ ...prev, Price: baseFare, Total: total }));
          } else if (!isEditModalOpen) {
            setFormData((prev) => ({
              ...prev,
              car_id: "",
              Price: 0,
              Total: 0
            }));
            toast.error(
              "No price found for this sub-package and car combination",
              {
                style: {
                  background: "#622A39",
                  color: "hsl(42, 51%, 91%)"
                }
              }
            );
          }
        } else if (!isEditModalOpen) {
          setFormData((prev) => ({ ...prev, car_id: "", Price: 0, Total: 0 }));
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } } };
        console.error("Fetch cars error:", err);
        toast.error(
          err.response?.data?.error || "Failed to fetch cars and prices",
          {
            style: {
              background: "#622A39",
              color: "hsl(42, 51%, 91%)"
            }
          }
        );
        setModalCars([]);
        if (!isEditModalOpen) {
          setFormData((prev) => ({ ...prev, car_id: "", Price: 0, Total: 0 }));
        }
      } finally {
        setIsLoading((prev) => ({ ...prev, cars: false, baseFare: false }));
      }
    };
    fetchModalCarsAndPrice();
    if (!formData.subpackage_id && !isEditModalOpen) {
      setModalCars([]);
      setFormData((prev) => ({ ...prev, car_id: "", Price: 0, Total: 0 }));
    }
  }, [
    formData.subpackage_id,
    formData.package_id,
    formData.car_id,
    formData.rider_hours,
    isOneHourSubPackage,
    isEditModalOpen
  ]);

  const debouncedFetchRides: DebouncedFunc<
    (
      search: string,
      status: string,
      page: number,
      limit: number
    ) => Promise<void>
  > = useMemo(
    () =>
      debounce(
        async (search: string, status: string, page: number, limit: number) => {
          try {
            console.log(
              "Fetching rides with search:",
              search,
              "status:",
              status,
              "page:",
              page,
              "limit:",
              limit
            );
            const url =
              status === "all" || status === ""
                ? `/v1/admin/ride/all?search=${encodeURIComponent(
                    search
                  )}&page=${page}&limit=${limit}`
                : `/v1/admin/ride/all?search=${encodeURIComponent(
                    search
                  )}&status=${encodeURIComponent(
                    status
                  )}&page=${page}&limit=${limit}`;
            const response = await apiClient.get(url);
            console.log("Rides response:", response.data);
            const data = response.data.data || { rides: [], counts: {} };
            setRides(data.rides || []);
            setTotalItems(data.counts.totalRides || 0);
            setRideSummary({
              totalRides: data.counts.totalRides || 0,
              pending: data.counts.pending || 0,
              accepted: data.counts.accepted || 0,
              onRoute: data.counts.onRoute || 0,
              completed: data.counts.completed || 0,
              cancelled: data.counts.cancelled || 0,
              totalRevenue: data.counts.totalRevenue || 0
            });
          } catch (error: unknown) {
            const err = error as { response?: { data?: { error?: string } } };
            console.error("Fetch rides error:", err);
            toast.error(err.response?.data?.error || "Failed to fetch rides", {
              style: {
                background: "#622A39",
                color: "hsl(42, 51%, 91%)"
              }
            });
            setRides([]);
            setTotalItems(0);
            setRideSummary({
              totalRides: 0,
              pending: 0,
              accepted: 0,
              onRoute: 0,
              completed: 0,
              cancelled: 0,
              totalRevenue: 0
            });
          }
        },
        500
      ),
    []
  );

  useEffect(() => {
    debouncedFetchRides(searchTerm, statusFilter, currentPage, itemsPerPage);
    return () => debouncedFetchRides.cancel();
  }, [
    searchTerm,
    statusFilter,
    currentPage,
    itemsPerPage,
    debouncedFetchRides
  ]);

  // Pagination calculations
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleCreateModalOpenChange = useCallback((open: boolean) => {
    setIsCreateModalOpen(open);
    if (!open) {
      setFormData({
        customer_name: "",
        phone: "",
        email: "",
        pickup_address: "",
        pickup_location: "",
        drop_location: "",
        // ride_date: "",
        package_id: "",
        subpackage_id: "",
        car_id: "",
        scheduled_time: "",
        notes: "",
        Price: 0,
        Total: 0,
        rider_hours: 3
      });
      setSubPackages([]);
      setModalCars([]);
      setErrors({});
    }
  }, []);

  const handleEditModalOpenChange = useCallback((open: boolean) => {
    setIsEditModalOpen(open);
    if (!open) {
      setSelectedRide(null);
      setFormData({
        customer_name: "",
        phone: "",
        email: "",
        pickup_address: "",
        pickup_location: "",
        drop_location: "",
        // ride_date: "",
        package_id: "",
        subpackage_id: "",
        car_id: "",
        scheduled_time: "",
        notes: "",
        Price: 0,
        Total: 0,
        rider_hours: 3
      });
      setSubPackages([]);
      setModalCars([]);
      setErrors({});
    }
  }, []);

  const handleCreateRide = useCallback(async () => {
    console.log("handleCreateRide triggered with formData:", formData);
    setIsSubmitting(true);

    if (!validateForm()) {
      toast.error("Please fill all required fields correctly", {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
      setIsSubmitting(false);
      return;
    }

    // const rideDate = new Date(formData.ride_date);
    // if (isNaN(rideDate.getTime())) {
    //   toast.error("Invalid ride date", {
    //     style: {
    //       background: "#622A39",
    //       color: "hsl(42, 51%, 91%)"
    //     }
    //   });
    //   setIsSubmitting(false);
    //   return;
    // }

    let scheduledTime = null;
    if (formData.scheduled_time) {
      scheduledTime = new Date(formData.scheduled_time);
      if (isNaN(scheduledTime.getTime())) {
        toast.error("Invalid scheduled time", {
          style: {
            background: "#622A39",
            color: "hsl(42, 51%, 91%)"
          }
        });
        setIsSubmitting(false);
        return;
      }
    }
    setIsSaving(true);
    try {
      console.log("Sending create ride request:", {
        ...formData,
        status: "pending",
        payment_status: "pending",
        accept_time: new Date().toISOString(),
        // ride_date: rideDate.toISOString(),
        scheduled_time: scheduledTime ? scheduledTime.toISOString() : null
      });
      const response = await apiClient.post("/v1/admin/ride", {
        ...formData,
        status: "pending",
        payment_status: "pending",
        accept_time: new Date().toISOString(),
        // ride_date: rideDate.toISOString(),
        scheduled_time: scheduledTime ? scheduledTime.toISOString() : null
      });
      console.log("Ride created:", response.data);
      handleCreateModalOpenChange(false);
      debouncedFetchRides(searchTerm, statusFilter, currentPage, itemsPerPage);
      toast.success("Ride created successfully", {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      console.error("Create ride error:", err);
      toast.error(err.response?.data?.error || "Failed to create ride", {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
    } finally {
      setIsSubmitting(false);
      setIsSaving(false);
    }
  }, [
    formData,
    searchTerm,
    statusFilter,
    handleCreateModalOpenChange,
    debouncedFetchRides,
    validateForm
  ]);

  const handleEditRide = useCallback(async () => {
    if (!selectedRide) return;

    if (!validateForm()) {
      toast.error("Please fill all required fields correctly", {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
      setIsSubmitting(false);
      return;
    }

    // const rideDate = new Date(formData.ride_date);
    // if (isNaN(rideDate.getTime())) {
    //   toast.error("Invalid ride date", {
    //     style: {
    //       background: "#622A39",
    //       color: "hsl(42, 51%, 91%)"
    //     }
    //   });
    //   setIsSubmitting(false);
    //   return;
    // }

    let scheduledTime = null;
    if (formData.scheduled_time) {
      scheduledTime = new Date(formData.scheduled_time);
      if (isNaN(scheduledTime.getTime())) {
        toast.error("Invalid scheduled time", {
          style: {
            background: "#622A39",
            color: "hsl(42, 51%, 91%)"
          }
        });
        setIsSubmitting(false);
        return;
      }
    }
    setIsSaving(true);
    try {
      const response = await apiClient.put(
        `/v1/admin/ride/${selectedRide.id}`,
        {
          ...formData,
          accept_time: selectedRide.accept_time,
          // ride_date: rideDate.toISOString(),
          scheduled_time: scheduledTime ? scheduledTime.toISOString() : null
        }
      );
      console.log("Ride updated:", response.data);
      handleEditModalOpenChange(false);
      debouncedFetchRides(searchTerm, statusFilter, currentPage, itemsPerPage);
      toast.success("Ride updated successfully", {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      console.error("Update ride error:", err);
      toast.error(err.response?.data?.error || "Failed to update ride", {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
    } finally {
      setIsSubmitting(false);
      setIsSaving(false);
    }
  }, [
    selectedRide,
    formData,
    searchTerm,
    statusFilter,
    handleEditModalOpenChange,
    debouncedFetchRides,
    validateForm
  ]);

  const openEditModal = useCallback((ride: Ride) => {
    setSelectedRide(ride);
    setFormData({
      customer_name: ride.customer_name,
      phone: ride.phone,
      email: ride.email || "",
      pickup_address: ride.pickup_address || "",
      pickup_location: ride.pickup_location,
      drop_location: ride.drop_location,
      // ride_date: ride.ride_date
      //   ? new Date(ride.ride_date).toISOString().slice(0, 16)
      //   : "",
      package_id: ride.package_id,
      subpackage_id: ride.subpackage_id,
      car_id: ride.car_id,
      scheduled_time: ride.scheduled_time
        ? new Date(ride.scheduled_time).toISOString().slice(0, 16)
        : "",
      notes: ride.notes || "",
      Price: ride.Price,
      Total: ride.Total,
      rider_hours: ride.rider_hours
    });
    setIsEditModalOpen(true);
  }, []);

  const handleCancelRide = useCallback(
    async (rideId: string) => {
      setIsCancelling(true);
      try {
        const response = await apiClient.put(`/v1/admin/ride/${rideId}`, {
          status: "cancelled"
        });
        console.log("Ride cancelled:", response.data);
        debouncedFetchRides(
          searchTerm,
          statusFilter,
          currentPage,
          itemsPerPage
        );
        toast.success("Ride cancelled successfully", {
          style: {
            background: "#622A39",
            color: "hsl(42, 51%, 91%)"
          }
        });
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error?: string } } };
        console.error("Cancel ride error:", err);
        toast.error(err.response?.data?.error || "Failed to cancel ride", {
          style: {
            background: "#622A39",
            color: "hsl(42, 51%, 91%)"
          }
        });
      } finally {
        setIsCancelling(false);
      }
    },
    [searchTerm, statusFilter, debouncedFetchRides]
  );

  const getStatusBadge = useCallback((status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, text: "Pending" },
      accepted: { variant: "default" as const, text: "Accepted" },
      "on-route": { variant: "default" as const, text: "On-Route" },
      completed: { variant: "default" as const, text: "Completed" },
      cancelled: { variant: "secondary" as const, text: "Cancelled" }
    };
    const config =
      variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  }, []);

  // if (
  //   isLoading.packages ||
  //   isLoading.subPackages ||
  //   isLoading.cars ||
  //   isLoading.baseFare
  // ) {
  //   return <Loader />;
  // }

  const renderModalContent = (isEdit: boolean) => (
    <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? `Edit Ride #${selectedRide?.id || ""}` : "Create New Ride"}
        </DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update the details for this ride."
            : "Fill in the details to create a new ride."}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Ride Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>
                Package <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.package_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    package_id: value,
                    subpackage_id: "",
                    car_id: "",
                    Price: 0,
                    Total: 0
                  }))
                }
                disabled={isLoading.packages}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoading.packages
                        ? "Loading packages..."
                        : "Select package first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {packages.length > 0 ? (
                    packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled value="no-packages">
                      No packages found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.package_id && (
                <p className="text-red-500 text-sm mt-1">{errors.package_id}</p>
              )}
            </div>
            <div>
              <Label>
                Sub-Package <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.subpackage_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    subpackage_id: value,
                    car_id: "",
                    Price: 0,
                    Total: 0
                  }))
                }
                disabled={!formData.package_id || isLoading.subPackages}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoading.subPackages
                        ? "Loading sub-packages..."
                        : formData.package_id
                        ? "Select sub-package"
                        : "Select a package first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {subPackages.length > 0 ? (
                    subPackages.map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>
                        {sp.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled value="no-subpackages">
                      No sub-packages available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.subpackage_id && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.subpackage_id}
                </p>
              )}
            </div>
            <div>
              <Label>
                Car <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.car_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, car_id: value }))
                }
                disabled={!formData.subpackage_id || isLoading.cars}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoading.cars
                        ? "Loading cars..."
                        : formData.subpackage_id
                        ? "Select car"
                        : "Select a sub-package first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {modalCars.length > 0 ? (
                    modalCars.map((car) => (
                      <SelectItem key={car.id} value={car.id}>
                        {car.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled value="no-cars">
                      No cars available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.car_id && (
                <p className="text-red-500 text-sm mt-1">{errors.car_id}</p>
              )}
            </div>
            <div>
              <Label>
                Pickup Location <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.pickup_location}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pickup_location: e.target.value
                  }))
                }
              />
              {errors.pickup_location && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.pickup_location}
                </p>
              )}
            </div>
            <div>
              <Label>
                Drop Location <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.drop_location}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    drop_location: e.target.value
                  }))
                }
              />
              {errors.drop_location && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.drop_location}
                </p>
              )}
            </div>
            <div>
              <Label>Pickup Address</Label>
              <Input
                value={formData.pickup_address}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pickup_address: e.target.value
                  }))
                }
              />
            </div>
            {/* <div>
              <Label>
                Ride Date and Time <span className="text-red-500">*</span>
              </Label>
              <input
                type="datetime-local"
                className="w-full border rounded p-2 bg-[#FFF8EC]"
                value={formData.ride_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ride_date: e.target.value
                  }))
                }
                min={new Date().toISOString().slice(0, 16)}
                required
              />
              {errors.ride_date && (
                <p className="text-red-500 text-sm mt-1">{errors.ride_date}</p>
              )}
            </div> */}
            <div>
              <Label>Scheduled Time</Label>
              <input
                type="datetime-local"
                className="w-full border rounded p-2 bg-[#FFF8EC]"
                value={formData.scheduled_time}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    scheduled_time: e.target.value
                  }))
                }
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div>
              <Label>Price (AED)</Label>
              <Input
                type="number"
                value={Number(formData.Price).toFixed(2)}
                disabled
              />
            </div>
            {isOneHourSubPackage && (
              <div>
                <Label>Rider Hours</Label>
                <Input
                  type="number"
                  value={formData.rider_hours}
                  onChange={(e) => {
                    let hours = parseInt(e.target.value) || 3;

                    // ✅ enforce minimum 3
                    if (hours < 3) hours = 3;

                    const total = formData.Price * hours;
                    setFormData((prev) => ({
                      ...prev,
                      rider_hours: hours,
                      Total: total
                    }));
                  }}
                  min="3" // ✅ UI restriction
                />
              </div>
            )}

            <div>
              <Label>Total (AED)</Label>
              <Input
                type="number"
                value={Number(
                  isOneHourSubPackage
                    ? formData.Price * formData.rider_hours
                    : formData.Total
                ).toFixed(2)}
                disabled
              />
            </div>
            <div className="md:col-span-3">
              <Label>Notes</Label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full border rounded p-2 bg-[#FFF8EC]"
              />
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Customer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>
                Customer Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.customer_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customer_name: e.target.value
                  }))
                }
                required
              />
              {errors.customer_name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.customer_name}
                </p>
              )}
            </div>
            <div>
              <Label>
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    if (value.length <= 10) {
                      setFormData((prev) => ({ ...prev, phone: value }));
                    }
                  }
                }}
                required
                maxLength={10}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>
            <div>
              <Label>
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <DialogFooter className="mt-4">
        <Button
          variant="outline"
          onClick={() =>
            isEdit
              ? handleEditModalOpenChange(false)
              : handleCreateModalOpenChange(false)
          }
        >
          Cancel
        </Button>
        <Button
          disabled={isSaving}
          onClick={() => {
            console.log("Create/Save button clicked, isEdit:", isEdit);
            isEdit ? handleEditRide() : handleCreateRide();
          }}
        >
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isSaving ? "Processing..." : isEdit ? "Save Changes" : "Create"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Ride Management</h2>
          <p className="text-muted-foreground">Manage all ride bookings</p>
        </div>
        <Dialog
          open={isCreateModalOpen}
          onOpenChange={handleCreateModalOpenChange}
        >
          <Button onClick={() => handleCreateModalOpenChange(true)}>
            <Car className="w-4 h-4 mr-2" />
            Create Ride
          </Button>
          {renderModalContent(false)}
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Rides</p>
                <p className="text-2xl font-bold">{rideSummary.totalRides}</p>
              </div>
              <MapPin className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Ongoing</p>
                <p className="text-2xl font-bold">{rideSummary.onRoute}</p>
              </div>
              <Clock className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{rideSummary.pending}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">
                  AED {rideSummary.totalRevenue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card p-4 rounded-lg border border-primary">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-primary">
              Filters
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by customer, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1 block w-full p-2 border border-primary rounded-md bg-card"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
          <div className="flex gap-2">
            {[
              "all",
              "pending",
              "accepted",
              "on-route",
              "completed",
              "cancelled"
            ].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                className={
                  statusFilter === status
                    ? "bg-primary text-card mt-5"
                    : "bg-card text-primary mt-5"
                }
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rides ({rides.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.NO</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    No rides found
                  </TableCell>
                </TableRow>
              ) : (
                rides.map((ride, index) => (
                  <TableRow key={ride.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ride.customer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {ride.phone}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {ride.email || "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          {ride.pickup_location}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                          {ride.drop_location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {ride.scheduled_time
                            ? new Date(ride.scheduled_time).toLocaleString(
                                "en-GB"
                              )
                            : "-"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {ride.ride_date
                            ? new Date(ride.ride_date).toLocaleDateString(
                                "en-GB"
                              )
                            : "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{ride.car_name || "-"}</p>
                      <p className="text-sm text-muted-foreground">
                        {ride.package_name || "-"} -{" "}
                        {ride.subpackage_name || "-"}
                      </p>
                    </TableCell>
                    <TableCell>{getStatusBadge(ride.status)}</TableCell>
                    <TableCell>
                      <span className="font-medium">
                        AED{" "}
                        {ride.Price != null
                          ? Number(ride.Price).toFixed(2)
                          : "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        AED{" "}
                        {ride.Total != null
                          ? Number(ride.Total).toFixed(2)
                          : "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRide(ride)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Ride Details</DialogTitle>
                              <DialogDescription>
                                Complete information about ride #{ride.id}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedRide && (
                              <Tabs defaultValue="details" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                  <TabsTrigger
                                    value="details"
                                    className="data-[state=active]:bg-primary data-[state=active]:text-card"
                                  >
                                    Details
                                  </TabsTrigger>
                                  <TabsTrigger
                                    value="tracking"
                                    className="data-[state=active]:bg-primary data-[state=active]:text-card"
                                  >
                                    Tracking
                                  </TabsTrigger>
                                  <TabsTrigger
                                    value="history"
                                    className="data-[state=active]:bg-primary data-[state=active]:text-card"
                                  >
                                    History
                                  </TabsTrigger>
                                </TabsList>
                                <TabsContent
                                  value="details"
                                  className="space-y-4"
                                >
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">
                                        Customer Information
                                      </label>
                                      <div className="space-y-1">
                                        <p className="flex items-center text-sm">
                                          <User className="w-4 h-4 mr-2" />
                                          {selectedRide.customer_name}
                                        </p>
                                        <p className="flex items-center text-sm">
                                          <Phone className="w-4 h-4 mr-2" />
                                          {selectedRide.phone || "-"}
                                        </p>
                                        <p className="flex items-center text-sm">
                                          <MapPin className="w-4 h-4 mr-2" />
                                          {selectedRide.pickup_location || "-"}
                                        </p>{" "}
                                        {/* Removed w-[50px] here */}
                                        <p className="flex items-center text-sm">
                                          <MapPin className="w-4 h-4 mr-2" />
                                          {selectedRide.pickup_address || "-"}
                                        </p>
                                        <p className="flex items-center text-sm">
                                          <Mail className="w-4 h-4 mr-2" />
                                          {selectedRide.email || "-"}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">
                                        Ride Information
                                      </label>
                                      <div className="space-y-1">
                                        <p className="flex items-center text-sm">
                                          <Calendar className="w-4 h-4 mr-2" />
                                          {selectedRide.ride_date
                                            ? new Date(
                                                selectedRide.ride_date
                                              ).toLocaleString("en-GB")
                                            : "-"}
                                        </p>
                                        <p className="flex items-center text-sm">
                                          <Calendar className="w-4 h-4 mr-2" />
                                          {selectedRide.scheduled_time
                                            ? new Date(
                                                selectedRide.scheduled_time
                                              ).toLocaleString("en-GB")
                                            : "-"}
                                        </p>
                                        <p className="flex items-center text-sm">
                                          <Car className="w-4 h-4 mr-2" />
                                          {selectedRide.car_name || "-"}
                                        </p>
                                        <p className="flex items-center text-sm">
                                          <Car className="w-4 h-4 mr-2" />
                                          {selectedRide.package_name ||
                                            "-"} -{" "}
                                          {selectedRide.subpackage_name || "-"}
                                        </p>
                                        <p className="flex items-center text-sm">
                                          <DollarSign className="w-4 h-4 mr-2" />
                                          AED{" "}
                                          {Number(selectedRide.Price)
                                            ? Number(
                                                selectedRide.Price
                                              ).toFixed(2)
                                            : "0.00"}
                                        </p>
                                        <p className="flex items-center text-sm">
                                          <DollarSign className="w-4 h-4 mr-2" />
                                          Total: AED{" "}
                                          {Number(selectedRide.Total)
                                            ? Number(
                                                selectedRide.Total
                                              ).toFixed(2)
                                            : "0.00"}
                                        </p>
                                        {selectedRide.subpackage_name
                                          ?.toLowerCase()
                                          .includes("1 hour") && (
                                          <p className="flex items-center text-sm">
                                            <Clock className="w-4 h-4 mr-2" />
                                            {selectedRide.rider_hours} hours
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">
                                      Route
                                    </label>
                                    <div className="space-y-2">
                                      <div className="flex items-center text-sm">
                                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                        <span>
                                          Pickup: {selectedRide.pickup_location}
                                        </span>
                                      </div>
                                      <div className="flex items-center text-sm">
                                        <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                                        <span>
                                          Drop: {selectedRide.drop_location}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  {selectedRide.notes && (
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">
                                        Special Notes
                                      </label>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedRide.notes}
                                      </p>
                                    </div>
                                  )}
                                  {selectedRide.driver_id && (
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">
                                        Driver Information
                                      </label>
                                      <div className="space-y-1">
                                        <p className="flex items-center text-sm">
                                          <User className="w-4 h-4 mr-2" />
                                          Driver ID: {selectedRide.driver_id}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </TabsContent>
                                <TabsContent
                                  value="tracking"
                                  className="space-y-4"
                                >
                                  <div className="h-64 bg-gray-100 rounded-lg overflow-hidden">
                                    <MapView lat={25.2048} lng={55.2708} />
                                  </div>
                                </TabsContent>
                                <TabsContent
                                  value="history"
                                  className="space-y-4"
                                >
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      <div>
                                        <p className="text-sm">Ride created</p>
                                        <p className="text-xs text-muted-foreground">
                                          {new Date(
                                            selectedRide.createdAt
                                          ).toLocaleString("en-GB")}
                                        </p>
                                      </div>
                                    </div>
                                    {selectedRide.accept_time && (
                                      <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <div>
                                          <p className="text-sm">
                                            Ride accepted
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {new Date(
                                              selectedRide.accept_time
                                            ).toLocaleString("en-GB")}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    {selectedRide.pickup_time && (
                                      <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                        <div>
                                          <p className="text-sm">
                                            Pickup started
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {new Date(
                                              selectedRide.pickup_time
                                            ).toLocaleString("en-GB")}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    {selectedRide.dropoff_time && (
                                      <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <div>
                                          <p className="text-sm">
                                            Drop-off completed
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {new Date(
                                              selectedRide.dropoff_time
                                            ).toLocaleString("en-GB")}
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </TabsContent>
                              </Tabs>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(ride)}
                          disabled={
                            ride.status === "completed" ||
                            ride.status === "cancelled"
                          }
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Dialog
                          open={isCancelDialogOpen}
                          onOpenChange={setIsCancelDialogOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRideToCancel(ride);
                                setIsCancelDialogOpen(true);
                              }}
                              disabled={
                                ride.status === "completed" ||
                                ride.status === "cancelled"
                              }
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cancel Ride</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to cancel this ride? This
                                action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsCancelDialogOpen(false)}
                              >
                                No, keep ride
                              </Button>
                              <Button
                                variant="destructive"
                                className="bg-primary text-card hover:bg-primary hover:text-card"
                                disabled={isDeleting}
                                onClick={() => {
                                  if (rideToCancel) {
                                    handleCancelRide(rideToCancel.id);
                                  }
                                  setIsCancelDialogOpen(false);
                                  setRideToCancel(null);
                                }}
                              >
                                {isCancelling ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : null}
                                Yes, cancel ride
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!isLoading.packages &&
            !isLoading.subPackages &&
            !isLoading.cars &&
            !isLoading.baseFare &&
            rides.length > 0 && (
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

      <Dialog open={isEditModalOpen} onOpenChange={handleEditModalOpenChange}>
        {renderModalContent(true)}
      </Dialog>
    </div>
  );
};

export default Rides;
