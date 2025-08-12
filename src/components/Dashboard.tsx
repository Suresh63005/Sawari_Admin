import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Users, Car, MapPin, DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import Loader from './ui/Loader';

export interface DashboardProps {
  user: User;
}

export interface User {
  name: string;
  role: string;
  permissions: Record<string, boolean>;
}

interface Stat {
  value: number;
  trend: string;
  description: string;
}

interface Stats {
  totalRides: Stat;
  activeRides: Stat;
  completedRides: Stat;
  revenue: Stat;
  drivers: Stat;
  vehicles: Stat;
}

interface Activity {
  id: number;
  action: string;
  user: string;
  time: string;
  type: string;
}

interface Approval {
  id: string;
  type: string;
  name: string;
  status: string;
  priority: string;
  permission: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<Stats>({
    totalRides: { value: 0, trend: '0%', description: 'vs last month' },
    activeRides: { value: 0, trend: '0%', description: 'currently ongoing' },
    completedRides: { value: 0, trend: '0%', description: 'vs last month' },
    revenue: { value: 0, trend: '0%', description: 'vs last month' },
    drivers: { value: 0, trend: '0%', description: 'approved drivers' },
    vehicles: { value: 0, trend: '0%', description: 'approved vehicles' },
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, activityResponse, approvalsResponse] = await Promise.all([
          apiClient.get('v1/admin/dashboard/stats'),
          apiClient.get('v1/admin/dashboard/recent-activity'),
          apiClient.get('v1/admin/dashboard/pending-approvals'),
        ]);

        const statsData: Stats = statsResponse.data;
        const activityData: Activity[] = activityResponse.data;
        const approvalsData: Approval[] = approvalsResponse.data;

        setStats(statsData);
        setRecentActivity(activityData);
        setPendingApprovals(approvalsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatsCards = () => {
    const allCards = [
      {
        title: 'Total Rides',
        value: stats.totalRides.value.toLocaleString(),
        icon: <MapPin className="w-4 h-4" />,
        trend: stats.totalRides.trend,
        description: stats.totalRides.description,
        permission: 'rides',
      },
      {
        title: 'Active Rides',
        value: stats.activeRides.value.toString(),
        icon: <Clock className="w-4 h-4" />,
        trend: stats.activeRides.trend,
        description: stats.activeRides.description,
        permission: 'rides',
      },
      {
        title: 'Total Revenue',
        value: `AED ${stats.revenue.value.toLocaleString()}`,
        icon: <DollarSign className="w-4 h-4" />,
        trend: stats.revenue.trend,
        description: stats.revenue.description,
        permission: 'earnings',
      },
      {
        title: 'Active Drivers',
        value: stats.drivers.value.toString(),
        icon: <Users className="w-4 h-4" />,
        trend: stats.drivers.trend,
        description: stats.drivers.description,
        permission: 'drivers',
      },
      {
        title: 'Active Vehicles',
        value: stats.vehicles.value.toString(),
        icon: <Car className="w-4 h-4" />,
        trend: stats.vehicles.trend,
        description: stats.vehicles.description,
        permission: 'vehicles',
      },
    ];

    return allCards.filter((card) => user?.permissions?.[card.permission] ?? false);
  };

  if (loading) {
    return <Loader/>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getStatsCards().map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className="text-muted-foreground">{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span className={`flex items-center ${stat.trend.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.trend}
                </span>
                <span>{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        {pendingApprovals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Items requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">{approval.name}</p>
                        <p className="text-xs text-muted-foreground">{approval.type}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        approval.priority === 'high'
                          ? 'destructive'
                          : approval.priority === 'medium'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {approval.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};