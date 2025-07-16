import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Users, 
  Car, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

export interface DashboardProps {
  user: User;
}
export interface User {
  name: string;
  role: string;
  permissions: Record<string, boolean>;
}
export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const getDashboardData = () => {
  const baseStats = {
    totalRides: 1247,
    activeRides: 23,
    completedRides: 1180,
    revenue: 125000,
    drivers: 156,
    vehicles: 142,
    hotels: 28
  };

  if (user?.role === 'hotel_admin') {
    return {
      ...baseStats,
      totalRides: 87,
      activeRides: 3,
      completedRides: 84,
      revenue: 8500,
      drivers: 12,
      vehicles: 10
    };
  }

  return baseStats;
};

  const stats = getDashboardData();

 const getStatsCards = () => {
  const allCards = [
    {
      title: 'Total Rides',
      value: stats.totalRides.toLocaleString(),
      icon: <MapPin className="w-4 h-4" />,
      trend: '+12%',
      description: 'vs last month',
      permission: 'rides'
    },
    {
      title: 'Active Rides',
      value: stats.activeRides.toString(),
      icon: <Clock className="w-4 h-4" />,
      trend: '+5%',
      description: 'currently ongoing',
      permission: 'rides'
    },
    {
      title: 'Total Revenue',
      value: `AED ${stats.revenue.toLocaleString()}`,
      icon: <DollarSign className="w-4 h-4" />,
      trend: '+18%',
      description: 'vs last month',
      permission: 'earnings'
    },
    {
      title: 'Active Drivers',
      value: stats.drivers.toString(),
      icon: <Users className="w-4 h-4" />,
      trend: '+8%',
      description: 'approved drivers',
      permission: 'drivers'
    },
    {
      title: 'Active Vehicles',
      value: stats.vehicles.toString(),
      icon: <Car className="w-4 h-4" />,
      trend: '+3%',
      description: 'approved vehicles',
      permission: 'vehicles'
    },
    {
      title: 'Partner Hotels',
      value: stats.hotels.toString(),
      icon: <CheckCircle className="w-4 h-4" />,
      trend: '+2%',
      description: 'active partnerships',
      permission: 'hotels'
    }
  ];

  return allCards.filter(card => user?.permissions?.[card.permission] ?? false);
};

const getRecentActivity = () => {
  const activities = [
    { id: 1, action: 'New driver registration', user: 'Ahmed Hassan', time: '2 minutes ago', type: 'driver' },
    { id: 2, action: 'Vehicle approved', user: 'BMW X5 - ABC123', time: '5 minutes ago', type: 'vehicle' },
    { id: 3, action: 'Ride completed', user: 'Burj Al Arab → Dubai Mall', time: '10 minutes ago', type: 'ride' },
    { id: 4, action: 'Support ticket resolved', user: 'Ticket #1234', time: '15 minutes ago', type: 'support' },
    { id: 5, action: 'Hotel onboarded', user: 'Atlantis The Palm', time: '1 hour ago', type: 'hotel' }
  ];

  return activities.slice(0, user?.role === 'hotel_admin' ? 3 : 5);
};

  const getPendingApprovals = () => {
    const approvals = [
      { id: 1, type: 'Driver', name: 'Mohammed Ali', status: 'pending', priority: 'high', permission: 'drivers' },
      { id: 2, type: 'Vehicle', name: 'Mercedes S-Class', status: 'pending', priority: 'medium', permission: 'vehicles' },
      { id: 3, type: 'Hotel', name: 'Four Seasons Resort', status: 'pending', priority: 'low', permission: 'hotels' }
    ];

    return approvals.filter(approval => user?.permissions?.[approval.permission] ?? true);

  };

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
                <span className="flex items-center text-green-600">
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
              {getRecentActivity().map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
        {getPendingApprovals().length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Items requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getPendingApprovals().map((approval) => (
                  <div key={approval.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">{approval.name}</p>
                        <p className="text-xs text-muted-foreground">{approval.type}</p>
                      </div>
                    </div>
                    <Badge variant={approval.priority === 'high' ? 'destructive' : approval.priority === 'medium' ? 'default' : 'secondary'}>
                      {approval.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Overview (for hotel admin) */}
        {user?.role === 'hotel_admin' && (
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Your booking statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Completion Rate</span>
                  <span>94%</span>
                </div>
                <Progress value={94} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Customer Satisfaction</span>
                  <span>4.8/5</span>
                </div>
                <Progress value={96} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Monthly Target</span>
                  <span>78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};