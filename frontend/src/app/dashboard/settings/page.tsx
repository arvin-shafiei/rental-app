'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, CreditCard, Bell, Lock } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile Settings */}
        <Link href="/dashboard/settings/profile">
          <Card className="h-full hover:shadow-md transition-all cursor-pointer">
            <CardHeader>
              <User className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Update your name, profile picture, and other personal details
              </p>
            </CardContent>
          </Card>
        </Link>
        
        {/* Billing Settings */}
        <Link href="/dashboard/settings/billing">
          <Card className="h-full hover:shadow-md transition-all cursor-pointer">
            <CardHeader>
              <CreditCard className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Billing</CardTitle>
              <CardDescription>
                Manage your subscription and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                View and update your subscription plan, payment methods, and billing history
              </p>
            </CardContent>
          </Card>
        </Link>
        
        {/* Notification Settings */}
        <Link href="/dashboard/settings/notifications">
          <Card className="h-full hover:shadow-md transition-all cursor-pointer">
            <CardHeader>
              <Bell className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Customize your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Choose how and when you receive notifications for different events
              </p>
            </CardContent>
          </Card>
        </Link>
        
        {/* Security Settings */}
        <Link href="/dashboard/settings/security">
          <Card className="h-full hover:shadow-md transition-all cursor-pointer">
            <CardHeader>
              <Lock className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage account security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Update your password and security preferences
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
} 