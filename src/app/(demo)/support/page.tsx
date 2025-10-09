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
import apiClient from "@/lib/apiClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Eye, Search } from "lucide-react";
import toast from 'react-hot-toast';

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
  driver_name?: string;
  driver_phone?: string;
  images?: string[];
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
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchOpenTickets = async () => {
    try {
      const response = await apiClient.get<PaginatedResponse>(
        `/v1/admin/ticket?status=${selectedStatus}&search=${searchTerm}&page=${currentPage}&limit=${itemsPerPage}`
      );
      console.log(response, "Tickets Response");
      setTickets(response.data.data);
      setTotalItems(response.data.total);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch tickets",
        {
          style: {
            background: '#622A39',
            color: 'hsl(42, 51%, 91%)',
          },
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiClient.put(`/v1/admin/ticket/${id}/status`, { status });
      toast.success(
        `Ticket status updated to ${status}`,
        {
          style: {
            background: '#622A39',
            color: 'hsl(42, 51%, 91%)',
          },
        }
      );
      fetchOpenTickets();
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
        error.message ||
        "Failed to update ticket status",
        {
          style: {
            background: '#622A39',
            color: 'hsl(42, 51%, 91%)',
          },
        }
      );
    }
  };

  const openTicketModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const openImageModal = (image: string) => {
    setSelectedImage(image);
    setIsImageModalOpen(true);
  };

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
                setCurrentPage(1);
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
                <TableHead>Raised By</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created at</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
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
                    <TableCell>{ticket.driver_name || 'Unknown'}</TableCell>
                    <TableCell>{ticket.driver_phone || 'N/A'}</TableCell>
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
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
                <strong>Raised By:</strong> {selectedTicket.driver_name || 'Unknown'}
              </p>
              <p>
                <strong>Phone:</strong> {selectedTicket.driver_phone || 'N/A'}
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
              <p>
                <strong>Images:</strong>
                {selectedTicket.images && selectedTicket.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                    {selectedTicket.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Ticket image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-80"
                        onClick={() => openImageModal(image)}
                      />
                    ))}
                  </div>
                ) : (
                  " No images"
                )}
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

      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="p-0 border-0 bg-transparent max-w-[90vw] max-h-[90vh] sm:max-w-[80vw] sm:max-h-[80vh]">
          <div className="relative">
            <img
              src={selectedImage || ''}
              alt="Full-size ticket image"
              className="w-full h-auto max-h-[80vh] object-contain rounded-md"
            />
            <Button
              variant="outline"
              className="absolute top-2 right-2 bg-card text-primary"
              onClick={() => setIsImageModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}