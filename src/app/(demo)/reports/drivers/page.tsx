"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Download, User } from "lucide-react";
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

interface Driver {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: "active" | "inactive" | "blocked" | "rejected";
  Vehicles: DriverCar[];  // Fixed: Vehicles instead of cars
}

interface DriverCar {
  id: string;
  color: string | null;
  license_plate: string;
  status: "active" | "inactive" | "rejected";
  car_photos: any;
  rc_doc: string;
  insurance_doc: string;
  Car: { model: string | null };  // Added: For vehicle name
}

interface DriverSummary {
  totalDrivers: number;
  active: number;
  inactive: number;
  blocked: number;
  rejected: number;
}

const DriverReports: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverSummary, setDriverSummary] = useState<DriverSummary>({
    totalDrivers: 0,
    active: 0,
    inactive: 0,
    blocked: 0,
    rejected: 0,
  });
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedFetchDrivers = useMemo(
    () =>
      debounce(
        async (search: string, status: string, page: number, limit: number) => {
          setIsLoading(true);
          try {
            const url =
              status === "all" || status === ""
                ? `/v1/admin/driverreports/all?search=${encodeURIComponent(
                    search
                  )}&page=${page}&limit=${limit}`
                : `/v1/admin/driverreports/all?search=${encodeURIComponent(
                    search
                  )}&status=${encodeURIComponent(
                    status
                  )}&page=${page}&limit=${limit}`;
            const response = await apiClient.get(url);
            const data = response.data.data || { drivers: [], counts: {} };
            console.log(data, "Driver data fetched"); // Debug log
            setDrivers(data.drivers || []);
            setTotalItems(data.counts.totalDrivers || 0);
            setDriverSummary({
              totalDrivers: data.counts.totalDrivers || 0,
              active: data.counts.active || 0,
              inactive: data.counts.inactive || 0,
              blocked: data.counts.blocked || 0,
              rejected: data.counts.rejected || 0,
            });
          } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to fetch drivers", {
              style: {
                background: "#622A39",
                color: "hsl(42, 51%, 91%)",
              },
            });
            setDrivers([]);
            setTotalItems(0);
            setDriverSummary({
              totalDrivers: 0,
              active: 0,
              inactive: 0,
              blocked: 0,
              rejected: 0,
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
    debouncedFetchDrivers(searchTerm, statusFilter, currentPage, itemsPerPage);
    return () => debouncedFetchDrivers.cancel();
  }, [searchTerm, statusFilter, currentPage, itemsPerPage, debouncedFetchDrivers]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getStatusBadge = useCallback((status: string) => {
    const variants = {
      active: { variant: "default" as const, text: "Active" },
      inactive: { variant: "secondary" as const, text: "Inactive" },
      blocked: { variant: "destructive" as const, text: "Blocked" },
      rejected: { variant: "secondary" as const, text: "Rejected" },
    };
    const config = variants[status as keyof typeof variants] || variants.inactive;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  }, []);

  const downloadExcel = useCallback(async (driverId: string | null, isAll: boolean = false) => {
    try {
      const url = isAll
        ? `/v1/admin/driverreports/export-all?search=${encodeURIComponent(
            searchTerm
          )}&status=${encodeURIComponent(statusFilter)}`
        : `/v1/admin/driverreports/export/${driverId}`;
      const response = await apiClient.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = isAll
        ? `all_driver_reports_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`
        : `driver_report_${driverId}.xlsx`;
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Driver Reports</h2>
          <p className="text-muted-foreground">View and manage driver details</p>
        </div>
        <Button onClick={() => downloadExcel(null, true)} disabled={drivers.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Download All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Drivers</p>
                <p className="text-2xl font-bold">{driverSummary.totalDrivers}</p>
              </div>
              <User className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{driverSummary.active}</p>
              </div>
              <User className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold">{driverSummary.inactive}</p>
              </div>
              <User className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Blocked</p>
                <p className="text-2xl font-bold">{driverSummary.blocked}</p>
              </div>
              <User className="w-8 h-8 text-primary" />
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
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1 block w-full p-2 border border-primary rounded-md bg-card"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
          <div className="flex gap-2">
            {["all", "active", "inactive", "blocked", "rejected"].map((status) => (
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
          <CardTitle>Drivers ({drivers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.NO</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Vehicles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : drivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No drivers found
                  </TableCell>
                </TableRow>
              ) : (
                drivers.map((driver, index) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {driver.first_name} {driver.last_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {driver.email || "-"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {driver.phone || "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {driver?.Vehicles?.length > 0 ? (  // Fixed: Vehicles instead of cars
                          driver.Vehicles.map((car: DriverCar) => (
                            <p key={car.id} className="text-sm">
                              {car.Car?.model || "-"} - {car.license_plate} ({car.color || "-"}, {car.status})
                            </p>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">-</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(driver.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {/* Removed: View details dialog and User icon */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadExcel(driver.id)}
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
          {!isLoading && drivers.length > 0 && (
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
                <span className="px-2 py-1 text-sm text-muted-foreground">
                  ...
                </span>
              )}
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
              {showLastEllipsis && (
                <span className="px-2 py-1 text-sm text-muted-foreground">
                  ...
                </span>
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
    </div>
  );
};

export default DriverReports;