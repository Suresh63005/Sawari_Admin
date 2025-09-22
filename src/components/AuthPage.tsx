'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Car, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import Image from 'next/image';
import logoname from '../../public/logoname.png';
import logo from '../../public/logo.png';

export const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
  if (!email || !password) {
    setError(!email ? 'Email is required' : 'Password is required');
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

    localStorage.setItem('token', data.token);
    console.log('Token stored:', localStorage.getItem('token'));
    
    router.push('/dashboard');
  } catch (err: any) {
    console.error('Login error:', err);
    setError(err.response?.data?.message || 'Login failed');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex h-screen">
      <div className="w-1/2 bg-primary flex items-center justify-center">
        <Image src={logoname} alt="Logo" className=" " />
      </div>
      <div className="w-1/2 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary text-primary-foreground p-3 rounded-full">
                <Image src={logo} alt="Logo" className="w-8 h-8" />
              </div>
            </div>
            <CardTitle className="text-2xl">Sawari Admin</CardTitle>
            <CardDescription>
              Dubai Luxury Car Rental Platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
  <form
    onSubmit={(e) => {
      e.preventDefault(); // stop default reload
      handleLogin();
    }}
    className="space-y-4"
  >
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
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>

    {error && <p className="text-red-500 text-sm">{error}</p>}

    <Button
      type="submit"             // <-- important
      disabled={!email || !password || loading}
      className="w-full"
    >
      {loading ? 'Logging in...' : 'Login'}
    </Button>
  </form>
</CardContent>

        </Card>
      </div>
    </div>
  );
};