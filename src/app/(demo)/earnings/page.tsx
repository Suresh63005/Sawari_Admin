'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function EarningsManagement({ user }: { user: any }) {
  // Only show earnings if user has permission
  if (user && !user.permissions?.earnings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Access Restricted</h3>
          <p className="text-sm text-gray-500">You don't have permission to view earnings data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Earnings & Commissions</h2>
        <p className="text-muted-foreground">Track revenue and manage payouts</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">AED 125,000</p>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Commission Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">AED 12,500</p>
            <p className="text-sm text-muted-foreground">10% average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">AED 8,750</p>
            <p className="text-sm text-muted-foreground">To 23 drivers</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}