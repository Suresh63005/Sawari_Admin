'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Car, Shield, Users, Building } from 'lucide-react';

interface AuthPageProps {
  onLogin: (user: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password || !role) return;
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const user = {
        id: 1,
        name: 'John Doe',
        email,
        role,
        permissions: getRolePermissions(role)
      };
      onLogin(user);
      setLoading(false);
    }, 1000);
  };

  const getRolePermissions = (role: string) => {
    const permissions = {
      'super_admin': {
        dashboard: true,
        drivers: true,
        vehicles: true,
        rides: true,
        hotels: true,
        earnings: true,
        support: true,
        notifications: true,
        admin_management: true,
      },
      'admin': {
        dashboard: true,
        drivers: true,
        vehicles: true,
        rides: true,
        hotels: true,
        earnings: false,
        support: true,
        notifications: true,
        admin_management: true,
      },
      'executive_admin': {
        dashboard: true,
        drivers: true,
        vehicles: true,
        rides: true,
        hotels: false,
        earnings: false,
        support: true,
        notifications: true,
        admin_management: true,
      },
      'hotel_admin': {
        dashboard: true,
        drivers: false,
        vehicles: false,
        rides: true,
        hotels: false,
        earnings: false,
        support: false,
        notifications: false,
        admin_management: false,
      }
    };
    return permissions[role as keyof typeof permissions] || permissions.hotel_admin;
  };

  const getRoleIcon = (role: string) => {
    const icons = {
      'super_admin': <Shield className="w-5 h-5" />,
      'admin': <Users className="w-5 h-5" />,
      'executive_admin': <Car className="w-5 h-5" />,
      'hotel_admin': <Building className="w-5 h-5" />
    };
    return icons[role as keyof typeof icons];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary text-primary-foreground p-3 rounded-full">
              <Car className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-2xl">Sawari Admin</CardTitle>
          <CardDescription>
            Dubai Luxury Car Rental Platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Admin Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Super Admin
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Admin
                  </div>
                </SelectItem>
                <SelectItem value="executive_admin">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Executive Admin
                  </div>
                </SelectItem>
                <SelectItem value="hotel_admin">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Hotel Admin
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button 
            onClick={handleLogin}
            disabled={!email || !password || !role || loading}
            className="w-full"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};