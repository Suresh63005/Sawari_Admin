"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Car, Search, Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { debounce, set } from 'lodash';
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
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; carId: string }>({ open: false, carId: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Memoize the debounced fetchCars function
  const debouncedFetchCars = useMemo(
    () =>
      debounce(async (query: string, page: number, limit: number) => {
        try {
          setIsSearching(true);
          const response = await apiClient.get('/v1/admin/car', {
            params: { search: query, page, limit },
          });
          setCars(response.data.result.data || []);
          setTotalItems(response.data.result.total || 0);
        } catch (err: any) {
          toast.error(err.response?.data?.error || 'Failed to fetch cars', {
            style: {
              background: '#622A39',
              color: 'hsl(42, 51%, 91%)',
            },
          });
        } finally {
          setIsSearching(false);
        }
      }, 500),
    []
  );

  // Initial fetch
  useEffect(() => {
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
        toast.error(err.response?.data?.error || 'Failed to fetch cars', {
          style: {
            background: '#622A39',
            color: 'hsl(42, 51%, 91%)',
          },
        });
        setCars([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialCars();
  }, []);

  // Search and pagination updates
  useEffect(() => {
    if (searchQuery.trim() !== '') {
      debouncedFetchCars(searchQuery, currentPage, itemsPerPage);
    } else {
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
          toast.error(err.response?.data?.error || 'Failed to fetch cars', {
            style: {
              background: '#622A39',
              color: 'hsl(42, 51%, 91%)',
            },
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

  const handleUpsertCar = async () => {
    if (!newCar.brand || !newCar.model) {
      toast.error('Brand and model are required', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
      return;
    }
setIsSaving(true);
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
      toast.success(response.data.message, {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    } catch (err: any) {
      console.error('Upsert car error:', err);
      toast.error(err.response?.data?.error || 'Failed to upsert car', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCar = async (carId: string) => {
    setIsDeleting(true);
    try {
      const response = await apiClient.delete(`/v1/admin/car/${carId}`);
      setCars(cars.filter(car => car.id !== carId));
      toast.success(response.data.message, {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    } catch (err: any) {
      console.error('Delete car error:', err);
      toast.error(err.response?.data?.error || 'Failed to delete car', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    } finally {
      setConfirmDelete({ open: false, carId: '' });
      setIsDeleting(false);
    }
  };

  const handleStatusSwitch = async (carId: string, checked: boolean) => {
    try {
      const response = await apiClient.patch(`/v1/admin/car/${carId}/status`);
      setCars(cars.map(c => (c.id === carId ? response.data.data : c)));
      toast.success(response.data.message, {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    } catch (err: any) {
      console.error('Update status error:', err);
      toast.error(err.response?.data?.error || 'Failed to update status', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
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
  // if (loading) {
  //   return <Loader />;
  // }

  return (
    <div className="space-y-6">
      {loading && <Loader />}
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
          <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
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
                {newCar.image_url && !newCar.image && (
                  <div className="mb-2">
                    <img
                      src={newCar.image_url}
                      alt="Car"
                      className="w-24 h-24 object-cover rounded"
                    />
                  </div>
                )}
                {newCar.image && (
                  <div className="mb-2">
                    <img
                      src={URL.createObjectURL(newCar.image)}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded"
                    />
                  </div>
                )}
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
                <Button onClick={handleUpsertCar} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.NO</TableHead>
                <TableHead>Car Models</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car: Car, index: number) => (
                <TableRow key={car.id}>
                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
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
                  <TableCell>
                    {new Date(car.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCar(car)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                      
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmDelete({ open: true, carId: car.id })}
                      >
                        <Trash2 className="w-4 h-4 mr-1 text-primary" />
                        
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
                    setCurrentPage(1);
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

      <Dialog open={confirmDelete.open} onOpenChange={() => setConfirmDelete({ open: false, carId: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this car? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete({ open: false, carId: '' })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteCar(confirmDelete.carId)}
              className='bg-primary text-card hover:bg-primary hover:text-card'
              disabled={isDeleting}
            >
              {isDeleting && (
                <Loader2 className="inline-block h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}  
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cars;