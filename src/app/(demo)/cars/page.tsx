'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Car, Search } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { debounce } from 'lodash';
import Loader from '@/components/ui/Loader';

interface Car {
  id: string;
  brand: string;
  model: string;
  image_url: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
}

const Cars: React.FC = () => {
  const { toast } = useToast();
  const [cars, setCars] = useState<Car[]>([]);
  const [showCarForm, setShowCarForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [newCar, setNewCar] = useState({
    id: '',
    brand: '',
    model: '',
    image: null as File | null,
    image_url: null as string | null,
    status: 'active' as 'active' | 'inactive',
  });

  // Memoize the debounced fetchCars function
  const debouncedFetchCars = useCallback(
    debounce(async (query: string) => {
      try {
        setIsSearching(true);
        const response = await apiClient.get('/v1/admin/car', {
          params: { search: query, page: currentPage, limit: itemsPerPage },
        });
        setCars(response.data.result.data || []);
        setTotalItems(response.data.result.total || 0);
      } catch (err: any) {
        console.error('Fetch cars error:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err.response?.data?.error || 'Failed to fetch cars',
        });
        setCars([]);
        setTotalItems(0);
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [toast, currentPage, itemsPerPage] // Add pagination dependencies
  );

  // Initial fetch and search updates
useEffect(() => {
  // Initial fetch on component mount
    const fetchInitialCars = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/v1/admin/car', {
        params: { search: '', page: currentPage, limit: itemsPerPage },
      });
      setCars(response.data.result.data || []);
      setTotalItems(response.data.result.total || 0);
    } catch (err: any) {
      console.error('Fetch cars error:', err);
      setError(err.response?.data?.error || 'Failed to fetch cars');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.error || 'Failed to fetch cars',
      });
      setCars([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  fetchInitialCars();

  // No cleanup needed for initial fetch
}, []); // Empty dependency array for initial fetch only

useEffect(() => {
  if (searchQuery.trim() !== '') {
    // Run debounced search if query has text
    debouncedFetchCars(searchQuery);
  } else {
    // Fetch all cars when search is cleared
    (async () => {
      try {
        setIsSearching(true);
        const response = await apiClient.get('/v1/admin/car', {
          params: { search: '', page: currentPage, limit: itemsPerPage },
        });
        setCars(response.data.result.data || []);
        setTotalItems(response.data.result.total || 0);
      } catch (err: any) {
        console.error('Fetch cars error:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err.response?.data?.error || 'Failed to fetch cars',
        });
        setCars([]);
        setTotalItems(0);
      } finally {
        setIsSearching(false);
      }
    })();
  }

  return () => {
    debouncedFetchCars.cancel();
  };
}, [searchQuery, currentPage, itemsPerPage, debouncedFetchCars]);
 // Only depends on searchQuery and debouncedFetchCars

  const handleUpsertCar = async () => {
    if (!newCar.brand || !newCar.model) {
      toast({ variant: 'destructive', title: 'Error', description: 'Brand and model are required' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('brand', newCar.brand);
      formData.append('model', newCar.model);
      formData.append('status', newCar.status);
      if (newCar.image) {
        formData.append('image', newCar.image);
      } else if (newCar.id && newCar.image_url) {
        formData.append('image_url', newCar.image_url);
      }
      if (newCar.id) {
        formData.append('id', newCar.id);
      }

      const response = await apiClient.post('/v1/admin/car/upsert', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (newCar.id) {
        setCars(cars.map(car => (car.id === newCar.id ? response.data.data : car)));
      } else {
        setCars([...cars, response.data.data]);
      }

      setNewCar({ id: '', brand: '', model: '', image: null, image_url: null, status: 'active' });
      setShowCarForm(false);
      toast({ title: 'Success', description: response.data.message });
    } catch (err: any) {
      console.error('Upsert car error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.error || 'Failed to upsert car' });
    }
  };

  const handleDeleteCar = async (carId: string) => {
    try {
      const response = await apiClient.delete(`/v1/admin/car/${carId}`);
      setCars(cars.filter(car => car.id !== carId));
      toast({ title: 'Success', description: response.data.message });
    } catch (err: any) {
      console.error('Delete car error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.error || 'Failed to delete car' });
    }
  };

  const handleStatusSwitch = async (carId: string, checked: boolean) => {
    try {
      const response = await apiClient.patch(`/v1/admin/car/${carId}/status`);
      setCars(cars.map(c => (c.id === carId ? response.data.data : c)));
      toast({ title: 'Success', description: response.data.message });
    } catch (err: any) {
      console.error('Update status error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.error || 'Failed to update status' });
    }
  };

  const handleEditCar = (car: Car) => {
    setNewCar({
      id: car.id,
      brand: car.brand,
      model: car.model,
      image: null,
      image_url: car.image_url,
      status: car.status,
    });
    setShowCarForm(true);
  };

  const handleCreateCar = () => {
    setNewCar({ id: '', brand: '', model: '', image: null, image_url: null, status: 'active' });
    setShowCarForm(true);
  };

  const getStatusBadge = (status: 'active' | 'inactive') => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      default:
        return <Badge variant="secondary">Inactive</Badge>;
    }
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
if(loading) {
  return <Loader/>
}
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center w-1/3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search by brand or model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <Dialog open={showCarForm} onOpenChange={setShowCarForm}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateCar}>
              <Plus className="w-4 h-4 mr-2" />
              Create Car
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{newCar.id ? 'Edit Car' : 'Create New Car'}</DialogTitle>
              <DialogDescription>
                {newCar.id ? 'Update car details' : 'Add a new car to the system'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={newCar.brand}
                  onChange={(e) => setNewCar({ ...newCar, brand: e.target.value })}
                  placeholder="Enter car brand"
                />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={newCar.model}
                  onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
                  placeholder="Enter car model"
                />
              </div>
              <div>
                <Label htmlFor="image">Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewCar({ ...newCar, image: e.target.files?.[0] || null })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label>Status</Label>
                <Switch
                  checked={newCar.status === 'active'}
                  onCheckedChange={(checked) =>
                    setNewCar({ ...newCar, status: checked ? 'active' : 'inactive' })
                  }
                />
                <span>{newCar.status}</span>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCarForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpsertCar}>
                  {newCar.id ? 'Update Car' : 'Create Car'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cars ({cars.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* {isSearching && (
            <div className="flex justify-center items-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          )} */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car: Car) => (
                <TableRow key={car.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {car.image_url ? (
                        <img
                          src={car.image_url}
                          alt={`${car.brand} ${car.model}`}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <Car className="w-12 h-12 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium">{car.brand} {car.model}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(car.status)}
                      <Switch
                        checked={car.status === 'active'}
                        onCheckedChange={(checked) => handleStatusSwitch(car.id, checked)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>{new Date(car.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCar(car)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCar(car.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1 text-red-500" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
                    {!loading && totalItems > 0 && (
            <div className="mt-4 flex flex-col md:flex-row justify-between items-center">
              <div className="mb-2 md:mb-0">
                <label className="mr-2 text-sm text-primary">Items per page:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page
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
                  onClick={() => setCurrentPage(currentPage - 1)}
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
                    variant={currentPage === page ? 'default' : 'outline'}
                    className={currentPage === page ? 'bg-primary text-card' : 'bg-card text-primary'}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  onClick={() => setCurrentPage(currentPage + 1)}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Cars;