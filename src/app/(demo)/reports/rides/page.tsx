"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Download, DollarSign } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import apiClient from "@/lib/apiClient";
import toast from "react-hot-toast";
import { debounce } from "lodash";

interface Ride {
  id: string;
  ride_code:string;
  customer_name: string | null;
  email: string | null;
  phone: string | null;
  pickup_address: string | null;
  drop_address: string | null;
  ride_date: string | null;
  scheduled_time: string | null;
  status: "pending" | "accepted" | "on-route" | "completed" | "cancelled";
  Price: number;
  Total: number;
  AssignedDriver: { first_name: string; last_name: string } | null;
  Car: { model: string } | null;
  Package: { name: string } | null;
  SubPackage: { name: string } | null;
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

const RideReports: React.FC = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [rideSummary, setRideSummary] = useState<RideSummary>({
    totalRides: 0,
    pending: 0,
    accepted: 0,
    onRoute: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
  });
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedFetchRides = useMemo(
    () =>
      debounce(
        async (search: string, status: string, page: number, limit: number) => {
          setIsLoading(true);
          try {
            const url =
              status === "all" || status === ""
                ? `/v1/admin/ridesreports/all?search=${encodeURIComponent(
                    search
                  )}&page=${page}&limit=${limit}`
                : `/v1/admin/ridesreports/all?search=${encodeURIComponent(
                    search
                  )}&status=${encodeURIComponent(
                    status
                  )}&page=${page}&limit=${limit}`;
            const response = await apiClient.get(url);
            const data = response.data.data || { rides: [], counts: {} };
            console.log(data, "Ride data fetched"); // Debug log
            setRides(data.rides || []);
            setTotalItems(data.counts.totalRides || 0);
            setRideSummary({
              totalRides: data.counts.totalRides || 0,
              pending: data.counts.pending || 0,
              accepted: data.counts.accepted || 0,
              onRoute: data.counts.onRoute || 0,
              completed: data.counts.completed || 0,
              cancelled: data.counts.cancelled || 0,
              totalRevenue: data.counts.totalRevenue || 0,
            });
          } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to fetch rides", {
              style: {
                background: "#622A39",
                color: "hsl(42, 51%, 91%)",
              },
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
              totalRevenue: 0,
            });
          } finally {
            setIsLoading(false);
          }
        },
        500
      ),
    []
  );

  useEffect(() => {
    debouncedFetchRides(searchTerm, statusFilter, currentPage, itemsPerPage);
    return () => debouncedFetchRides.cancel();
  }, [searchTerm, statusFilter, currentPage, itemsPerPage, debouncedFetchRides]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

const getStatusBadge = useCallback((status: string) => {
  type BadgeConfig = {
    variant: "default" | "secondary";
    text: string;
    className?: string; // optional for custom colors
  };

  const variants: Record<string, BadgeConfig> = {
    pending: { variant: "secondary", text: "Pending", className: "bg-yellow-600 text-white" },
    accepted: { variant: "default", text: "Accepted", className: "bg-green-600 text-white" },
    "on-route": { variant: "default", text: "On-Route", className: "bg-turquoise-600 text-white" },
    completed: { variant: "default", text: "Completed", className: "bg-green-600 text-white" },
    cancelled: { variant: "secondary", text: "Cancelled", className: "bg-red-600 text-white" },
  };

  const config = variants[status] || variants.pending;

  return <Badge variant={config.variant} className={config.className}>{config.text}</Badge>;
}, []);


  const downloadExcel = useCallback(async (rideId: string | null, isAll: boolean = false) => {
  try {
    const url = isAll
      ? `/v1/admin/ridesreports/export-all?search=${encodeURIComponent(searchTerm)}&status=${encodeURIComponent(statusFilter)}`
      : `/v1/admin/ridesreports/export/${rideId}`;

    const response = await apiClient.get(url, { responseType: "blob" });

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers['content-disposition'];
    let filename = 'report.xlsx'; // fallback
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?(.+)"?/);
      if (match && match[1]) filename = match[1];
    }

    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename; // use backend filename
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error: any) {
    toast.error(error.response?.data?.error || "Failed to download report", {
      style: {
        background: "#622A39",
        color: "hsl(42, 51%, 91%)",
      },
    });
  }
}, [searchTerm, statusFilter]);

// Utility function
const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
  const year = String(date.getFullYear()).slice(-2); // last 2 digits
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`; // DD/MM/YY HH:MM 24-hour
};


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Ride Reports</h2>
          <p className="text-muted-foreground">View and manage ride details</p>
        </div>
        <Button onClick={() => downloadExcel(null, true)} disabled={rides.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Download All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Rides</p>
                <p className="text-2xl font-bold">{rideSummary.totalRides}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
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
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">On-Route</p>
                <p className="text-2xl font-bold">{rideSummary.onRoute}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">AED {rideSummary.totalRevenue.toFixed(2)}</p>
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
              Search
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
            {["all", "pending", "accepted", "on-route", "completed", "cancelled"].map((status) => (
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
                <TableHead>Ride ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Driver/Vehicle</TableHead>
                <TableHead>Package/Subpackage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price/Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    No rides found
                  </TableCell>
                </TableRow>
              ) : (
                rides.map((ride, index) => (
                  <TableRow key={ride.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>{ride.ride_code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ride.customer_name || "-"}</p>
                        <p className="text-sm text-muted-foreground">{ride.email || "-"}</p>
                        <p className="text-sm text-muted-foreground">{ride.phone || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-muted-foreground">Pickup: {ride.pickup_address || "-"}</p>
                        <p className="text-sm text-muted-foreground">Drop: {ride.drop_address || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-muted-foreground">{ride.scheduled_time ? formatDateTime(ride.scheduled_time) : "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{ride.AssignedDriver ? `${ride.AssignedDriver.first_name} ${ride.AssignedDriver.last_name}` : "-"}</p>
                        <p className="text-sm text-muted-foreground">{ride.Car ? ride.Car.model : "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell> 
                      <div>
                        <p className="text-sm">{ride.Package ? ride.Package.name : "-"}</p>
                        <p className="text-sm text-muted-foreground">{ride.SubPackage ? ride.SubPackage.name : "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(ride.status)}</TableCell>
                    <TableCell>
                      <div>
                        AED {Number(ride.Price ?? 0).toFixed(2)}
                        <p className="text-sm text-muted-foreground">Total: AED {Number(ride.Total ?? 0).toFixed(2)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadExcel(ride.id)}
                          title="download"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
 {!isLoading && rides.length > 0 && (
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
        const maxVisiblePages = 5;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        const visiblePages = Array.from(
          { length: endPage - startPage + 1 },
          (_, i) => startPage + i
        );

        return (
          <>
            {visiblePages.map((page) => (
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
            ))}
            {totalPages > endPage && (
              <span className="px-2 py-1 text-sm text-muted-foreground">
                ...
              </span>
            )}
          </>
        );
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
    </div>
  );
};

export default RideReports;