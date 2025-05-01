"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import BackendTest from '@/components/BackendTest';
import { Home, Calendar } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          // Not authenticated, redirect to auth page
          router.push('/auth');
          return;
        }
        
        setEmail(data.session.user.email || null);
      } catch (error) {
        console.error('Error checking auth status:', error);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-10 w-10 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Welcome, {email || 'User'}!</h2>
          <p className="mt-2 text-gray-600">
            You're now logged into your dashboard where you can manage your account.
          </p>
          
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Backend Test Component */}
            <BackendTest />
            
            {/* Properties Dashboard Item */}
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <Home className="h-5 w-5 mr-2 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900">Properties</h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">Manage your rental properties</p>
                <div className="mt-4">
                  <Link href="/dashboard/properties" className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100">
                    View properties
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Timeline Dashboard Item */}
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900">Timeline</h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">View all upcoming events across properties</p>
                <div className="mt-4">
                  <Link href="/dashboard/timeline" className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100">
                    View timeline
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Example dashboard items */}
            {[
              { title: 'Profile', description: 'Manage your profile information' },
              { title: 'Settings', description: 'Configure your account settings' },
            ].map((item, index) => (
              <div key={index} className="overflow-hidden rounded-lg bg-white shadow">
                <div className="p-5">
                  <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                  <div className="mt-4">
                    <button className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100">
                      View details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 