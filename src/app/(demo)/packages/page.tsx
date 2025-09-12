"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { debounce } from 'lodash';
import Loader from '@/components/ui/Loader';

interface Package {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

const Packages: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const nameInputRef = React.useRef<HTMLInputElement>(null);
  const [newPackage, setNewPackage] = useState({
    id: '',
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; packageId: string }>({ open: false, packageId: '' });

  // Memoize the debounced fetchPackages function
  const debouncedFetchPackages = useCallback(
    debounce(async (query: string, page: number, limit: number) => {
      try {
        setIsSearching(true);
        const response = await apiClient.get('/v1/admin/package', {
          params: { search: query, page, limit },
        });
        setPackages(response.data.result.data || []);
        setTotalItems(response.data.result.total || 0);
      } catch (err: any) {
        console.error('Fetch packages error:', err);
        toast.error(err.response?.data?.error || 'Failed to fetch packages', {
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

  // Initial fetch and search updates
  useEffect(() => {
    const fetchInitialPackages = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/v1/admin/package', {
          params: { search: searchQuery, page: currentPage, limit: itemsPerPage },
        });
        setPackages(response.data.result.data || []);
        setTotalItems(response.data.result.total || 0);
      } catch (err: any) {
        console.error('Fetch packages error:', err);
        setError(err.response?.data?.error || 'Failed to fetch packages');
        toast.error(err.response?.data?.error || 'Failed to fetch packages', {
          style: {
            background: '#622A39',
            color: 'hsl(42, 51%, 91%)',
          },
        });
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      fetchInitialPackages();
    } else {
      debouncedFetchPackages(searchQuery, currentPage, itemsPerPage);
    }

    return () => {
      debouncedFetchPackages.cancel();
    };
  }, [searchQuery, currentPage, itemsPerPage, debouncedFetchPackages, loading]);

  const handleUpsertPackage = async () => {
    if (!newPackage.name || !newPackage.description) {
      toast.error('Name and description are required', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
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
      toast.success(response.data.message, {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    } catch (err: any) {
      console.error('Upsert package error:', err);
      toast.error(err.response?.data?.error || 'Failed to upsert package', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    try {
      const response = await apiClient.delete(`/v1/admin/package/${packageId}`);
      setPackages(packages.filter(pkg => pkg.id !== packageId));
      toast.success(response.data.message, {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    } catch (err: any) {
      console.error('Delete package error:', err);
      toast.error(err.response?.data?.error || 'Failed to delete package', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    } finally {
      setConfirmDelete({ open: false, packageId: '' });
    }
  };

  const handleStatusSwitch = async (packageId: string, checked: boolean) => {
    try {
      const response = await apiClient.patch(`/v1/admin/package/${packageId}/status`);
      setPackages(packages.map(pkg => (pkg.id === packageId ? response.data.data : pkg)));
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
  useEffect(() => {
  if (showPackageForm && newPackage.id && nameInputRef.current) {
    // move caret to end without selection
    const len = nameInputRef.current.value.length;
    nameInputRef.current.setSelectionRange(len, len);
  }
}, [showPackageForm, newPackage.id]);

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
          <DialogContent className="max-w-md" autoFocus={false} >
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
  ref={nameInputRef}
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
          {isSearching && (
            <div className="flex justify-center items-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.length === 0 && !isSearching ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No packages found</TableCell>
                </TableRow>
              ) : (
                packages.map((pkg: Package, index: number) => (
                  <TableRow key={pkg.id}>
                    <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
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
                    <TableCell>
                      {new Date(pkg.createdAt).toLocaleDateString('en-GB', {
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
                          onClick={() => handleEditPackage(pkg)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDelete({ open: true, packageId: pkg.id })}
                        >
                          <Trash2 className="w-4 h-4 mr-1 text-primary" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
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

      <Dialog open={confirmDelete.open} onOpenChange={() => setConfirmDelete({ open: false, packageId: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this package? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete({ open: false, packageId: '' })}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary text-card"
              onClick={() => handleDeletePackage(confirmDelete.packageId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Packages;