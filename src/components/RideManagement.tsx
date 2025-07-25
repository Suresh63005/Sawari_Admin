import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Search, MapPin, Clock, User, Car, Phone, Eye, Navigation,
  Calendar, DollarSign, AlertCircle
} from 'lucide-react';
import apiClient from '@/lib/apiClient';
import MapView from './MapView';

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
  status: 'pending' | 'accepted' | 'ongoing' | 'completed' | 'cancelled';
  ride_type: 'scheduled' | 'immediate';
  fare: number;
  distance: string;
  duration: string;
  notes?: string;
  createdAt: string;
  AssignedDriver: AssignedDriver | null;
  actual_cost: number; 
}

export interface RideSummary {
  totalRides: number;
  pending: number;
  accepted: number;
  onRoute: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
}

export interface Vehicle {
  car_brand: string;
  car_model: string;
}

export interface AssignedDriver {
  id: string;
  first_name: string;
  last_name: string;
  Vehicles: Vehicle[];
}




export const RideManagement: React.FC<{ user: any }> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rides, setRides] = useState<Ride[]>([]);
  const [driver, setDriver] = useState<AssignedDriver[]>([]);
  console.log(driver,"vvvvvvvvvvvvvvvvvvv")
  const [riderVehicle, setRiderVehicle] = useState<Vehicle>({
    car_brand: '',
    car_model: ''
    });
  const [ridesCount, setRiderCount] = useState<RideSummary>({
    totalRides: 0,
    pending: 0,
    accepted: 0,
    onRoute: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
  });
  console.log(rides, "rides data");
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  const fetchRides = async () => {
  try {
    const url = statusFilter === 'all' || statusFilter === ''
      ? `/v1/admin/ride/all?search=${searchTerm}`
      : `/v1/admin/ride/all?search=${searchTerm}&status=${statusFilter}`;
    const res = await apiClient.get(url);
    const data = res.data.data;;
    console.log(data, "data from api");
    setRides(data.rides || []);
    setDriver(data.rides)
    setRiderCount({
      totalRides: data.counts.totalRides || 0,
      pending: data.counts.pending || 0,
      accepted: data.counts.accepted || 0,
      onRoute: data.counts.on_route || 0,
      completed: data.counts.completed || 0,
      cancelled: data.counts.cancelled || 0,
      totalRevenue: data.totalRevenue || 0
    }
    );
    console.log('Fetched rides:', res.data.data?.rides);
  } catch (err) {
    console.error('Failed to fetch rides:', err);
  }
};

  useEffect(() => {
    fetchRides();
  }, [searchTerm, statusFilter]);

  // const handleAssignDriver = async (rideId: number, driverId: number) => {
  //   try {
  //     await apiClient.put(`/v1/admin/ride/assign-driver/${rideId}`, { driver_id: driverId });
  //     fetchRides();
  //   } catch (err) {
  //     console.error('Failed to assign driver:', err);
  //   }
  // };

const getStatusBadge = (status: string) => {
  const variants = {
    'pending': { variant: 'secondary', text: 'Pending' },
    'assigned': { variant: 'default', text: 'Assigned' },
    'on-route': { variant: 'default', text: 'on-route' },
    'completed': { variant: 'default', text: 'Completed' },
    'cancelled': { variant: 'secondary', text: 'Cancelled' } // ✅ fixed
  };
  const config = variants[status as keyof typeof variants] || variants.pending;
  return <Badge variant={config.variant as 'default' | 'secondary' | 'outline'}>{config.text}</Badge>;
};


 const filteredRides = rides?.filter(ride => {
  const matchesSearch =
    ride.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.hotel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ride.drop_location.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesStatus = statusFilter === 'all' || statusFilter === '' ? true : ride.status === statusFilter;

  const matchesHotel =
    user?.role !== 'hotel_admin' || ride.hotel_name === user?.hotel_name;

  return matchesSearch && matchesStatus && matchesHotel;
});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Ride Management</h2>
          <p className="text-muted-foreground">
            {user?.role === 'hotel_admin' ? 'Manage your hotel bookings' : 'Monitor and manage all rides'}
          </p>
        </div>
        {user?.role === 'hotel_admin' && (
          <Button>
            <Car className="w-4 h-4 mr-2" />
            Book New Ride
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex justify-between items-center">
          <div><p className="text-sm text-muted-foreground">Total Rides</p>
            <p className="text-2xl font-bold">{ridesCount?.totalRides}</p></div>
          <MapPin className="w-8 h-8 text-blue-500" /></div></CardContent></Card>

        <Card><CardContent className="p-4"><div className="flex justify-between items-center">
          <div><p className="text-sm text-muted-foreground">Ongoing</p>
            <p className="text-2xl font-bold">{ridesCount?.onRoute}</p></div>
          <Clock className="w-8 h-8 text-green-500" /></div></CardContent></Card>

        <Card><CardContent className="p-4"><div className="flex justify-between items-center">
          <div><p className="text-sm text-muted-foreground">Pending</p>
          
            <p className="text-2xl font-bold">{ridesCount?.pending}</p></div>
          <AlertCircle className="w-8 h-8 text-yellow-500" /></div></CardContent></Card>

        <Card><CardContent className="p-4"><div className="flex justify-between items-center">
          <div><p className="text-sm text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold">AED {ridesCount?.totalRevenue}</p></div>
          <DollarSign className="w-8 h-8 text-purple-500" /></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search rides..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="flex gap-2">
              {['all', 'pending','accepted', 'on-route', 'completed'].map(status => (
                <Button key={status} variant={statusFilter === status ? 'default' : 'outline'} onClick={() => setStatusFilter(status)}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

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
                    {ride.AssignedDriver ? (
                      <div>
                        <p className="text-sm font-medium">{`${ride?.AssignedDriver.first_name} ${ride?.AssignedDriver.last_name}`}</p>
                        <p className="text-sm text-muted-foreground">{`${ride?.AssignedDriver.Vehicles[0].car_brand} ${ride?.AssignedDriver.Vehicles[0].car_model}`}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
  <Badge
    variant="outline"
    className={`text-xs ${
      ride.status === 'pending'
        ? ' text-yellow-700'
        : ride.status === 'accepted'
        ? ' text-blue-700'
        : ride.status === 'completed'
        ? ' text-green-700'
        : ride.status === 'cancelled'
        ? ' text-red-400'
        : ''
    }`}
  >
    {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
  </Badge>
</TableCell>

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
                                      <p className="flex items-center text-sm"><MapPin className="w-4 h-4 mr-2" />{selectedRide.pickup_location}</p>
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
  <div className="h-64 bg-gray-100 rounded-lg overflow-hidden">
    <MapView lat={25.2048} lng={55.2708} /> 
  </div>
</TabsContent>
                              <TabsContent value="history" className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <div>
                                      <p className="text-sm">Ride created</p>
                                      <p className="text-xs text-muted-foreground">{new Date(selectedRide?.createdAt).toLocaleString()}</p>
                                    </div>
                                  </div>
                                  {selectedRide.AssignedDriver?.first_name && (
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
                      
                      {/* {ride.status === 'pending' && user?.role !== 'hotel_admin' && (

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
                      )} */}
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
