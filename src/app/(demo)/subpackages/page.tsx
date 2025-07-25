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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { debounce } from 'lodash';

interface Package {
  id: string;
  name: string;
}

interface Car {
  id: string;
  brand: string;
  model: string;
}

interface SubPackage {
  id: string;
  name: string;
  car_id: string;
  package_id: string;
  hours?: number;
  days_per_month?: number;
  hours_per_day?: number;
  base_fare: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface NewSubPackage {
  id: string;
  name: string;
  car_id: string;
  package_id: string;
  hours: string;
  days_per_month: string;
  hours_per_day: string;
  base_fare: string;
  status: 'active' | 'inactive';
}

const SubPackages: React.FC = () => {
  const { toast } = useToast();
  const [subPackages, setSubPackages] = useState<SubPackage[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [showSubPackageForm, setShowSubPackageForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [newSubPackage, setNewSubPackage] = useState<NewSubPackage>({
    id: '',
    name: '',
    car_id: '',
    package_id: '',
    hours: '',
    days_per_month: '',
    hours_per_day: '',
    base_fare: '',
    status: 'active',
  });

  // Fetch packages and cars for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [packagesResponse, carsResponse] = await Promise.all([
          apiClient.get('/v1/admin/package'),
          apiClient.get('/v1/admin/car'),
        ]);
        setPackages(packagesResponse.data.result.data);
        setCars(carsResponse.data.result.data);
      } catch (err: any) {
        console.error('Fetch dropdown data error:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err.response?.data?.error || 'Failed to fetch dropdown data',
        });
      }
    };

    fetchDropdownData();
  }, []);

  // Memoize the debounced fetchSubPackages function
 // Memoize the debounced fetchSubPackages function
const debouncedFetchSubPackages = useCallback(
  debounce(async (query: string) => {
    try {
      setIsSearching(true);
      const response = await apiClient.get('/v1/admin/sub-package', {
        params: { search: query },
      });
      // Debug the raw data
      console.log('Raw sub-packages data:', response.data.result.data);
      // Parse base_fare to number, providing a fallback
      const parsedSubPackages = response.data.result.data.map((sp: any) => ({
        ...sp,
        base_fare: typeof sp.base_fare === 'number' ? sp.base_fare : parseFloat(sp.base_fare) || 0,
      }));
      setSubPackages(parsedSubPackages);
    } catch (err: any) {
      console.error('Fetch sub-packages error:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.error || 'Failed to fetch sub-packages',
      });
    } finally {
      setIsSearching(false);
    }
  }, 500),
  []
);

// Initial fetch and search updates
useEffect(() => {
  const fetchInitialSubPackages = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/v1/admin/sub-package', {
        params: { search: searchQuery },
      });
      console.log('Initial sub-packages data:', response.data.result.data);
      const parsedSubPackages = response.data.result.data.map((sp: any) => ({
        ...sp,
        base_fare: typeof sp.base_fare === 'number' ? sp.base_fare : parseFloat(sp.base_fare) || 0,
      }));
      setSubPackages(parsedSubPackages);
    } catch (err: any) {
      console.error('Fetch sub-packages error:', err);
      setError(err.response?.data?.error || 'Failed to fetch sub-packages');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.error || 'Failed to fetch sub-packages',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    fetchInitialSubPackages();
  } else {
    debouncedFetchSubPackages(searchQuery);
  }

  return () => {
    debouncedFetchSubPackages.cancel();
  };
}, [searchQuery, debouncedFetchSubPackages, loading]);

  // Initial fetch and search updates
  useEffect(() => {
    const fetchInitialSubPackages = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/v1/admin/sub-package', {
          params: { search: searchQuery },
        });
        setSubPackages(response.data.result.data);
      } catch (err: any) {
        console.error('Fetch sub-packages error:', err);
        setError(err.response?.data?.error || 'Failed to fetch sub-packages');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err.response?.data?.error || 'Failed to fetch sub-packages',
        });
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      fetchInitialSubPackages();
    } else {
      debouncedFetchSubPackages(searchQuery);
    }

    return () => {
      debouncedFetchSubPackages.cancel();
    };
  }, [searchQuery, debouncedFetchSubPackages, loading]);

  const handleUpsertSubPackage = async () => {
    if (!newSubPackage.name || !newSubPackage.car_id || !newSubPackage.package_id) {
      toast({ variant: 'destructive', title: 'Error', description: 'Name, Car, and Package are required' });
      return;
    }

    const packageName = packages.find(p => p.id === newSubPackage.package_id)?.name;
    if (['Hourly Booking', 'Full Day'].includes(packageName || '') && !newSubPackage.hours) {
      toast({ variant: 'destructive', title: 'Error', description: 'Hours is required for this package type' });
      return;
    }
    if (packageName === 'Corporate Monthly' && (!newSubPackage.days_per_month || !newSubPackage.hours_per_day)) {
      toast({ variant: 'destructive', title: 'Error', description: 'Days per Month and Hours per Day are required for Corporate Monthly' });
      return;
    }
    if (!newSubPackage.base_fare) {
      toast({ variant: 'destructive', title: 'Error', description: 'Base Fare is required' });
      return;
    }

    const hours = newSubPackage.hours ? parseFloat(newSubPackage.hours) : undefined;
    const days_per_month = newSubPackage.days_per_month ? parseInt(newSubPackage.days_per_month) : undefined;
    const hours_per_day = newSubPackage.hours_per_day ? parseFloat(newSubPackage.hours_per_day) : undefined;
    const base_fare = parseFloat(newSubPackage.base_fare);

    if (
      (hours !== undefined && (isNaN(hours) || hours < 0)) ||
      (days_per_month !== undefined && (isNaN(days_per_month) || days_per_month < 0)) ||
      (hours_per_day !== undefined && (isNaN(hours_per_day) || hours_per_day < 0)) ||
      (isNaN(base_fare) || base_fare < 0)
    ) {
      toast({ variant: 'destructive', title: 'Error', description: 'Numeric fields cannot be negative or invalid' });
      return;
    }

    try {
      const payload: Partial<SubPackage> & { id?: string } = {
        name: newSubPackage.name,
        car_id: newSubPackage.car_id,
        package_id: newSubPackage.package_id,
        hours,
        days_per_month,
        hours_per_day,
        base_fare,
        status: newSubPackage.status,
      };
      if (newSubPackage.id) {
        payload.id = newSubPackage.id;
      }

      const response = await apiClient.post('/v1/admin/sub-package/upsert', payload);

      if (newSubPackage.id) {
        setSubPackages(subPackages.map(sp => (sp.id === newSubPackage.id ? response.data.data : sp)));
      } else {
        setSubPackages([...subPackages, response.data.data]);
      }

      setNewSubPackage({
        id: '',
        name: '',
        car_id: '',
        package_id: '',
        hours: '',
        days_per_month: '',
        hours_per_day: '',
        base_fare: '',
        status: 'active',
      });
      setShowSubPackageForm(false);
      toast({ title: 'Success', description: response.data.message });
    } catch (err: any) {
      console.error('Upsert sub-package error:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.error || 'Failed to upsert sub-package',
      });
    }
  };

  const handleDeleteSubPackage = async (subPackageId: string) => {
    try {
      const response = await apiClient.delete(`/v1/admin/sub-package/${subPackageId}`);
      setSubPackages(subPackages.filter(sp => sp.id !== subPackageId));
      toast({ title: 'Success', description: response.data.message });
    } catch (err: any) {
      console.error('Delete sub-package error:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.error || 'Failed to delete sub-package',
      });
    }
  };

  const handleStatusSwitch = async (subPackageId: string, checked: boolean) => {
    try {
      const response = await apiClient.patch(`/v1/admin/sub-package/${subPackageId}/status`);
      setSubPackages(subPackages.map(sp => (sp.id === subPackageId ? response.data.data : sp)));
      toast({ title: 'Success', description: response.data.message });
    } catch (err: any) {
      console.error('Update status error:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.response?.data?.error || 'Failed to update status',
      });
    }
  };

  const handleEditSubPackage = (sp: SubPackage) => {
    setNewSubPackage({
      id: sp.id,
      name: sp.name,
      car_id: sp.car_id,
      package_id: sp.package_id,
      hours: sp.hours ? sp.hours.toString() : '',
      days_per_month: sp.days_per_month ? sp.days_per_month.toString() : '',
      hours_per_day: sp.hours_per_day ? sp.hours_per_day.toString() : '',
      base_fare: sp.base_fare.toString(),
      status: sp.status,
    });
    setShowSubPackageForm(true);
  };

  const handleCreateSubPackage = () => {
    setNewSubPackage({
      id: '',
      name: '',
      car_id: '',
      package_id: '',
      hours: '',
      days_per_month: '',
      hours_per_day: '',
      base_fare: '',
      status: 'active',
    });
    setShowSubPackageForm(true);
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

  const getFieldVisibility = (packageName: string | undefined) => {
    if (!packageName) return { showHours: true, showDaysPerMonth: true, showHoursPerDay: true };
    if (packageName === 'Airport Transfers') return { showHours: false, showDaysPerMonth: false, showHoursPerDay: false };
    if (['Hourly Booking', 'Full-Day Packages'].includes(packageName)) return { showHours: true, showDaysPerMonth: false, showHoursPerDay: false };
    if (packageName === 'Corporate Monthly') return { showHours: false, showDaysPerMonth: true, showHoursPerDay: true };
    return { showHours: true, showDaysPerMonth: true, showHoursPerDay: true };
  };

  const selectedPackageName = packages.find(p => p.id === newSubPackage.package_id)?.name;
  const { showHours, showDaysPerMonth, showHoursPerDay } = getFieldVisibility(selectedPackageName);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center w-1/3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search by name, package, or car..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <Dialog open={showSubPackageForm} onOpenChange={setShowSubPackageForm}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateSubPackage}>
              <Plus className="w-4 h-4 mr-2" />
              Create Sub-Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{newSubPackage.id ? 'Edit Sub-Package' : 'Create New Sub-Package'}</DialogTitle>
              <DialogDescription>
                {newSubPackage.id ? 'Update sub-package details' : 'Add a new sub-package to the system'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newSubPackage.name}
                  onChange={(e) => setNewSubPackage({ ...newSubPackage, name: e.target.value })}
                  placeholder="Enter sub-package name"
                />
              </div>
              <div>
                <Label htmlFor="package_id">Package</Label>
                <Select
                  value={newSubPackage.package_id}
                  onValueChange={(value) => setNewSubPackage({ ...newSubPackage, package_id: value })}
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
                <Label htmlFor="car_id">Car</Label>
                <Select
                  value={newSubPackage.car_id}
                  onValueChange={(value) => setNewSubPackage({ ...newSubPackage, car_id: value })}
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
              {showHours && (
                <div>
                  <Label htmlFor="hours">Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0"
                    value={newSubPackage.hours}
                    onChange={(e) => setNewSubPackage({ ...newSubPackage, hours: e.target.value })}
                    placeholder="Enter hours"
                  />
                </div>
              )}
              {showDaysPerMonth && (
                <div>
                  <Label htmlFor="days_per_month">Days per Month</Label>
                  <Input
                    id="days_per_month"
                    type="number"
                    min="0"
                    value={newSubPackage.days_per_month}
                    onChange={(e) => setNewSubPackage({ ...newSubPackage, days_per_month: e.target.value })}
                    placeholder="Enter days per month"
                  />
                </div>
              )}
              {showHoursPerDay && (
                <div>
                  <Label htmlFor="hours_per_day">Hours per Day</Label>
                  <Input
                    id="hours_per_day"
                    type="number"
                    min="0"
                    value={newSubPackage.hours_per_day}
                    onChange={(e) => setNewSubPackage({ ...newSubPackage, hours_per_day: e.target.value })}
                    placeholder="Enter hours per day"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="base_fare">Base Fare</Label>
                <Input
                  id="base_fare"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newSubPackage.base_fare}
                  onChange={(e) => setNewSubPackage({ ...newSubPackage, base_fare: e.target.value })}
                  placeholder="Enter base fare"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="status"
                    checked={newSubPackage.status === 'active'}
                    onCheckedChange={(checked) =>
                      setNewSubPackage({ ...newSubPackage, status: checked ? 'active' : 'inactive' })
                    }
                  />
                  <span>{newSubPackage.status}</span>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowSubPackageForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpsertSubPackage}>
                  {newSubPackage.id ? 'Update Sub-Package' : 'Create Sub-Package'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sub-Packages ({subPackages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isSearching && (
            <div className="flex justify-center items-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Days/Month</TableHead>
                <TableHead>Hours/Day</TableHead>
                <TableHead>Base Fare</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
           <TableBody>
  {subPackages.map((sp: SubPackage) => (
    <TableRow key={sp.id}>
      <TableCell>{sp.name}</TableCell>
      <TableCell>{packages.find(p => p.id === sp.package_id)?.name || 'N/A'}</TableCell>
      <TableCell>
        {cars.find(c => c.id === sp.car_id)?.brand} {cars.find(c => c.id === sp.car_id)?.model || 'N/A'}
      </TableCell>
      <TableCell>{sp.hours || '-'}</TableCell>
      <TableCell>{sp.days_per_month || '-'}</TableCell>
      <TableCell>{sp.hours_per_day || '-'}</TableCell>
      <TableCell>AED {typeof sp.base_fare === 'number' && !isNaN(sp.base_fare) ? sp.base_fare.toFixed(2) : '0.00'}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          {getStatusBadge(sp.status)}
          <Switch
            checked={sp.status === 'active'}
            onCheckedChange={(checked) => handleStatusSwitch(sp.id, checked)}
          />
        </div>
      </TableCell>
      <TableCell>{new Date(sp.createdAt).toLocaleDateString()}</TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditSubPackage(sp)}
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteSubPackage(sp.id)}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default SubPackages;