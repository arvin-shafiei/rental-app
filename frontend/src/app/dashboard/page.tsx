"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { Home, Calendar, FileText, Bell, FileCheck, MessageSquare, Shield } from 'lucide-react';
import { getAllTimelineEvents, TimelineEvent, TimelineEventType } from '@/lib/timelineApi';

interface Property {
  id: string;
  name: string;
  postcode: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check if cached data is still valid (less than 5 minutes old)
  const isCacheValid = (cacheKey: string) => {
    const cachedData = localStorage.getItem(cacheKey);
    if (!cachedData) return false;
    
    try {
      const { timestamp } = JSON.parse(cachedData);
      const now = new Date().getTime();
      const fiveMinutes = 5 * 60 * 1000;
      return now - timestamp < fiveMinutes;
    } catch (err) {
      return false;
    }
  };

  // Get cached data
  const getCachedData = (cacheKey: string) => {
    const cachedData = localStorage.getItem(cacheKey);
    if (!cachedData) return null;
    
    try {
      const { data } = JSON.parse(cachedData);
      return data;
    } catch (err) {
      return null;
    }
  };

  // Set cached data with timestamp
  const setCachedData = (cacheKey: string, data: any) => {
    const cacheData = {
      timestamp: new Date().getTime(),
      data
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (!data.session) {
          router.push('/auth');
          return;
        }
        
        setEmail(data.session.user.email || null);
        return data.session;
      } catch (error) {
        console.error('Error checking auth status:', error);
        router.push('/auth');
        return null;
      } finally {
        setLoading(false);
      }
    };

    const fetchDashboardData = async () => {
      const session = await checkAuth();
      if (!session) return;

      try {
        // Check for cached data first to avoid unnecessary requests
        if (isCacheValid('dashboard_properties')) {
          setProperties(getCachedData('dashboard_properties') || []);
        } else {
          // Fetch properties
          const propertiesResponse = await fetch('/api/properties', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          if (propertiesResponse.ok) {
            const propertiesData = await propertiesResponse.json();
            const properties = propertiesData.data || [];
            setProperties(properties);
            setCachedData('dashboard_properties', properties);
          }
        }

        if (isCacheValid('dashboard_timeline')) {
          setTimelineEvents(getCachedData('dashboard_timeline') || []);
        } else {
          try {
            // Use the timeline API client instead of direct fetch
            const events = await getAllTimelineEvents(90); // Get events for the next 90 days
            setTimelineEvents(events);
            setCachedData('dashboard_timeline', events);
          } catch (err) {
            console.error('Error fetching timeline data:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please refresh the page.');
      }
    };

    fetchDashboardData();
  }, [router]);

  // Get future events for the timeline
  const upcomingEvents = useMemo(() => {
    if (!timelineEvents.length) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return timelineEvents
      .filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate >= today;
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 5); // Show 5 events instead of 3
  }, [timelineEvents]);

  // Get event type color
  const getEventTypeColor = (type: string): string => {
    switch (type) {
      case TimelineEventType.RENT_DUE:
        return 'bg-red-500';
      case TimelineEventType.MAINTENANCE:
        return 'bg-yellow-500';
      case TimelineEventType.LEASE_START:
      case TimelineEventType.LEASE_END:
        return 'bg-blue-500';
      case TimelineEventType.INSPECTION:
        return 'bg-purple-500';
      case TimelineEventType.AGREEMENT_TASK:
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Format date for display
  const formatEventDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-lg font-medium text-black">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Main Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Properties Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-black">My Properties</h2>
              </div>
            </div>
            <div className="p-5">
              {properties.length > 0 ? (
                <div className="space-y-3">
                  {properties.slice(0, 3).map(property => (
                    <Link key={property.id} href={`/dashboard/properties/${property.id}`}>
                      <div className="flex items-center hover:bg-gray-50 p-2 rounded cursor-pointer">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <p className="text-black">{property.name} ({property.postcode})</p>
                      </div>
                    </Link>
                  ))}
                  {properties.length > 3 && (
                    <p className="text-sm text-gray-500">+{properties.length - 3} more properties</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No properties found. Add your first property.</p>
              )}
              <div className="mt-4">
                <Link href="/dashboard/properties" className="block w-full text-center bg-blue-600/90 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors">
                  {properties.length > 0 ? 'View All Properties' : 'Add Property'}
                </Link>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-black">Timeline</h2>
              </div>
            </div>
            <div className="p-5">
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between">
                      <div className="flex items-center max-w-[70%]">
                        <div className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${getEventTypeColor(event.event_type)}`}></div>
                        <p className="text-black truncate" title={event.title}>{event.title}</p>
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">{formatEventDate(event.start_date)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                    <p className="text-gray-500">No upcoming events</p>
                  </div>
                </div>
              )}
              <div className="mt-4">
                <Link href="/dashboard/timeline" className="block w-full text-center bg-green-600/90 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors">
                  View Full Timeline
                </Link>
              </div>
            </div>
          </div>

          {/* Contract Scanner Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center">
                <div className="bg-amber-100 p-2 rounded-lg">
                  <FileCheck className="h-6 w-6 text-amber-600" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-black">Contract Analysis</h2>
              </div>
            </div>
            <div className="p-5">
              <p className="text-black mb-3">Upload your rental agreement to extract important information automatically.</p>
              <ul className="text-black text-sm mb-4 space-y-1">
                <li>• Rent amount and payment schedule</li>
                <li>• Lease duration and key dates</li>
                <li>• Deposit information</li>
                <li>• Special clauses</li>
              </ul>
              <Link href="/dashboard/contract-scanner" className="block w-full text-center bg-amber-600/90 hover:bg-amber-700 text-white py-2 px-4 rounded-md transition-colors">
                Scan Contract
              </Link>
            </div>
          </div>
          
          {/* Deposit Protection Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center">
                <div className="bg-teal-100 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-teal-600" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-black">Deposit Protection</h2>
              </div>
            </div>
            <div className="p-5">
              <p className="text-black mb-3">Ensure your deposit is protected by the proper scheme and monitor important deadlines.</p>
              <ul className="text-black text-sm mb-4 space-y-1">
                <li>• Deposit protection schemes</li>
                <li>• Statutory deadlines</li>
                <li>• Dispute resolution</li>
                <li>• Return procedures</li>
              </ul>
              <Link href="/dashboard/deposit-protection" className="block w-full text-center bg-teal-600/90 hover:bg-teal-700 text-white py-2 px-4 rounded-md transition-colors">
                Check Protection Status
              </Link>
            </div>
          </div>

          {/* Flatmate Agreement Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-black">Flatmate Agreements</h2>
              </div>
            </div>
            <div className="p-5">
              <p className="text-black mb-3">Create agreements between roommates to clearly define responsibilities.</p>
              <ul className="text-black text-sm mb-4 space-y-1">
                <li>• Rent and utilities splitting</li>
                <li>• Cleaning responsibilities</li>
                <li>• House rules and quiet hours</li>
                <li>• Guest policies</li>
              </ul>
              <Link href="/dashboard/agreement-builder" className="block w-full text-center bg-indigo-600/90 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors">
                Create Agreement
              </Link>
            </div>
          </div>

          {/* Contact Landlord Card */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center">
                <div className="bg-red-100 p-2 rounded-lg">
                  <Bell className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="ml-3 text-xl font-semibold text-black">Contact Landlord</h2>
              </div>
            </div>
            <div className="p-5">
              <p className="text-black mb-3">Report issues or request repairs with your property.</p>
              <ul className="text-black text-sm mb-4 space-y-1">
                <li>• Maintenance requests</li>
                <li>• Repair issues</li>
                <li>• General inquiries</li>
                <li>• Emergency contacts</li>
              </ul>
              <Link href="/dashboard/contact-landlord" className="block w-full text-center bg-red-600/90 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors">
                Contact Landlord
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 