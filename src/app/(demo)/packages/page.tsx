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
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/components/ui/use-toast';
import { debounce } from 'lodash';
import Loader from '@/components/ui/Loader'; // Assuming you have a Loader component
interface Package {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

const Packages: React.FC = () => {
  const { toast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [newPackage, setNewPackage] = useState({
    id: '',
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Memoize the debounced fetchPackages function
  const debouncedFetchPackages = useCallback(
    debounce(async (query: string) => {
      try {
        setIsSearching(true);
        const response = await apiClient.get('/v1/admin/package', {
          params: { search: query },
        });
        setPackages(response.data.result.data);
      } catch (err: any) {
        console.error('Fetch packages error:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err.response?.data?.error || 'Failed to fetch packages',
        });
      } finally {
        setIsSearching(false);
      }
    }, 500),
    [] // Empty dependency array to prevent recreation
  );

  // Initial fetch and search updates
  useEffect(() => {
    const fetchInitialPackages = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/v1/admin/package', {
          params: { search: searchQuery },
        });
        setPackages(response.data.result.data);
      } catch (err: any) {
        console.error('Fetch packages error:', err);
        setError(err.response?.data?.error || 'Failed to fetch packages');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err.response?.data?.error || 'Failed to fetch packages',
        });
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      fetchInitialPackages();
    } else {
      debouncedFetchPackages(searchQuery);
    }

    return () => {
      debouncedFetchPackages.cancel(); // Prevent memory leaks
    };
  }, [searchQuery, debouncedFetchPackages, loading]);

  const handleUpsertPackage = async () => {
    if (!newPackage.name || !newPackage.description) {
      toast({ variant: 'destructive', title: 'Error', description: 'Name and description are required' });
      return;
    }

    try {
      const response = await apiClient.post('/v1/admin/package/upsert', newPackage);

      if (newPackage.id) {
        setPackages(packages.map(pkg => (pkg.id === newPackage.id ? response.data.data : pkg)));
      } else {
        setPackages([...packages, response.data.data]);
      }

      setNewPackage({ id: '', name: '', description: '', status: 'active' });
      setShowPackageForm(false);
      toast({ title: 'Success', description: response.data.message });
    } catch (err: any) {
      console.error('Upsert package error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.error || 'Failed to upsert package' });
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    try {
      const response = await apiClient.delete(`/v1/admin/package/${packageId}`);
      setPackages(packages.filter(pkg => pkg.id !== packageId));
      toast({ title: 'Success', description: response.data.message });
    } catch (err: any) {
      console.error('Delete package error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.error || 'Failed to delete package' });
    }
  };

  const handleStatusSwitch = async (packageId: string, checked: boolean) => {
    try {
      const response = await apiClient.patch(`/v1/admin/package/${packageId}/status`);
      setPackages(packages.map(pkg => (pkg.id === packageId ? response.data.data : pkg)));
      toast({ title: 'Success', description: response.data.message });
    } catch (err: any) {
      console.error('Update status error:', err);
      toast({ variant: 'destructive', title: 'Error', description: err.response?.data?.error || 'Failed to update status' });
    }
  };

  const handleEditPackage = (pkg: Package) => {
    setNewPackage({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      status: pkg.status,
    });
    setShowPackageForm(true);
  };

  const handleCreatePackage = () => {
    setNewPackage({ id: '', name: '', description: '', status: 'active' });
    setShowPackageForm(true);
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

if (loading) {
    return <Loader />;
  }
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
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <Dialog open={showPackageForm} onOpenChange={setShowPackageForm}>
          <DialogTrigger asChild>
            <Button onClick={handleCreatePackage}>
              <Plus className="w-4 h-4 mr-2" />
              Create Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{newPackage.id ? 'Edit Package' : 'Create New Package'}</DialogTitle>
              <DialogDescription>
                {newPackage.id ? 'Update package details' : 'Add a new package to the system'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newPackage.name}
                  onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                  placeholder="Enter package name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newPackage.description}
                  onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                  placeholder="Enter package description"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label>Status</Label>
                <Switch
                  checked={newPackage.status === 'active'}
                  onCheckedChange={(checked) =>
                    setNewPackage({ ...newPackage, status: checked ? 'active' : 'inactive' })
                  }
                />
                <span>{newPackage.status}</span>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowPackageForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpsertPackage}>
                  {newPackage.id ? 'Update Package' : 'Create Package'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Packages ({packages.length})</CardTitle>
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
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg: Package) => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <div className="font-medium">{pkg.name}</div>
                  </TableCell>
                  <TableCell>{pkg.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(pkg.status)}
                      <Switch
                        checked={pkg.status === 'active'}
                        onCheckedChange={(checked) => handleStatusSwitch(pkg.id, checked)}
                      />
                    </div>
                  </TableCell>
                  <TableCell>{new Date(pkg.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditPackage(pkg)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePackage(pkg.id)}
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

export default Packages;