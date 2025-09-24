"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import apiClient from '@/lib/apiClient';
import toast from 'react-hot-toast';
import Loader from '@/components/ui/Loader';
import dynamic from 'next/dynamic';
import 'quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface Settings {
  id?: string;
  weblogo?: string;
  web_name?: string;
  contact_email?: string;
  contact_phone?: string;
  tax_rate?: number;
  currency?: string;
  timezone?: string;
  about_us?: string;
  terms_conditions?: string;
  privacy_policy?: string;
  min_wallet_percentage?: number;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    weblogo: '',
    web_name: '',
    contact_email: '',
    contact_phone: '',
    tax_rate: 0.0,
    currency: '',
    timezone: '',
    about_us: '',
    terms_conditions: '',
    privacy_policy: '',
    min_wallet_percentage: 0.0,
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/v1/admin/settings');
        if (response.data.result) {
          setSettings(response.data.result);
        }
      } catch (err: any) {
        console.error('Fetch settings error:', err);
        setError(err.response?.data?.error || 'Failed to fetch settings');
        toast.error(err.response?.data?.error || 'Failed to fetch settings', {
          style: {
            background: '#622A39',
            color: 'hsl(42, 51%, 91%)',
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditorChange = (name: string, value: string) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await apiClient.post('/v1/admin/settings', settings);
      setSettings(response.data.result);
      toast.success(response.data.message, {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    } catch (err: any) {
      console.error('Save settings error:', err);
      toast.error(err.response?.data?.error || 'Failed to save settings', {
        style: {
          background: '#622A39',
          color: 'hsl(42, 51%, 91%)',
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const quillFormats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'link',
    'image',
  ];

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

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="weblogo">Website Logo URL</Label>
              <Input
                id="weblogo"
                name="weblogo"
                value={settings.weblogo || ''}
                onChange={handleInputChange}
                placeholder="Enter website logo URL"
              />
            </div>
            <div>
              <Label htmlFor="web_name">Website Name</Label>
              <Input
                id="web_name"
                name="web_name"
                value={settings.web_name || ''}
                onChange={handleInputChange}
                placeholder="Enter website name"
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                value={settings.contact_email || ''}
                onChange={handleInputChange}
                placeholder="Enter contact email"
              />
            </div>
            <div>
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                name="contact_phone"
                value={settings.contact_phone || ''}
                onChange={handleInputChange}
                placeholder="Enter contact phone"
              />
            </div>
            <div>
              <Label htmlFor="tax_rate">Tax Rate (%)</Label>
              <Input
                id="tax_rate"
                name="tax_rate"
                type="number"
                step="0.01"
                value={settings.tax_rate || 0.0}
                onChange={handleInputChange}
                placeholder="Enter tax rate"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                name="currency"
                value={settings.currency || ''}
                onChange={handleInputChange}
                placeholder="Enter currency (e.g., USD)"
              />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                name="timezone"
                value={settings.timezone || ''}
                onChange={handleInputChange}
                placeholder="Enter timezone (e.g., UTC)"
              />
            </div>
            <div>
              <Label htmlFor="about_us">About Us</Label>
              <ReactQuill
                value={settings.about_us || ''}
                onChange={(value) => handleEditorChange('about_us', value)}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Enter about us text"
                className="bg-[#FFF8EC]"
                style={{ height: '300px', marginBottom: '40px' }}
              />
            </div>
            <div>
              <Label htmlFor="terms_conditions">Terms & Conditions</Label>
              <ReactQuill
                value={settings.terms_conditions || ''}
                onChange={(value) => handleEditorChange('terms_conditions', value)}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Enter terms and conditions"
                className="bg-[#FFF8EC]"
                style={{ height: '300px', marginBottom: '40px' }}
              />
            </div>
            <div>
              <Label htmlFor="privacy_policy">Privacy Policy</Label>
              <ReactQuill
                value={settings.privacy_policy || ''}
                onChange={(value) => handleEditorChange('privacy_policy', value)}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Enter privacy policy"
                className="bg-[#FFF8EC]"
                style={{ height: '300px', marginBottom: '40px' }}
              />
            </div>
            <div>
              <Label htmlFor="min_wallet_percentage">Minimum Wallet Percentage (%)</Label>
              <Input
                id="min_wallet_percentage"
                name="min_wallet_percentage"
                type="number"
                step="0.01"
                value={settings.min_wallet_percentage || 0.0}
                onChange={handleInputChange}
                placeholder="Enter minimum wallet percentage"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;