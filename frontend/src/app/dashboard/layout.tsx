"use client";

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { Home, Building, FileText, Calendar, CheckSquare, User, Settings, LogOut, ChevronDown, Mail, CreditCard } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Navigation items
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/properties', label: 'Properties', icon: Building },
    { href: '/dashboard/timeline', label: 'Timeline', icon: Calendar },
    { href: '/dashboard/agreement-builder', label: 'Agreement Builder', icon: CheckSquare },
    { href: '/dashboard/contract-scanner', label: 'Contract Scanner', icon: FileText },
    { href: '/dashboard/contact-landlord', label: 'Contact Landlord', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navbar */}
      <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image 
              src="/logo.png" 
              alt="RentHive Logo" 
              width={150} 
              height={40} 
              className="h-auto"
            />
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                                (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-2 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          {/* Right side - Notifications & Profile */}
          <div className="flex items-center gap-4">
            <NotificationBell />
            
            {/* Profile Dropdown - Using shadcn DropdownMenu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="hidden sm:inline">Profile</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link href="/dashboard/profile" className="flex w-full items-center">
                    <User className="mr-2 h-4 w-4 text-blue-500" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link href="/dashboard/settings" className="flex w-full items-center">
                    <Settings className="mr-2 h-4 w-4 text-blue-500" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" asChild>
                  <Link href="/dashboard/settings/billing" className="flex w-full items-center">
                    <CreditCard className="mr-2 h-4 w-4 text-blue-500" />
                    <span>Billing & Subscriptions</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600" 
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Mobile Navigation - Only shows on small screens */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 overflow-x-auto">
          <nav className="py-2">
            <ul className="flex space-x-2 whitespace-nowrap">
              {navItems.map((item) => {
                const isActive = pathname === item.href || 
                                (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-4 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
} 