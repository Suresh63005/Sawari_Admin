"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import apiClient from "@/lib/apiClient";
import { Trash2 } from "lucide-react";
import Swal from "sweetalert2";

export default function Notifications() {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [includeImage, setIncludeImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null); // Track loading state for delete

  // Fetch users from /v1/admin/auth/admins endpoint
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await apiClient.get("/v1/admin/auth/admins");
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Fetch notifications from /v1/admin/notifications/all endpoint
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await apiClient.get("/v1/admin/notifications/all");
        console.log("Notifications API Response:", response.data.data);
        setNotifications(response.data.data || []);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchNotifications();
  }, []);

  const handleUserSelect = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
    );
  };

  const handleNotificationSelect = (id: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((notifId) => notifId !== id) : [...prev, id]
    );
  };

 const handleDeleteNotification = async (id: string) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  });

  if (!result.isConfirmed) return;

  setDeleteLoading(id); // Start loading indicator

  try {
    console.log("Attempting to delete notification ID:", id);
    
    const response = await apiClient.delete(`/v1/admin/notifications/delete/${id}`);
    
    console.log("Delete response:", response.data);

    Swal.fire({
      title: "Deleted!",
      text: response.data?.message || "Notification deleted successfully.",
      icon: "success",
      timer: 2000,
      showConfirmButton: false,
    });

    // Refresh the list
    const refreshed = await apiClient.get("/v1/admin/notifications/all");
    setNotifications(refreshed.data.data || []);
    
  } catch (error: any) {
    console.error("Error deleting notification:", error);

    const errorMessage =
      error?.response?.data?.message || error?.message || "Unknown error occurred";

    Swal.fire({
      title: "Error!",
      text: errorMessage,
      icon: "error",
      confirmButtonColor: "#dc3545",
      timer: 2000,
      showConfirmButton: false,
    });
  } finally {
    setDeleteLoading(null);
  }
};


  const handleSendNotification = async () => {
    if (!title || !message) {
      Swal.fire({
        title: "Error!",
        text: "Title and message are required",
        icon: "error",
        confirmButtonColor: "#dc3545", // Red color for error button
        timer: 2000,
        showConfirmButton: false,
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
      Swal.fire({
        title: "Success!",
        text: response.data.message,
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      setTitle("");
      setMessage("");
      setIncludeImage(false);
      setImageFile(null);
      // Refresh notifications after sending
      const fetchNotifications = async () => {
        const response = await apiClient.get("/v1/admin/notifications/all");
        setNotifications(response.data.data || []);
      };
      fetchNotifications();
    } catch (error) {
  setDeleteLoading(null);

  let errorMessage = "Unknown error occurred";

  if (error instanceof Error) {
    // This covers network errors, etc.
    errorMessage = error.message;
  }

  // Check for AxiosError with a response
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as any;
    errorMessage = axiosError.response?.data?.message || errorMessage;
  }

  console.error("Error deleting notification:", error);

  Swal.fire({
    title: "Error!",
    text: errorMessage,
    icon: "error",
    confirmButtonColor: "#dc3545",
    timer: 2000,
    showConfirmButton: false,
  });
}
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex space-x-6">
        <Card className="w-1/3">
          <CardHeader>
            <CardTitle>Send Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Selected Users</label>
                <p className="text-sm text-gray-500">{selectedUserIds.length} user(s) selected</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
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
                  <label className="block text-sm font-medium text-gray-700">Upload Image</label>
                  <Input
                    type="file"
                    onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                    className="mt-1"
                  />
                </div>
              )}
              <Button onClick={handleSendNotification} className="bg-black text-white hover:bg-gray-800 w-full">
                Send
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="w-2/3">
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Number</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!loading &&
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={() => handleUserSelect(user.id)}
                            className="mr-2"
                          />
                        </TableCell>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.phone || "-"}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Showing {users.length} of {users.length} rows
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead>Message Type</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => handleNotificationSelect(notification.id)}
                        className="mr-2"
                      />
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
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteNotification(notification.id)}
                        className={`bg-red-600 hover:bg-red-700 p-1 ${deleteLoading === notification.id ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={deleteLoading === notification.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Showing {notifications.length} of {notifications.length} rows
          </div>
        </CardContent>
      </Card>
    </div>
  );
}