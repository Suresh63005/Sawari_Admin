'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function SupportManagement() {
  return (
    <div className="space-y-6">
      {/* <div>
        <h2 className="text-2xl font-bold">Support & Disputes</h2>
        <p className="text-muted-foreground">Handle customer support tickets</p>
      </div> */}
      <Card>
        <CardHeader>
          <CardTitle>Open Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>#1234</TableCell>
                <TableCell>Payment issue</TableCell>
                <TableCell><Badge variant="destructive">High</Badge></TableCell>
                <TableCell><Badge variant="secondary">Open</Badge></TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">Resolve</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}