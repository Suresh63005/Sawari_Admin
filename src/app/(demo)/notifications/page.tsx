"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, Trash2 } from "lucide-react";
import apiClient from "@/lib/apiClient";
import toast from "react-hot-toast";
import { debounce } from "lodash";
import Loader from "@/components/ui/Loader";

export default function Notifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [includeImage, setIncludeImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; notificationId: string }>({ open: false, notificationId: "" });

  // Memoize the debounced fetchNotifications function
  const debouncedFetchNotifications = useMemo(
    () =>
      debounce(async (query: string, page: number, limit: number) => {
        try {
          const response = await apiClient.get("/v1/admin/notifications/all", {
            params: { search: query, page, limit },
          });
          setNotifications(response.data.data || []);
          setTotalItems(response.data.pagination?.total || 0);
        } catch (error: any) {
          console.error("Error fetching notifications:", error);
          toast.error(error.response?.data?.message || "Failed to fetch notifications", {
            style: {
              background: '#622A39',
              color: 'hsl(42, 51%, 91%)',
            },
          });
        } finally {
          setLoading(false);
        }
      }, 500),
    []
  );

  // Fetch notifications with search and pagination
  useEffect(() => {
    debouncedFetchNotifications(searchQuery, currentPage, itemsPerPage);

    return () => {
      debouncedFetchNotifications.cancel();
    };
  }, [searchQuery, currentPage, itemsPerPage, debouncedFetchNotifications]);

  const handleDeleteNotification = async (id: string) => {
    try {
      const response = await apiClient.delete(`/v1/admin/notifications/delete/${id}`);
      setNotifications(notifications.filter(notification => notification.id !== id));
      toast.success(response.data.message || "Notification deleted successfully", {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      toast.error(error.response?.data?.message || "Failed to delete notification", {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    } finally {
      setConfirmDelete({ open: false, notificationId: "" });
    }
  };

  const handleSendNotification = async () => {
    if (!title || !message) {
      toast.error("Title and message are required", {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("message", message);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const response = await apiClient.post("/v1/admin/notifications/sent", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to save notification");
      }
      toast.success(response.data.message || "Notification saved successfully", {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
      setTitle("");
      setMessage("");
      setIncludeImage(false);
      setImageFile(null);
      setCurrentPage(1);
      setSearchQuery("");
      const refreshed = await apiClient.get("/v1/admin/notifications/all", {
        params: { search: "", page: 1, limit: itemsPerPage },
      });
      console.log("Refreshed notifications response:", refreshed.data);
      setNotifications(refreshed.data.data || []);
      setTotalItems(refreshed.data.pagination?.total || 0);
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to save notification", {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Send Notification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message"
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={includeImage}
                  onChange={(e) => setIncludeImage(e.target.checked)}
                  className="mr-2"
                />
                Include Image
              </label>
            </div>
            {includeImage && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Upload Image
                </label>
                <Input
                  type="file"
                  onChange={(e) =>
                    setImageFile(e.target.files ? e.target.files[0] : null)
                  }
                  className="mt-1"
                />
              </div>
            )}
            <Button
              onClick={handleSendNotification}
              className="bg-black text-white hover:bg-gray-800 w-full"
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="relative w-fit">
        <Input
          placeholder="Search notifications..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-[300px] pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications ({totalItems})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Message Type</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification, index) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
                    <TableCell>{notification.title}</TableCell>
                    <TableCell>{notification.message}</TableCell>
                    <TableCell>
                      {notification.image ? (
                        <img
                          src={notification.image}
                          alt="Notification"
                          className="w-16 h-16 object-cover"
                        />
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>{notification.type || "General"}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDelete({ open: true, notificationId: notification.id })}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                variant="outline"
                className="text-primary"
              >
                Previous
              </Button>
              {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  variant={currentPage === page ? "default" : "outline"}
                  className={currentPage === page ? "bg-primary text-card" : "bg-card text-primary"}
                >
                  {page}
                </Button>
              ))}
              <Button
                onClick={() => setCurrentPage((p) => Math.min(Math.ceil(totalItems / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(totalItems / itemsPerPage)}
                variant="outline"
                className="text-primary"
              >
                Next
              </Button>
            </div>
            <span className="text-sm text-primary mt-2 md:mt-0">
              Page {currentPage} of {Math.ceil(totalItems / itemsPerPage)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmDelete.open} onOpenChange={() => setConfirmDelete({ open: false, notificationId: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete({ open: false, notificationId: "" })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteNotification(confirmDelete.notificationId)}
              className="bg-primary text-card hover:bg-primary hover:text-card"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}