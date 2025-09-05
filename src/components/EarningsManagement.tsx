'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Shield, Download, Search } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import { Admin } from './AdminManagement';
import Loader from './ui/Loader';

interface Earning {
  id: string;
  driver_id: string;
  ride_id: string;
  amount: string;
  commission: string;
  percentage: string;
  payment_method: string;
  status: 'pending' | 'processed';
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  Ride: {
    id: string;
    customer_name: string;
    email: string;
    phone: string;
    pickup_address: string;
    pickup_location: string;
    drop_location: string;
    car_model: string;
    ride_type: string;
    pickup_time: string;
  };
}

interface Summary {
  processedTotal: number;
  pendingTotal: number;
  commissionTotal: number;
}

interface EarningsManagementProps {
  currentUser: Admin;
}

export const EarningsManagement: React.FC<EarningsManagementProps> = ({ currentUser }) => {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Generate month options for the last 12 months
  const getMonthOptions = () => {
    const options = [{ value: 'all', label: 'All Months' }];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  };

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const endpoint =
          selectedMonth === 'all'
            ? `/v1/admin/earning/get-all-earnings-history?search=${encodeURIComponent(searchTerm)}&page=${currentPage}&limit=${itemsPerPage}`
            : `/v1/admin/earning/get-all-earnings-history?month=${selectedMonth}&search=${encodeURIComponent(searchTerm)}&page=${currentPage}&limit=${itemsPerPage}`;
        const response = await apiClient.get(endpoint);
        console.log('Fetched earnings:', response.data);
        setEarnings(response.data.data);
        setTotalItems(response.data.total || 0);
        setSummary(response.data.summary);
      } catch (err: any) {
        console.error('Fetch earnings error:', err);
        setError(err.response?.data?.message || 'Failed to fetch earnings data');
        toast.error(err.response?.data?.message || 'Failed to fetch earnings data', {
          style: {
            background: '#622A39',
            color: 'hsl(42, 51%, 91%)',
          },
        });
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, [selectedMonth, searchTerm, currentPage, itemsPerPage]);

  const downloadCSV = (data: Earning[], filename: string) => {
    const headers = [
      'Ride ID',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Amount (AED)',
      'Commission (AED)',
      'Percentage',
      'Payment Method',
      'Status',
      'Created At',
      'Pickup Address',
      'Pickup Location',
      'Drop Location',
      'Car Model',
      'Ride Type',
      'Pickup Time',
    ];
    const rows = data.map((earning) => [
      earning.ride_id,
      earning.Ride.customer_name,
      earning.Ride.email,
      earning.Ride.phone,
      parseFloat(earning.amount).toLocaleString(),
      parseFloat(earning.commission).toLocaleString(),
      earning.percentage,
      earning.payment_method.replace('_', ' ').toUpperCase(),
      earning.status,
      new Date(earning.createdAt).toLocaleDateString(),
      earning.Ride.pickup_address,
      earning.Ride.pickup_location,
      earning.Ride.drop_location,
      earning.Ride.car_model,
      earning.Ride.ride_type,
      new Date(earning.Ride.pickup_time).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    if (earnings.length === 0) {
      toast.error('No earnings data available to download', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
      return;
    }
    const filename = selectedMonth === 'all' ? 'all_earnings.csv' : `earnings_${selectedMonth}.csv`;
    downloadCSV(earnings, filename);
    toast.success('Earnings data downloaded successfully', {
      style: {
        background: '#622A39',
        color: 'hsl(42, 51%, 91%)',
      },
    });
  };

  const handleDownloadSingle = (earning: Earning) => {
    downloadCSV([earning], `earning_${earning.id}.csv`);
    toast.success('Earning record downloaded successfully', {
      style: {
        background: '#622A39',
        color: 'hsl(42, 51%, 91%)',
      },
    });
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Permission check
  if (!currentUser.permissions?.earnings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Access Restricted</h3>
          <p className="text-sm text-gray-500">You don&apos;t have permission to view earnings data.</p>
        </div>
      </div>
    );
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

  const getStatusBadge = (status: 'pending' | 'processed') => {
    switch (status) {
      case 'processed':
        return <Badge variant="default">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-card p-4 rounded-lg border border-primary">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-primary">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by customer, ride ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1 block w-full p-2 border border-primary rounded-md bg-card"
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-5">
            <Select value={selectedMonth} onValueChange={(value) => {
              setSelectedMonth(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleDownloadAll} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">AED {summary?.processedTotal.toLocaleString() || '0'}</p>
            <p className="text-sm text-muted-foreground">Processed Earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Commission Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">AED {summary?.commissionTotal.toLocaleString() || '0'}</p>
            <p className="text-sm text-muted-foreground">{summary?.commissionTotal ? '10% average' : 'No commissions'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">AED {summary?.pendingTotal.toLocaleString() || '0'}</p>
            <p className="text-sm text-muted-foreground">Pending for drivers</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings History ({earnings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ride ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount (AED)</TableHead>
                <TableHead>Commission (AED)</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {earnings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    {searchTerm ? 'No data found for the current search' : 'No earnings found'}
                  </TableCell>
                </TableRow>
              ) : (
                earnings.map((earning) => (
                  <TableRow key={earning.id}>
                    <TableCell>{earning.ride_id.slice(0, 8)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{earning.Ride.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{earning.Ride.email}</p>
                        <p className="text-sm text-muted-foreground">{earning.Ride.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{parseFloat(earning.amount).toLocaleString()}</TableCell>
                    <TableCell>{parseFloat(earning.commission).toLocaleString()}</TableCell>
                    <TableCell>{earning.percentage}%</TableCell>
                    <TableCell>
  {earning.payment_method ? earning.payment_method.replace('_', ' ').toUpperCase() : 'N/A'}
</TableCell> 
                    <TableCell>{getStatusBadge(earning.status)}</TableCell>
                    <TableCell>{new Date(earning.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadSingle(earning)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {!loading && earnings.length > 0 && (
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
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="text-primary"
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    onClick={() => paginate(page)}
                    variant={currentPage === page ? 'default' : 'outline'}
                    className={currentPage === page ? 'bg-primary text-card' : 'bg-card text-primary'}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="text-primary"
                >
                  Next
                </Button>
              </div>
              <span className="text-sm text-primary mt-2 md:mt-0">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export type { Earning, Summary };