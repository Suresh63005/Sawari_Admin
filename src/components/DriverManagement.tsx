import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Ban, 
  UnlockIcon,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Languages
} from 'lucide-react';

interface Driver {
  id: number;
  name: string;
  email: string;
  phone: string;
  dob: string;
  experience: number;
  languages: string[];
  status: 'active' | 'inactive' | 'blocked';
  is_approved: boolean;
  rating: number;
  total_rides: number;
  joined_date: string;
  license_expiry: string;
  documents: {
    license_front: string;
    license_back: string;
    gov_id: string;
  };
  vehicles: number;
}

export const DriverManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const mockDrivers: Driver[] = [
    {
      id: 1,
      name: 'Ahmed Hassan',
      email: 'ahmed@example.com',
      phone: '+971 50 123 4567',
      dob: '1985-03-15',
      experience: 8,
      languages: ['Arabic', 'English'],
      status: 'active',
      is_approved: true,
      rating: 4.8,
      total_rides: 156,
      joined_date: '2024-01-15',
      license_expiry: '2025-03-15',
      documents: {
        license_front: 'license_front.jpg',
        license_back: 'license_back.jpg',
        gov_id: 'emirates_id.jpg'
      },
      vehicles: 1
    },
    {
      id: 2,
      name: 'Mohammed Ali',
      email: 'mohammed@example.com',
      phone: '+971 55 234 5678',
      dob: '1990-07-22',
      experience: 5,
      languages: ['Arabic', 'English', 'Urdu'],
      status: 'active',
      is_approved: false,
      rating: 0,
      total_rides: 0,
      joined_date: '2024-07-10',
      license_expiry: '2025-07-22',
      documents: {
        license_front: 'license_front.jpg',
        license_back: 'license_back.jpg',
        gov_id: 'emirates_id.jpg'
      },
      vehicles: 0
    },
    {
      id: 3,
      name: 'Ravi Kumar',
      email: 'ravi@example.com',
      phone: '+971 56 345 6789',
      dob: '1988-11-10',
      experience: 6,
      languages: ['English', 'Hindi', 'Arabic'],
      status: 'blocked',
      is_approved: true,
      rating: 4.2,
      total_rides: 89,
      joined_date: '2024-02-20',
      license_expiry: '2025-11-10',
      documents: {
        license_front: 'license_front.jpg',
        license_back: 'license_back.jpg',
        gov_id: 'emirates_id.jpg'
      },
      vehicles: 2
    }
  ];

  const filteredDrivers = mockDrivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'pending' && !driver.is_approved) ||
                         (statusFilter === 'approved' && driver.is_approved && driver.status === 'active') ||
                         (statusFilter === 'blocked' && driver.status === 'blocked');
    
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (driverId: number) => {
    console.log('Approving driver:', driverId);
    // API call to approve driver
  };

  const handleReject = (driverId: number) => {
    console.log('Rejecting driver:', driverId);
    // API call to reject driver
  };

  const handleBlock = (driverId: number) => {
    console.log('Blocking driver:', driverId);
    // API call to block driver
  };

  const handleUnblock = (driverId: number) => {
    console.log('Unblocking driver:', driverId);
    // API call to unblock driver
  };

  const getStatusBadge = (driver: Driver) => {
    if (!driver.is_approved) {
      return <Badge variant="secondary">Pending</Badge>;
    }
    if (driver.status === 'blocked') {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Driver Management</h2>
          <p className="text-muted-foreground">Manage driver approvals and status</p>
        </div>
      </div> */}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search drivers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('approved')}
              >
                Approved
              </Button>
              <Button
                variant={statusFilter === 'blocked' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('blocked')}
              >
                Blocked
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Drivers ({filteredDrivers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>{driver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-sm text-muted-foreground">{driver.total_rides} rides</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{driver.phone}</p>
                      <p className="text-sm text-muted-foreground">{driver.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{driver.experience} years</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span>{driver.rating || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(driver)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedDriver(driver)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Driver Details</DialogTitle>
                            <DialogDescription>
                              Complete information about {driver.name}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedDriver && (
                            <Tabs defaultValue="profile" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="profile">Profile</TabsTrigger>
                                <TabsTrigger value="documents">Documents</TabsTrigger>
                                <TabsTrigger value="performance">Performance</TabsTrigger>
                              </TabsList>
                              <TabsContent value="profile" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Personal Information</label>
                                    <div className="space-y-1">
                                      <p className="flex items-center text-sm"><Calendar className="w-4 h-4 mr-2" />Born: {selectedDriver.dob}</p>
                                      <p className="flex items-center text-sm"><Phone className="w-4 h-4 mr-2" />{selectedDriver.phone}</p>
                                      <p className="flex items-center text-sm"><Mail className="w-4 h-4 mr-2" />{selectedDriver.email}</p>
                                      <p className="flex items-center text-sm"><Languages className="w-4 h-4 mr-2" />{selectedDriver.languages.join(', ')}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Professional Info</label>
                                    <div className="space-y-1">
                                      <p className="text-sm">Experience: {selectedDriver.experience} years</p>
                                      <p className="text-sm">License Expiry: {selectedDriver.license_expiry}</p>
                                      <p className="text-sm">Vehicles: {selectedDriver.vehicles}</p>
                                      <p className="text-sm">Joined: {selectedDriver.joined_date}</p>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="documents" className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Required Documents</label>
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between p-2 border rounded">
                                        <span className="text-sm">Driving License (Front)</span>
                                        <Button variant="outline" size="sm">View</Button>
                                      </div>
                                      <div className="flex items-center justify-between p-2 border rounded">
                                        <span className="text-sm">Driving License (Back)</span>
                                        <Button variant="outline" size="sm">View</Button>
                                      </div>
                                      <div className="flex items-center justify-between p-2 border rounded">
                                        <span className="text-sm">Government ID</span>
                                        <Button variant="outline" size="sm">View</Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="performance" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Performance Stats</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-sm">Total Rides</span>
                                          <span className="text-sm font-medium">{selectedDriver.total_rides}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm">Rating</span>
                                          <span className="text-sm font-medium">{selectedDriver.rating}/5</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-sm">Completion Rate</span>
                                          <span className="text-sm font-medium">94%</span>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-sm">Recent Activity</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Last ride: 2 hours ago</p>
                                        <p className="text-sm text-muted-foreground">Online time: 8h 30m today</p>
                                        <p className="text-sm text-muted-foreground">Earnings: AED 1,250 this week</p>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {!driver.is_approved && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(driver.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReject(driver.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      
                      {driver.is_approved && (
                        <>
                          {driver.status === 'blocked' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnblock(driver.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <UnlockIcon className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleBlock(driver.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Ban className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};