'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Car } from 'lucide-react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';



export const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/v1/admin/auth/login', {
        email,
        password,
      });

      const data = response.data;

      const user = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        permissions: data.permissions,
      };

      // Store token in localStorage
      localStorage.setItem('token', data.token);
      console.log('Token stored:', localStorage.getItem('token')); // Debug log

      
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err); // Debug log
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
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

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <Button 
            onClick={handleLogin}
            disabled={!email || !password || loading}
            className="w-full"
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};