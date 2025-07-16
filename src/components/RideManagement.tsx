import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Search, 
  MapPin, 
  Clock, 
  User, 
  Car, 
  Phone, 
  Eye, 
  Navigation,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface Ride {
  id: number;
  hotel_name: string;
  customer_name: string;
  phone: string;
  pickup_location: string;
  drop_location: string;
  car_model: string;
  scheduled_time: string;
  driver_name?: string;
  driver_id?: number;
  status: 'pending' | 'assigned' | 'ongoing' | 'completed' | 'cancelled';
  ride_type: 'scheduled' | 'immediate';
  fare: number;
  distance: string;
  duration: string;
  notes?: string;
  created_at: string;
}

export const RideManagement: React.FC<{ user: any }> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  const mockRides: Ride[] = [
    {
      id: 1,
      hotel_name: 'Burj Al Arab',
      customer_name: 'John Smith',
      phone: '+1 555 123 4567',
      pickup_location: 'Burj Al Arab Jumeirah',
      drop_location: 'Dubai Mall',
      car_model: 'BMW X5',
      scheduled_time: '2024-07-15T14:30:00',
      driver_name: 'Ahmed Hassan',
      driver_id: 1,
      status: 'ongoing',
      ride_type: 'scheduled',
      fare: 150,
      distance: '12.5 km',
      duration: '25 min',
      notes: 'VIP guest - handle with care',
      created_at: '2024-07-15T10:00:00'
    },
    {
      id: 2,
      hotel_name: 'Atlantis The Palm',
      customer_name: 'Sarah Johnson',
      phone: '+44 20 7123 4567',
      pickup_location: 'Atlantis The Palm',
      drop_location: 'Dubai International Airport',
      car_model: 'Mercedes S-Class',
      scheduled_time: '2024-07-15T16:00:00',
      status: 'pending',
      ride_type: 'scheduled',
      fare: 200,
      distance: '35 km',
      duration: '45 min',
      created_at: '2024-07-15T11:30:00'
    },
    {
      id: 3,
      hotel_name: 'Four Seasons Resort',
      customer_name: 'Michael Brown',
      phone: '+33 1 23 45 67 89',
      pickup_location: 'Four Seasons Resort Dubai',
      drop_location: 'Souk Madinat Jumeirah',
      car_model: 'Audi Q7',
      scheduled_time: '2024-07-15T12:00:00',
      driver_name: 'Mohammed Ali',
      driver_id: 2,
      status: 'completed',
      ride_type: 'immediate',
      fare: 80,
      distance: '8 km',
      duration: '15 min',
      created_at: '2024-07-15T11:45:00'
    }
  ];

  const filteredRides = mockRides.filter(ride => {
    const matchesSearch = ride.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ride.hotel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ride.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ride.drop_location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ride.status === statusFilter;
    
    // Hotel admin can only see their hotel's rides
if (user && user.role === 'hotel_admin') {
  return matchesSearch && matchesStatus && ride.hotel_name === 'Burj Al Arab';
}

    
    return matchesSearch && matchesStatus;
  });

  const handleAssignDriver = (rideId: number, driverId: number) => {
    console.log('Assigning driver', driverId, 'to ride', rideId);
    // API call to assign driver
  };

  const handleCancelRide = (rideId: number) => {
    console.log('Cancelling ride:', rideId);
    // API call to cancel ride
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': { variant: 'secondary', text: 'Pending' },
      'assigned': { variant: 'default', text: 'Assigned' },
      'ongoing': { variant: 'default', text: 'Ongoing' },
      'completed': { variant: 'default', text: 'Completed' },
      'cancelled': { variant: 'destructive', text: 'Cancelled' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant as any}>{config.text}</Badge>;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'text-yellow-600',
      'assigned': 'text-blue-600',
      'ongoing': 'text-green-600',
      'completed': 'text-gray-600',
      'cancelled': 'text-red-600'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Ride Management</h2>
          <p className="text-muted-foreground">
            {user &&user.role === 'hotel_admin' ? 'Manage your hotel bookings' : 'Monitor and manage all rides'}
          </p>
        </div>
        {user &&user.role === 'hotel_admin' && (
          <Button>
            <Car className="w-4 h-4 mr-2" />
            Book New Ride
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rides</p>
                <p className="text-2xl font-bold">{filteredRides.length}</p>
              </div>
              <MapPin className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ongoing</p>
                <p className="text-2xl font-bold">{filteredRides.filter(r => r.status === 'ongoing').length}</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{filteredRides.filter(r => r.status === 'pending').length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">AED {filteredRides.reduce((sum, r) => sum + r.fare, 0)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

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
                  placeholder="Search rides..."
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
                variant={statusFilter === 'ongoing' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('ongoing')}
              >
                Ongoing
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('completed')}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rides Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rides ({filteredRides.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fare</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRides.map((ride) => (
                <TableRow key={ride.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{ride.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{ride.hotel_name}</p>
                      <p className="text-sm text-muted-foreground">{ride.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        {ride.pickup_location}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        {ride.drop_location}
                      </div>
                      <p className="text-xs text-muted-foreground">{ride.distance} • {ride.duration}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{new Date(ride.scheduled_time).toLocaleString()}</p>
                      <Badge variant="outline" className="text-xs">
                        {ride.ride_type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {ride.driver_name ? (
                      <div>
                        <p className="text-sm font-medium">{ride.driver_name}</p>
                        <p className="text-sm text-muted-foreground">{ride.car_model}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(ride.status)}</TableCell>
                  <TableCell>
                    <span className="font-medium">AED {ride.fare}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedRide(ride)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Ride Details</DialogTitle>
                            <DialogDescription>
                              Complete information about ride #{ride.id}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedRide && (
                            <Tabs defaultValue="details" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="tracking">Tracking</TabsTrigger>
                                <TabsTrigger value="history">History</TabsTrigger>
                              </TabsList>
                              <TabsContent value="details" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Customer Information</label>
                                    <div className="space-y-1">
                                      <p className="flex items-center text-sm"><User className="w-4 h-4 mr-2" />{selectedRide.customer_name}</p>
                                      <p className="flex items-center text-sm"><Phone className="w-4 h-4 mr-2" />{selectedRide.phone}</p>
                                      <p className="flex items-center text-sm"><MapPin className="w-4 h-4 mr-2" />{selectedRide.hotel_name}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Ride Information</label>
                                    <div className="space-y-1">
                                      <p className="flex items-center text-sm"><Calendar className="w-4 h-4 mr-2" />{new Date(selectedRide.scheduled_time).toLocaleString()}</p>
                                      <p className="flex items-center text-sm"><Car className="w-4 h-4 mr-2" />{selectedRide.car_model}</p>
                                      <p className="flex items-center text-sm"><DollarSign className="w-4 h-4 mr-2" />AED {selectedRide.fare}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Route</label>
                                  <div className="space-y-2">
                                    <div className="flex items-center text-sm">
                                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                      <span>Pickup: {selectedRide.pickup_location}</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                      <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                                      <span>Drop: {selectedRide.drop_location}</span>
                                    </div>
                                  </div>
                                </div>
                                {selectedRide.notes && (
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Special Notes</label>
                                    <p className="text-sm text-muted-foreground">{selectedRide.notes}</p>
                                  </div>
                                )}
                              </TabsContent>
                              <TabsContent value="tracking" className="space-y-4">
                                <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                                  <div className="text-center">
                                    <Navigation className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm text-muted-foreground">Live tracking map would appear here</p>
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="history" className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <div>
                                      <p className="text-sm">Ride created</p>
                                      <p className="text-xs text-muted-foreground">{new Date(selectedRide.created_at).toLocaleString()}</p>
                                    </div>
                                  </div>
                                  {selectedRide.driver_name && (
                                    <div className="flex items-center space-x-3">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <div>
                                        <p className="text-sm">Driver assigned</p>
                                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {ride.status === 'pending' && user?.role !== 'hotel_admin' && (

                        <Select onValueChange={(value) => handleAssignDriver(ride.id, parseInt(value))}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Assign" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Ahmed Hassan</SelectItem>
                            <SelectItem value="2">Mohammed Ali</SelectItem>
                            <SelectItem value="3">Ravi Kumar</SelectItem>
                          </SelectContent>
                        </Select>
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