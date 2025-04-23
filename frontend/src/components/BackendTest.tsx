"use client";

import { useState, useEffect, useRef } from 'react';
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null); // Clear previous upload results
    }
  };

  // Handle property selection
  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPropertyId(e.target.value);
  };

  // Handle room name input
  const handleRoomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomName(e.target.value);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    if (!authToken) {
      alert('You need to be logged in to upload files');
      return;
    }

    if (!selectedPropertyId) {
      alert('Please select a property');
      return;
    }

    try {
      setIsUploading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      // Build the URL with query parameters for propertyId and roomName
      let uploadUrl = `${backendUrl}/upload/image?propertyId=${selectedPropertyId}`;
      if (roomName.trim()) {
        uploadUrl += `&roomName=${encodeURIComponent(roomName.trim())}`;
      }
      
      // Make the request to the backend
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        setUploadResult(result);
        alert('File uploaded successfully!');
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        alert(`Upload failed: ${errorData.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Error uploading file: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file reset
  const handleReset = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    setSelectedPropertyId('');
    alert('Logged out successfully');
  };

  return (
    <div className="p-4 my-4 rounded-lg border">
      <h2 className="text-xl font-semibold mb-2">Backend Connection & File Upload Test</h2>
      
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
      
      {/* Property selection */}
      {authToken && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Property Selection</h3>
          
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
            <>
              <div className="mb-3">
                <label htmlFor="property-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Property:
                </label>
                <select
                  id="property-select"
                  value={selectedPropertyId}
                  onChange={handlePropertyChange}
                  className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isUploading}
                >
                  <option value="">-- Select a Property --</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.emoji ? `${property.emoji} ` : ''}{property.name} ({property.postcode})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3">
                <label htmlFor="room-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name (optional):
                </label>
                <input
                  id="room-name"
                  type="text"
                  value={roomName}
                  onChange={handleRoomNameChange}
                  placeholder="e.g. Bedroom, Kitchen, etc."
                  className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isUploading}
                />
              </div>
            </>
          )}
        </div>
      )}
      
      {/* File upload section */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium mb-2">File Upload Test</h3>
        
        {/* File input */}
        <div className="mb-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={!authToken || isUploading}
            className="block w-full mb-2 text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            accept="image/*"
          />
          {selectedFile && (
            <div className="text-sm text-gray-500">
              Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </div>
          )}
        </div>
        
        {/* Upload buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !authToken || !selectedPropertyId || isUploading}
            className={`px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
          
          <button
            onClick={handleReset}
            disabled={!selectedFile || isUploading}
            className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </div>
      
      {/* Upload result */}
      {uploadResult && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-medium mb-2 text-green-700">Upload Successful!</h3>
          <div className="bg-white p-2 rounded overflow-x-auto">
            <pre className="text-sm text-gray-800">{JSON.stringify(uploadResult, null, 2)}</pre>
          </div>
          {uploadResult.data?.url && (
            <div className="mt-3">
              <h4 className="text-md font-medium mb-1">Image Preview:</h4>
              <img 
                src={uploadResult.data.url} 
                alt="Uploaded" 
                className="max-w-full max-h-64 object-contain border rounded"
              />
            </div>
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