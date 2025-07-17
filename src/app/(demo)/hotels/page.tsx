'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HotelManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Hotel Management</h2>
        <p className="text-muted-foreground">Manage hotel partnerships and onboarding</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Partner Hotels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hotel</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rides</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <div>
                    <p className="font-medium">Burj Al Arab</p>
                    <p className="text-sm text-muted-foreground">Jumeirah Beach</p>
                  </div>
                </TableCell>
                <TableCell>John Manager</TableCell>
                <TableCell><Badge variant="default">Active</Badge></TableCell>
                <TableCell>156 rides</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">View Details</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}