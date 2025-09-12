'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { debounce } from 'lodash';
import Loader from '@/components/ui/Loader';

interface Package {
  id: string;
  name: string;
}

interface SubPackage {
  id: string;
  name: string;
}

interface Car {
  id: string;
  brand: string;
  model: string;
}

interface PackagePrice {
  id: string;
  package_id: string;
  sub_package_id: string;
  car_id: string;
  base_fare: number;
  description: string | null;
  status: boolean;
  createdAt: string;
}

interface NewPackagePrice {
  id: string;
  package_id: string;
  sub_package_id: string;
  car_id: string;
  base_fare: string;
  description: string;
  status: boolean;
}

const PackagePrices: React.FC = () => {
  const [packagePrices, setPackagePrices] = useState<PackagePrice[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [subPackages, setSubPackages] = useState<SubPackage[]>([]); // For dropdown
  const [allSubPackages, setAllSubPackages] = useState<SubPackage[]>([]); // For table display
  const [cars, setCars] = useState<Car[]>([]);
  const [showPackagePriceForm, setShowPackagePriceForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePackagePriceId, setDeletePackagePriceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [newPackagePrice, setNewPackagePrice] = useState<NewPackagePrice>({
    id: '',
    package_id: '',
    sub_package_id: '',
    car_id: '',
    base_fare: '',
    description: '',
    status: true,
  });

  // Parse package price data to ensure base_fare is a number
  const parsePackagePrice = (data: any): PackagePrice => ({
    id: data.id,
    package_id: data.package_id,
    sub_package_id: data.sub_package_id,
    car_id: data.car_id,
    base_fare: parseFloat(data.base_fare), // Convert to number
    description: data.description,
    status: data.status,
    createdAt: data.createdAt,
  });

  // Fetch packages, cars, and all sub-packages for table display
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [packagesResponse, carsResponse, subPackagesResponse] = await Promise.all([
          apiClient.get('/v1/admin/package/active'),
          apiClient.get('/v1/admin/car/list'),
          apiClient.get('/v1/admin/sub-package/active'),
        ]);
        setPackages(packagesResponse.data);
        setCars(carsResponse.data);
        setAllSubPackages(subPackagesResponse.data);
      } catch (err: any) {
        console.error('Fetch dropdown data error:', err);
        toast.error(err.response?.data?.error || 'Failed to fetch dropdown data', {
          style: {
            background: '#622A39',
            color: 'hsl(42, 51%, 91%)',
          },
        });
      }
    };

    fetchDropdownData();
  }, []);

  // Fetch sub-packages for dropdown when package_id changes
  useEffect(() => {
    const fetchSubPackages = async () => {
      if (newPackagePrice.package_id) {
        console.log('Fetching sub-packages for package_id:', newPackagePrice.package_id); // Debug log
        try {
          const response = await apiClient.get(`/v1/admin/packageprice/sub-packages/${newPackagePrice.package_id}`);
          console.log('Sub-packages response:', response.data.result.data); // Debug log
          setSubPackages(response.data.result.data);
        } catch (err: any) {
          console.error('Fetch sub-packages error:', err);
          toast.error(err.response?.data?.error || 'Failed to fetch sub-packages', {
            style: {
              background: '#622A39',
              color: 'hsl(42, 51%, 91%)',
            },
          });
          setSubPackages([]);
        }
      } else {
        console.log('No package_id selected, clearing sub-packages'); // Debug log
        setSubPackages([]);
        setNewPackagePrice((prev) => ({ ...prev, sub_package_id: '' }));
      }
    };

    fetchSubPackages();
  }, [newPackagePrice.package_id]);

  // Memoize the debounced fetchPackagePrices function
  const debouncedFetchPackagePrices = useCallback(
    debounce(async (query: string, page: number, limit: number) => {
      try {
        const response = await apiClient.get('/v1/admin/packageprice', {
          params: { search: query, page, limit },
        });
        setPackagePrices(response.data.result.data.map(parsePackagePrice));
        setTotalItems(response.data.result.total);
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Failed to fetch package prices', {
          style: {
            background: '#622A39',
            color: 'hsl(42, 51%, 91%)',
          },
        });
      }
    }, 500),
    []
  );

  // Initial fetch
  useEffect(() => {
    const fetchInitialPackagePrices = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/v1/admin/packageprice', {
          params: { search: '', page: currentPage, limit: itemsPerPage },
        });
        setPackagePrices(response.data.result.data.map(parsePackagePrice));
        setTotalItems(response.data.result.total);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch package prices');
        toast.error(err.response?.data?.error || 'Failed to fetch package prices', {
          style: {
            background: '#622A39',
            color: 'hsl(42, 51%, 91%)',
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialPackagePrices();
  }, []);

  // Debounced fetch for search + pagination
  useEffect(() => {
    debouncedFetchPackagePrices(searchQuery, currentPage, itemsPerPage);
    return () => debouncedFetchPackagePrices.cancel();
  }, [searchQuery, currentPage, itemsPerPage, debouncedFetchPackagePrices]);

  const handleUpsertPackagePrice = async () => {
    if (!newPackagePrice.package_id || !newPackagePrice.sub_package_id || !newPackagePrice.car_id || !newPackagePrice.base_fare) {
      toast.error('Package, Sub-Package, Car, and Base Fare are required', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
      return;
    }

    const base_fare = parseFloat(newPackagePrice.base_fare);
    if (isNaN(base_fare) || base_fare < 0) {
      toast.error('Base Fare must be a valid non-negative number', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
      return;
    }

    try {
      const payload: Partial<PackagePrice> & { id?: string } = {
        package_id: newPackagePrice.package_id,
        sub_package_id: newPackagePrice.sub_package_id,
        car_id: newPackagePrice.car_id,
        base_fare,
        description: newPackagePrice.description || null,
        status: newPackagePrice.status,
      };
      if (newPackagePrice.id) {
        payload.id = newPackagePrice.id;
      }

      console.log('Upserting package price with payload:', payload); // Debug log
      const response = await apiClient.post('/v1/admin/packageprice/upsert', payload);

      if (newPackagePrice.id) {
        setPackagePrices(packagePrices.map(pp => (pp.id === newPackagePrice.id ? parsePackagePrice(response.data.data) : pp)));
      } else {
        setPackagePrices([...packagePrices, parsePackagePrice(response.data.data)]);
      }

      setNewPackagePrice({
        id: '',
        package_id: '',
        sub_package_id: '',
        car_id: '',
        base_fare: '',
        description: '',
        status: true,
      });
      setSubPackages([]);
      setShowPackagePriceForm(false);
      toast.success(response.data.message, {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    } catch (err: any) {
      console.error('Upsert package price error:', err);
      toast.error(err.response?.data?.error || 'Failed to upsert package price', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    }
  };

  const handleDeletePackagePrice = async (packagePriceId: string) => {
    if (!packagePriceId) {
      console.error('Invalid package price ID for delete:', packagePriceId); // Debug log
      toast.error('Invalid package price ID', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
      return;
    }
    try {
      console.log('Deleting package price ID:', packagePriceId); // Debug log
      const response = await apiClient.delete(`/v1/admin/packageprice/${packagePriceId}`);
      setPackagePrices(packagePrices.filter(pp => pp.id !== packagePriceId));
      toast.success(response.data.message, {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    } catch (err: any) {
      console.error('Delete package price error:', err);
      toast.error(err.response?.data?.error || 'Failed to delete package price', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    } finally {
      setShowDeleteConfirm(false);
      setDeletePackagePriceId(null);
    }
  };

  const handleStatusSwitch = async (packagePriceId: string, checked: boolean) => {
    if (!packagePriceId) {
      console.error('Invalid package price ID for status switch:', packagePriceId); // Debug log
      toast.error('Invalid package price ID', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
      return;
    }
    try {
      console.log('Toggling status for package price ID:', packagePriceId); // Debug log
      const response = await apiClient.patch(`/v1/admin/packageprice/${packagePriceId}/status`);
      console.log('Status switch response base_fare:', response.data.data.base_fare, 'type:', typeof response.data.data.base_fare); // Debug log
      setPackagePrices(packagePrices.map(pp => (pp.id === packagePriceId ? parsePackagePrice(response.data.data) : pp)));
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

  const handleEditPackagePrice = async (pp: PackagePrice) => {
    console.log('Attempting to edit package price:', {
      id: pp.id,
      package_id: pp.package_id,
      sub_package_id: pp.sub_package_id,
      fullObject: pp,
    }); // Detailed debug log
    if (!pp.id || typeof pp.id !== 'string' || pp.id.trim() === '') {
      console.error('Invalid package price ID for edit:', pp.id);
      toast.error('Invalid package price ID', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
      return;
    }
    if (!pp.package_id || typeof pp.package_id !== 'string' || pp.package_id.trim() === '') {
      console.error('Invalid package_id for edit:', pp.package_id);
      toast.error('Invalid package ID', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
      return;
    }
    try {
      console.log('Fetching sub-packages for package_id:', pp.package_id);
      const response = await apiClient.get(`/v1/admin/packageprice/sub-packages/${pp.package_id}`);
      console.log('Sub-packages response:', response.data.result.data);
      setSubPackages(response.data.result.data);

      setNewPackagePrice({
        id: pp.id,
        package_id: pp.package_id,
        sub_package_id: pp.sub_package_id || '',
        car_id: pp.car_id || '',
        base_fare: pp.base_fare.toString(),
        description: pp.description || '',
        status: pp.status,
      });
      setShowPackagePriceForm(true); // Ensure modal opens
    } catch (err: any) {
      console.error('Edit package price error:', err, 'Response:', err.response?.data);
      toast.error(err.response?.data?.error || 'Failed to fetch sub-packages or edit package price', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
      // Attempt to open modal with current data even if sub-packages fail
      setNewPackagePrice({
        id: pp.id,
        package_id: pp.package_id,
        sub_package_id: pp.sub_package_id || '',
        car_id: pp.car_id || '',
        base_fare: pp.base_fare.toString(),
        description: pp.description || '',
        status: pp.status,
      });
      setShowPackagePriceForm(true);
    }
  };

  const handleCreatePackagePrice = () => {
    console.log('Creating new package price, resetting form'); // Debug log
    setNewPackagePrice({
      id: '',
      package_id: '',
      sub_package_id: '',
      car_id: '',
      base_fare: '',
      description: '',
      status: true,
    });
    setSubPackages([]);
    setShowPackagePriceForm(true);
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge variant="default">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  // Safe rendering for base_fare
  const renderBaseFare = (base_fare: number | string | undefined) => {
    if (typeof base_fare === 'number' && !isNaN(base_fare)) {
      return base_fare.toFixed(2);
    }
    console.warn('Invalid base_fare value:', base_fare); // Debug log
    return 'N/A';
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
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center w-1/3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search by package, sub-package, or car..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <Dialog open={showPackagePriceForm} onOpenChange={setShowPackagePriceForm}>
          <DialogTrigger asChild>
            <Button onClick={handleCreatePackagePrice}>
              <Plus className="w-4 h-4 mr-2" />
              Create Package Price
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{newPackagePrice.id ? 'Edit Package Price' : 'Create New Package Price'}</DialogTitle>
              <DialogDescription>
                {newPackagePrice.id ? 'Update package price details' : 'Add a new package price to the system'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="package_id">Package</Label>
                <Select
                  value={newPackagePrice.package_id}
                  onValueChange={(value) => {
                    console.log('Selected package_id:', value); // Debug log
                    setNewPackagePrice({ ...newPackagePrice, package_id: value, sub_package_id: '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map(pkg => (
                      <SelectItem key={pkg.id} value={pkg.id}>{pkg.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sub_package_id">Sub-Package</Label>
                <Select
                  value={newPackagePrice.sub_package_id}
                  onValueChange={(value) => {
                    console.log('Selected sub_package_id:', value); // Debug log
                    setNewPackagePrice({ ...newPackagePrice, sub_package_id: value });
                  }}
                  disabled={!newPackagePrice.package_id || subPackages.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={subPackages.length === 0 && newPackagePrice.package_id ? 'No sub-packages available' : 'Select a sub-package'} />
                  </SelectTrigger>
                  <SelectContent>
                    {subPackages.map(sp => (
                      <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="car_id">Car</Label>
                <Select
                  value={newPackagePrice.car_id}
                  onValueChange={(value) => setNewPackagePrice({ ...newPackagePrice, car_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a car" />
                  </SelectTrigger>
                  <SelectContent>
                    {cars.map(car => (
                      <SelectItem key={car.id} value={car.id}>{car.brand} {car.model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="base_fare">Base Fare (AED)</Label>
                <Input
                  id="base_fare"
                  type="number"
                  min="0"
                  step="1"
                  value={newPackagePrice.base_fare}
                  onChange={(e) => setNewPackagePrice({ ...newPackagePrice, base_fare: e.target.value })}
                  placeholder="Enter base fare"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newPackagePrice.description}
                  onChange={(e) => setNewPackagePrice({ ...newPackagePrice, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="status"
                    checked={newPackagePrice.status}
                    onCheckedChange={(checked) => setNewPackagePrice({ ...newPackagePrice, status: checked })}
                  />
                  <span>{newPackagePrice.status ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowPackagePriceForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpsertPackagePrice}>
                  {newPackagePrice.id ? 'Update Package Price' : 'Create Package Price'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Package Prices ({packagePrices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Sub-Package</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Base Fare (AED)</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packagePrices
                .filter(pp => pp.id && typeof pp.id === 'string' && pp.id.trim() !== '') // Filter out invalid IDs
                .map((pp: PackagePrice, index: number) => (
                  <TableRow key={`package-price-${pp.id}`}>
                     <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                    <TableCell>{packages.find(p => p.id === pp.package_id)?.name || 'N/A'}</TableCell>
                    <TableCell>{allSubPackages.find(sp => sp.id === pp.sub_package_id)?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {cars.find(c => c.id === pp.car_id)?.brand} {cars.find(c => c.id === pp.car_id)?.model || 'N/A'}
                    </TableCell>
                    <TableCell>{renderBaseFare(pp.base_fare)}</TableCell>
                    <TableCell>{pp.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(pp.status)}
                        <Switch
                          checked={pp.status}
                          onCheckedChange={(checked) => handleStatusSwitch(pp.id, checked)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
  {new Date(pp.createdAt).toLocaleDateString('en-GB', {
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
                          onClick={() => handleEditPackagePrice(pp)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                        </Button>
                        <Dialog open={showDeleteConfirm && deletePackagePriceId === pp.id} onOpenChange={(open) => {
                          if (!open) {
                            setShowDeleteConfirm(false);
                            setDeletePackagePriceId(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setDeletePackagePriceId(pp.id);
                                setShowDeleteConfirm(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-1 text-primary" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Deletion</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this package price? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowDeleteConfirm(false);
                                  setDeletePackagePriceId(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDeletePackagePrice(pp.id)}
                                className='bg-primary text-card hover:bg-primary hover:text-card'
                              >
                                Delete
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
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
    </div>
  );
};

export default PackagePrices;