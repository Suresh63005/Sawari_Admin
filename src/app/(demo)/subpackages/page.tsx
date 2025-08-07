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

interface SubPackage {
  id: string;
  name: string;
  package_id: string;
  description: string | null;
  status: boolean;
  createdAt: string;
}

interface NewSubPackage {
  id: string;
  name: string;
  package_id: string;
  description: string;
  status: boolean;
}

const SubPackages: React.FC = () => {
  const { toast } = useToast();
  const [subPackages, setSubPackages] = useState<SubPackage[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [showSubPackageForm, setShowSubPackageForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newSubPackage, setNewSubPackage] = useState<NewSubPackage>({
    id: '',
    name: '',
    package_id: '',
    description: '',
    status: true,
  });

  // Fetch packages for dropdown
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const packagesResponse = await apiClient.get('/v1/admin/package');
        setPackages(packagesResponse.data.result.data);
      } catch (err: any) {
        console.error('Fetch packages error:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err.response?.data?.error || 'Failed to fetch packages',
        });
      }
    };

    fetchDropdownData();
  }, []);

  // Memoize the debounced fetchSubPackages function
  const debouncedFetchSubPackages = useCallback(
    debounce(async (query: string) => {
      try {
        const response = await apiClient.get('/v1/admin/sub-package', {
          params: { search: query },
        });
        setSubPackages(response.data.result.data);
      } catch (err: any) {
        console.error('Fetch sub-packages error:', err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err.response?.data?.error || 'Failed to fetch sub-packages',
        });
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

    fetchInitialSubPackages();
    debouncedFetchSubPackages(searchQuery);

    return () => {
      debouncedFetchSubPackages.cancel();
    };
  }, [searchQuery, debouncedFetchSubPackages]);

 const handleUpsertSubPackage = async () => {
  if (!newSubPackage.name || !newSubPackage.package_id) {
    toast({ variant: 'destructive', title: 'Error', description: 'Name and Package are required' });
    return;
  }

  try {
    const payload: Partial<SubPackage> & { id?: string } = {
      name: newSubPackage.name.trim(), // Trim to avoid whitespace
      package_id: newSubPackage.package_id,
      description: newSubPackage.description || null,
      status: newSubPackage.status,
    };
    if (newSubPackage.id && newSubPackage.id.trim() !== '') {
      payload.id = newSubPackage.id;
    }

    console.log('Upsert payload:', payload); // Log for debugging
    const response = await apiClient.post('/v1/admin/sub-package/upsert', payload);

    if (payload.id) {
      setSubPackages(subPackages.map(sp => (sp.id === payload.id ? response.data.data : sp)));
    } else {
      setSubPackages([...subPackages, response.data.data]);
    }

    setNewSubPackage({
      id: '',
      name: '',
      package_id: '',
      description: '',
      status: true,
    });
    setShowSubPackageForm(false);
    toast({ title: 'Success', description: response.data.message });
  } catch (err: any) {
    console.error('Upsert error:', err.response?.data, err.response?.status);
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
      package_id: sp.package_id,
      description: sp.description || '',
      status: sp.status,
    });
    setShowSubPackageForm(true);
  };

  const handleCreateSubPackage = () => {
    setNewSubPackage({
      id: '',
      name: '',
      package_id: '',
      description: '',
      status: true,
    });
    setShowSubPackageForm(true);
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge variant="default">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center w-1/3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search by name or package..."
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
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newSubPackage.description}
                  onChange={(e) => setNewSubPackage({ ...newSubPackage, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="status"
                    checked={newSubPackage.status}
                    onCheckedChange={(checked) => setNewSubPackage({ ...newSubPackage, status: checked })}
                  />
                  <span>{newSubPackage.status ? 'Active' : 'Inactive'}</span>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Description</TableHead>
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
                  <TableCell>{sp.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(sp.status)}
                      <Switch
                        checked={sp.status}
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