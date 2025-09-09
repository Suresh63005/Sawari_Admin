"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import apiClient from "@/lib/apiClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Eye, Search } from "lucide-react";

interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description?: string | null;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  raised_by: string;
  resolved_at?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

interface PaginatedResponse {
  data: Ticket[];
  total: number;
}

export default function SupportManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5); // Default items per page
  const [totalItems, setTotalItems] = useState<number>(0);

  const fetchOpenTickets = async () => {
    try {
      const response = await apiClient.get<PaginatedResponse>(
        `/v1/admin/ticket?status=${selectedStatus}&search=${searchTerm}&page=${currentPage}&limit=${itemsPerPage}`
      );
      setTickets(response.data.data);
      setTotalItems(response.data.total);
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch tickets",
        confirmButtonColor: "#d33"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiClient.put(`/v1/admin/ticket/${id}/status`, { status });
      Swal.fire({
        icon: "success",
        title: "Success",
        text: `Ticket status updated to ${status}`,
        confirmButtonColor: "#3085d6"
      });
      fetchOpenTickets();
      setIsModalOpen(false);
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.response?.data?.message ||
          error.message ||
          "Failed to update ticket status",
        confirmButtonColor: "#d33"
      });
    }
  };

  const openTicketModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  useEffect(() => {
    fetchOpenTickets();
  }, [searchTerm, selectedStatus, currentPage, itemsPerPage]);

  const statusOptions = ["All", "Open", "In Progress", "Resolved", "Closed"];

  return (
    <div className="space-y-6">
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
          {statusOptions.map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? "default" : "outline"}
              className={
                selectedStatus === status
                  ? "bg-primary text-card mt-5"
                  : "bg-card text-primary mt-5"
              }
              onClick={() => {
                setSelectedStatus(status);
                setCurrentPage(1); // Reset to first page when status changes
              }}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Ticket #</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created at</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No tickets found
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover:bg-primary hover:text-card"
                    onClick={() => openTicketModal(ticket)}
                  >
                    <TableCell>
                      {tickets.indexOf(ticket) + 1 + (currentPage - 1) * itemsPerPage}
                    </TableCell>
                    <TableCell>#{ticket.ticket_number}</TableCell>
                    <TableCell>{ticket.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          ticket.priority === "urgent" ||
                          ticket.priority === "high"
                            ? "destructive"
                            : ticket.priority === "medium"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {ticket.priority.charAt(0).toUpperCase() +
                          ticket.priority.slice(1)}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary">
                        {ticket.status.charAt(0).toUpperCase() +
                          ticket.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(ticket.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })}
                    </TableCell>
                    <TableCell>
                      <Eye />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Controls placed outside and below the table */}
          {!loading && totalItems > 0 && (
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
    <div className="flex space-x-2">
      <Button
        onClick={() => paginate(currentPage - 1)}
        disabled={currentPage === 1}
        variant="outline"
        className="text-primary"
      >
        Previous
      </Button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <Button
          key={page}
          onClick={() => paginate(page)}
          variant={currentPage === page ? 'default' : 'outline'}
          className={currentPage === page ? 'bg-primary text-card' : 'bg-card text-primary'}
        >
          {page}
        </Button>
      ))}
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

      {/* Ticket Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <p>
                <strong>Ticket #:</strong> {selectedTicket.ticket_number}
              </p>
              <p>
                <strong>Title:</strong> {selectedTicket.title}
              </p>
              <p>
                <strong>Description:</strong>{" "}
                {selectedTicket.description || "No description"}
              </p>
              <p>
                <strong>Priority:</strong> {selectedTicket.priority}
              </p>
              <p>
                <strong>Status:</strong> {selectedTicket.status}
              </p>
              <p>
                <strong>Created At:</strong>{" "}
                {new Date(selectedTicket.createdAt).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })}
              </p>
            </div>
          )}
          <DialogFooter>
            {selectedTicket?.status === "open" && (
              <Button
                onClick={() =>
                  handleUpdateStatus(selectedTicket.id, "in_progress")
                }
              >
                Start
              </Button>
            )}
            {selectedTicket?.status === "in_progress" && (
              <>
                <Button
                  onClick={() =>
                    handleUpdateStatus(selectedTicket.id, "resolved")
                  }
                  className="mr-2"
                >
                  Resolve
                </Button>
                <Button
                  onClick={() =>
                    handleUpdateStatus(selectedTicket.id, "closed")
                  }
                >
                  Close
                </Button>
              </>
            )}
            {selectedTicket?.status === "resolved" && (
              <Button
                onClick={() => handleUpdateStatus(selectedTicket.id, "closed")}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
