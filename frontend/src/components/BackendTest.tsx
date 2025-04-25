"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import { getProperties } from '@/lib/api';

// Define property type based on backend model
interface Property {
  id: string;
  name: string;
  emoji?: string;
  image_url?: string;
  is_active: boolean;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  county?: string;
  postcode: string;
  country: string;
}

export default function BackendTest() {
  const [message, setMessage] = useState<string>('Testing connection to backend...');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);

  useEffect(() => {
    async function testBackend() {
      try {
        // Try to connect to the backend health endpoint
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
        const response = await fetch(`${backendUrl}/health`);
        
        if (response.ok) {
          const data = await response.json();
          setMessage(`✅ Successfully connected to backend: ${data.message}`);
          setStatus('success');
        } else {
          setMessage(`❌ Backend responded with status: ${response.status}`);
          setStatus('error');
        }
      } catch (error) {
        setMessage(`❌ Failed to connect to backend: ${error instanceof Error ? error.message : String(error)}`);
        setStatus('error');
      }
    }

    // Get the auth token
    async function getAuthToken() {
      const { data } = await supabase.auth.getSession();
      setAuthToken(data.session?.access_token || null);
    }

    testBackend();
    getAuthToken();
  }, []);

  // Fetch properties when authenticated
  useEffect(() => {
    if (authToken) {
      fetchProperties();
    }
  }, [authToken]);

  const fetchProperties = async () => {
    try {
      setLoadingProperties(true);
      setPropertiesError(null);
      const result = await getProperties();
      setProperties(result.data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setPropertiesError(error instanceof Error ? error.message : 'Failed to load properties');
      setProperties([]);
    } finally {
      setLoadingProperties(false);
    }
  };

  // Handle login with Supabase (simplified for testing)
  const handleLogin = async () => {
    // For testing purposes, we'll use a magic link login
    const email = prompt('Enter your email for magic link login:');
    if (!email) return;
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) {
        throw error;
      }
      
      alert('Check your email for the login link!');
    } catch (error) {
      console.error('Login error:', error);
      alert(`Error during login: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthToken(null);
    setProperties([]);
    alert('Logged out successfully');
  };

  return (
    <div className="p-4 my-4 rounded-lg border">
      <h2 className="text-xl font-semibold mb-2">Backend Connection Test</h2>
      
      {/* Connection status */}
      <p className={`${
        status === 'loading' ? 'text-gray-500' :
        status === 'success' ? 'text-green-600' : 'text-red-600'
      } mb-4`}>
        {message}
      </p>
      
      {/* Authentication section */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Authentication</h3>
        <div className="flex items-center">
          <div className="mr-2">
            Status: <span className={authToken ? "text-green-600" : "text-red-600"}>
              {authToken ? "Authenticated" : "Not authenticated"}
            </span>
          </div>
          {!authToken ? (
            <button
              onClick={handleLogin}
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Login
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Logout
            </button>
          )}
        </div>
      </div>
      
      {/* Property listing (for testing) */}
      {authToken && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Properties (API Test)</h3>
          
          {loadingProperties ? (
            <div className="flex items-center text-gray-500">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading properties...
            </div>
          ) : propertiesError ? (
            <div className="text-red-600 mb-2">
              Error: {propertiesError}
              <button 
                onClick={fetchProperties}
                className="ml-2 text-blue-600 hover:underline"
              >
                Retry
              </button>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-gray-600 mb-2">
              No properties found. Please add a property from the dashboard first.
            </div>
          ) : (
            <ul className="list-disc pl-5">
              {properties.map(property => (
                <li key={property.id} className="mb-1">
                  {property.emoji ? `${property.emoji} ` : ''}
                  <span className="font-medium">{property.name}</span> 
                  <span className="text-sm text-gray-500">({property.postcode})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {status === 'error' && (
        <div className="mt-2 text-sm text-gray-500">
          <p>Check that:</p>
          <ul className="list-disc ml-5">
            <li>The backend server is running</li>
            <li>NEXT_PUBLIC_BACKEND_URL is correctly set in your .env.local file</li>
            <li>The backend is accessible from this frontend application</li>
          </ul>
        </div>
      )}
    </div>
  );
} 