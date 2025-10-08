"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import apiClient from "@/lib/apiClient";
import toast from "react-hot-toast";
import Loader from "@/components/ui/Loader";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import "quill/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface Settings {
  id?: string;
  weblogo?: string;
  web_name?: string;
  contact_email?: string;
  contact_phone?: string;
  tax_rate?: number;
  currency?: string;
  timezone?: string;
  about_us?: string;
  terms_conditions?: string;
  privacy_policy?: string;
  min_wallet_percentage?: number;
}

const currencies = [
  "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR", "AED",
  "SGD", "HKD", "NZD", "KRW", "BRL", "RUB", "ZAR", "TRY", "MXN", "SEK"
];

const timezones = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Africa/Johannesburg",
  "America/Sao_Paulo",
  "Asia/Seoul"
];

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    weblogo: "",
    web_name: "",
    contact_email: "",
    contact_phone: "",
    tax_rate: 0.0,
    currency: "",
    timezone: "",
    about_us: "",
    terms_conditions: "",
    privacy_policy: "",
    min_wallet_percentage: 0.0
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [initialSettings, setInitialSettings] = useState<Settings | null>(null);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<{ href: string; options?: any } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/v1/admin/settings");
        if (response.data.result) {
          setSettings(response.data.result);
          setInitialSettings(response.data.result);
        }
      } catch (err: any) {
        console.error("Fetch settings error:", err);
        setError(err.response?.data?.error || "Failed to fetch settings");
        toast.error(err.response?.data?.error || "Failed to fetch settings", {
          style: {
            background: "#622A39",
            color: "hsl(42, 51%, 91%)"
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    const originalPush = router.push;
    router.push = async (href: string, options?: any) => {
      if (isDirty) {
        setPendingNavigation({ href, options });
        setUnsavedDialogOpen(true);
        return;
      }
      return originalPush(href, options);
    };

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      router.push = originalPush;
    };
  }, [isDirty, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue: string | number = value;

    if (name === "tax_rate" || name === "min_wallet_percentage") {
      newValue = Math.max(0, parseFloat(value) || 0);
    }

    setSettings((prev) => ({ ...prev, [name]: newValue }));
    setIsDirty(JSON.stringify({ ...settings, [name]: newValue }) !== JSON.stringify(initialSettings));
  };

  const handleSelectChange = (name: string, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
    setIsDirty(JSON.stringify({ ...settings, [name]: value }) !== JSON.stringify(initialSettings));
  };

  const handleEditorChange = (name: string, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
    setIsDirty(JSON.stringify({ ...settings, [name]: value }) !== JSON.stringify(initialSettings));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await apiClient.post("/v1/admin/settings", settings);
      setSettings(response.data.result);
      setInitialSettings(response.data.result);
      setIsDirty(false);
      toast.success(response.data.message, {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
    } catch (err: any) {
      console.error("Save settings error:", err);
      toast.error(err.response?.data?.error || "Failed to save settings", {
        style: {
          background: "#622A39",
          color: "hsl(42, 51%, 91%)"
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmNavigation = () => {
    if (pendingNavigation) {
      router.push(pendingNavigation.href, pendingNavigation.options);
    }
    setUnsavedDialogOpen(false);
    setPendingNavigation(null);
  };

  const handleCancelNavigation = () => {
    setUnsavedDialogOpen(false);
    setPendingNavigation(null);
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"]
    ]
  };

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "link",
    "image"
  ];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    if (!value.startsWith("+971")) {
      value = "+971";
    }

    value = "+971" + value.slice(4).replace(/\D/g, "");

    if (value.length > 13) {
      value = value.slice(0, 13);
    }

    setSettings((prev) => ({ ...prev, contact_phone: value }));
    setIsDirty(JSON.stringify({ ...settings, contact_phone: value }) !== JSON.stringify(initialSettings));
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-red-600 text-xl font-semibold">Error</h2>
          <p className="text-gray-700 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="weblogo">Website Logo URL</Label>
              <Input
                id="weblogo"
                name="weblogo"
                value={settings.weblogo || ""}
                onChange={handleInputChange}
                placeholder="Enter website logo URL"
              />
            </div>
            <div>
              <Label htmlFor="web_name">Website Name</Label>
              <Input
                id="web_name"
                name="web_name"
                value={settings.web_name || ""}
                onChange={handleInputChange}
                placeholder="Enter website name"
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                value={settings.contact_email || ""}
                onChange={handleInputChange}
                placeholder="Enter contact email"
              />
            </div>
            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                name="contact_phone"
                value={settings.contact_phone || "+971"}
                onChange={handlePhoneChange}
                placeholder="+971XXXXXXXXX"
                maxLength={13}
              />
            </div>
            <div>
              <Label htmlFor="tax_rate">Tax</Label>
              <Input
                id="tax_rate"
                name="tax_rate"
                type="number"
                step="1"
                min="0"
                value={settings.tax_rate || 0.0}
                onChange={handleInputChange}
                placeholder="Enter tax rate"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                name="currency"
                value={settings.currency || ""}
                onValueChange={(value) => handleSelectChange("currency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {currencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                name="timezone"
                value={settings.timezone || ""}
                onValueChange={(value) => handleSelectChange("timezone", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {timezones.map((timezone) => (
                    <SelectItem key={timezone} value={timezone}>
                      {timezone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col space-y-2 mb-6">
              <Label htmlFor="about_us">About Us</Label>
              <ReactQuill
                value={settings.about_us || ""}
                onChange={(value) => handleEditorChange("about_us", value)}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Enter about us text"
                className="bg-[#FFF8EC]"
                style={{ height: "300px", marginBottom: "40px" }}
              />
            </div>
            <div className="flex flex-col space-y-2 mb-6">
              <Label htmlFor="terms_conditions">Terms & Conditions</Label>
              <ReactQuill
                value={settings.terms_conditions || ""}
                onChange={(value) =>
                  handleEditorChange("terms_conditions", value)
                }
                modules={quillModules}
                formats={quillFormats}
                placeholder="Enter terms and conditions"
                className="bg-[#FFF8EC]"
                style={{ height: "300px", marginBottom: "40px" }}
              />
            </div>
            <div className="flex flex-col space-y-2 mb-6">
              <Label htmlFor="privacy_policy">Privacy Policy</Label>
              <ReactQuill
                value={settings.privacy_policy || ""}
                onChange={(value) =>
                  handleEditorChange("privacy_policy", value)
                }
                modules={quillModules}
                formats={quillFormats}
                placeholder="Enter privacy policy"
                className="bg-[#FFF8EC]"
                style={{ height: "300px", marginBottom: "40px" }}
              />
            </div>
            <div>
              <Label htmlFor="min_wallet_percentage">
                Minimum Wallet Percentage (%)
              </Label>
              <Input
                id="min_wallet_percentage"
                name="min_wallet_percentage"
                type="number"
                step="1"
                min="0"
                value={settings.min_wallet_percentage || 0.0}
                onChange={handleInputChange}
                placeholder="Enter minimum wallet percentage"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={unsavedDialogOpen} onOpenChange={setUnsavedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave without saving?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelNavigation}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary text-card"
              onClick={handleConfirmNavigation}
            >
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;