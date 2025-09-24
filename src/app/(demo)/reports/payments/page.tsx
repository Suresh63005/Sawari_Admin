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

interface Payment {
  id: string;
  amount: number;
  commission: number;
  payment_method: "bank_transfer" | "upi";
  transaction_id: string;
  payment_date: string | null;
  status: "pending" | "completed" | "failed";
  notes: string | null;
  driver: { first_name: string; last_name: string; email: string; phone: string } | null;
  ride: { customer_name: string; ride_date: string | null; status: string; Total: number } | null;
}

interface PaymentSummary {
  totalPayments: number;
  pending: number;
  completed: number;
  failed: number;
  totalAmount: number;
  totalCommission: number;
}

const PaymentReports: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({
    totalPayments: 0,
    pending: 0,
    completed: 0,
    failed: 0,
    totalAmount: 0,
    totalCommission: 0,
  });
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedFetchPayments = useMemo(
    () =>
      debounce(
        async (search: string, status: string, page: number, limit: number) => {
          setIsLoading(true);
          try {
            const url =
              status === "all" || status === ""
                ? `/v1/admin/paymentreports/all?search=${encodeURIComponent(
                    search
                  )}&page=${page}&limit=${limit}`
                : `/v1/admin/paymentreports/all?search=${encodeURIComponent(
                    search
                  )}&status=${encodeURIComponent(
                    status
                  )}&page=${page}&limit=${limit}`;
            const response = await apiClient.get(url);
            const data = response.data.data || { payments: [], counts: {} };
            setPayments(data.payments || []);
            setTotalItems(data.counts.totalPayments || 0);
            setPaymentSummary({
              totalPayments: data.counts.totalPayments || 0,
              pending: data.counts.pending || 0,
              completed: data.counts.completed || 0,
              failed: data.counts.failed || 0,
              totalAmount: data.counts.totalAmount || 0,
              totalCommission: data.counts.totalCommission || 0,
            });
          } catch (error: any) {
            toast.error(error.response?.data?.error || "Failed to fetch payments", {
              style: {
                background: "#622A39",
                color: "hsl(42, 51%, 91%)",
              },
            });
            setPayments([]);
            setTotalItems(0);
            setPaymentSummary({
              totalPayments: 0,
              pending: 0,
              completed: 0,
              failed: 0,
              totalAmount: 0,
              totalCommission: 0,
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
    debouncedFetchPayments(searchTerm, statusFilter, currentPage, itemsPerPage);
    return () => debouncedFetchPayments.cancel();
  }, [searchTerm, statusFilter, currentPage, itemsPerPage, debouncedFetchPayments]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getStatusBadge = useCallback((status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, text: "Pending" },
      completed: { variant: "default" as const, text: "Completed" },
      failed: { variant: "destructive" as const, text: "Failed" },
    };
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  }, []);

  const downloadExcel = useCallback(async (paymentId: string | null, isAll: boolean = false) => {
    try {
      const url = isAll
        ? `/v1/admin/paymentreports/export-all?search=${encodeURIComponent(
            searchTerm
          )}&status=${encodeURIComponent(statusFilter)}`
        : `/v1/admin/paymentreports/export/${paymentId}`;
      const response = await apiClient.get(url, { responseType: "blob" });
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = isAll
        ? `all_payment_reports_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`
        : `payment_report_${paymentId}.xlsx`;
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
          <h2 className="text-2xl font-bold">Payment Reports</h2>
          <p className="text-muted-foreground">View and manage payment details</p>
        </div>
        <Button onClick={() => downloadExcel(null, true)} disabled={payments.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Download All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold">{paymentSummary.totalPayments}</p>
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
                <p className="text-2xl font-bold">{paymentSummary.pending}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{paymentSummary.completed}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">AED {paymentSummary.totalAmount.toFixed(2)}</p>
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
                placeholder="Search by transaction ID, notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1 block w-full p-2 border border-primary rounded-md bg-card"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
          <div className="flex gap-2">
            {["all", "pending", "completed", "failed"].map((status) => (
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
          <CardTitle>Payments ({payments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.NO</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Customer/Ride</TableHead>
                <TableHead>Amount/Commission</TableHead>
                <TableHead>Method/Transaction</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    No payments found
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment, index) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {payment.driver ? `${payment.driver.first_name} ${payment.driver.last_name}` : "-"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.driver ? payment.driver.email : "-"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.driver ? payment.driver.phone : "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{payment.ride ? payment.ride.customer_name : "-"}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.ride && payment.ride.ride_date ? new Date(payment.ride.ride_date).toLocaleString() : "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">AED {payment.amount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Commission: AED {payment.commission.toFixed(2)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{payment.payment_method || "-"}</p>
                        <p className="text-sm text-muted-foreground">{payment.transaction_id || "-"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {payment.payment_date ? new Date(payment.payment_date).toLocaleString() : "-"}
                      </p>
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadExcel(payment.id)}
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
          {!isLoading && payments.length > 0 && (
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

export default PaymentReports;