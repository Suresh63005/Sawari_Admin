'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function NotificationManagement() {
  return (
    <div className="space-y-6">
      {/* <div>
        <h2 className="text-2xl font-bold">Notifications</h2>
        <p className="text-muted-foreground">Send alerts to drivers and hotel admins</p>
      </div> */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">System maintenance scheduled</p>
                <p className="text-xs text-muted-foreground">Sent to all users • 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm font-medium">New ride booking available</p>
                <p className="text-xs text-muted-foreground">Sent to drivers • 1 hour ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}