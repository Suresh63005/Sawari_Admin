"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Users,
  Car,
  MapPin,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import Loader from "./ui/Loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

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
  onlineDrivers: {
    value: number;
    trend?: string;
    description: string;
  };
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

interface OnlineDriver {
  id: string;
  name: string;
  vehicle: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [stats, setStats] = useState<Stats>({
    totalRides: { value: 0, trend: "0%", description: "vs last month" },
    activeRides: { value: 0, trend: "0%", description: "currently ongoing" },
    completedRides: { value: 0, trend: "0%", description: "vs last month" },
    revenue: { value: 0, trend: "0%", description: "vs last month" },
    drivers: { value: 0, trend: "0%", description: "approved drivers" },
    vehicles: { value: 0, trend: "0%", description: "approved vehicles" },
    onlineDrivers: { value: 0, trend: "0%", description: "currently online" },
  });
  const router = useRouter();
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [onlineDrivers, setOnlineDrivers] = useState<OnlineDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsResponse, activityResponse, approvalsResponse] =
          await Promise.all([
            apiClient.get("v1/admin/dashboard/stats"),
            apiClient.get("v1/admin/dashboard/recent-activity"),
            apiClient.get("v1/admin/dashboard/pending-approvals"),
          ]);

        const statsData: Stats = statsResponse.data;
        const activityData: Activity[] = activityResponse.data;
        const approvalsData: Approval[] = approvalsResponse.data;
        setStats(statsData);
        setRecentActivity(activityData);
        setPendingApprovals(approvalsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const fetchOnlineDrivers = async () => {
    try {
      const response = await apiClient.get("v1/admin/dashboard/online-drivers");
      setOnlineDrivers(response.data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching online drivers:", error);
    }
  };

  const getStatsCards = () => {
    const allCards = [
      {
        title: "Total Rides",
        value: stats.totalRides.value.toLocaleString(),
        icon: <MapPin className="w-4 h-4" />,
        trend: stats.totalRides.trend,
        description: stats.totalRides.description,
        permission: "rides",
        link: "/rides",
        hoverText: "Click to view all rides",
      },
      {
        title: "Active Rides",
        value: stats.activeRides.value.toString(),
        icon: <Clock className="w-4 h-4" />,
        trend: stats.activeRides.trend,
        description: stats.activeRides.description,
        permission: "rides",
        link: "/rides?status=on-route",
        hoverText: "View ongoing rides",
      },
      {
        title: "Total Revenue",
        value: `AED ${stats.revenue.value.toLocaleString()}`,
        icon: <DollarSign className="w-4 h-4" />,
        trend: stats.revenue.trend,
        description: stats.revenue.description,
        permission: "earnings",
        link: "/earnings",
        hoverText: "Revenue from completed rides",
      },
      {
        title: "Active Drivers",
        value: stats.drivers.value.toString(),
        icon: <Users className="w-4 h-4" />,
        trend: stats.drivers.trend,
        description: stats.drivers.description,
        permission: "drivers",
        link: "/drivers",
        hoverText: "View all active drivers",
      },
      {
        title: "Active Vehicles",
        value: stats.vehicles.value.toString(),
        icon: <Car className="w-4 h-4" />,
        trend: stats.vehicles.trend,
        description: stats.vehicles.description,
        permission: "vehicles",
        link: "/vehicles",
        hoverText: "View all active vehicles",
      },
      {
        title: "Online Drivers",
        value: stats.onlineDrivers.value.toString(),
        icon: <Users className="w-4 h-4 text-green-500" />,
        trend: stats.onlineDrivers.trend ?? "",
        description: stats.onlineDrivers.description,
        permission: "drivers",
        onClick: fetchOnlineDrivers,
        hoverText: "See which drivers are online now",
      },
    ];

    return allCards.filter(
      (card) => user?.permissions?.[card.permission] ?? false
    );
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 relative z-0">
        {getStatsCards().map((stat, index) => (
          <Card
            key={index}
            title={stat.hoverText}
            onClick={(e) => {
              e.stopPropagation();
              if (stat.onClick) {
                stat.onClick();
              } else if (stat.link) {
                router.push(stat.link);
              }
            }}
            onMouseEnter={() => console.log(`Hovering over ${stat.title}`)}
            className="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className="text-muted-foreground">{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {stat.trend && (
                  <span
                    className={`flex items-center ${
                      stat.trend.startsWith("-") ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {stat.trend}
                  </span>
                )}
                <span>{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg font-semibold">
              Online Drivers
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              List of currently online drivers with their vehicle details
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {onlineDrivers.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {onlineDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="py-3 px-4 hover:bg-card transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {driver.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {driver.vehicle}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Online
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No drivers are currently online.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center space-x-3"
                >
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.user}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {pendingApprovals.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>Items requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">{approval.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {approval.type}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        approval.priority === "high"
                          ? "destructive"
                          : approval.priority === "medium"
                          ? "default"
                          : "secondary"
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
