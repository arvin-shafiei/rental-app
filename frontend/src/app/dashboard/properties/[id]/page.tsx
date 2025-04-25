'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Home, Loader2, Trash, Upload, Image, Grid, X } from 'lucide-react';
import { getProperty, deleteProperty, updateProperty, getPropertyImages } from '@/lib/api';
import PropertyTimeline from '@/components/timeline/PropertyTimeline';
import { supabase } from '@/lib/supabase/client';

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
  property_type?: string;
  rent_amount?: number;
  deposit_amount?: number;
  lease_start_date?: string;
  lease_end_date?: string;
}

// Property Image Upload component
function PropertyImageUpload({ propertyId }: { propertyId: string }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [roomName, setRoomName] = useState<string>('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get the auth token
    async function getAuthToken() {
      const { data } = await supabase.auth.getSession();
      setAuthToken(data.session?.access_token || null);
    }

    getAuthToken();
  }, []);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadResult(null); // Clear previous upload results
    }
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

    if (!roomName.trim()) {
      alert('Please enter a room name');
      return;
    }

    try {
      setIsUploading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
      
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      // Build the URL with query parameters for propertyId and roomName
      let uploadUrl = `${backendUrl}/upload/image?propertyId=${propertyId}&roomName=${encodeURIComponent(roomName.trim())}`;
      
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

  return (
    <div className="mt-8 pt-4 border-t">
      <div className="flex items-center mb-4">
        <Upload className="w-5 h-5 mr-2 text-blue-600" />
        <h3 className="text-lg font-semibold">Property Images</h3>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="mb-3">
          <label htmlFor="room-name" className="block text-sm font-medium text-gray-700 mb-1">
            Room Name: <span className="text-red-500">*</span>
          </label>
          <input
            id="room-name"
            type="text"
            value={roomName}
            onChange={handleRoomNameChange}
            placeholder="e.g. Bedroom, Kitchen, etc."
            className="block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isUploading}
            required
          />
        </div>
        
        {/* File input */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Image:
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={!authToken || isUploading}
            className="block w-full mb-2 text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
            accept="image/*"
          />
          {selectedFile && (
            <div className="text-sm text-gray-500 mt-1">
              Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </div>
          )}
        </div>
        
        {/* Upload buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !authToken || isUploading}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </>
            )}
          </button>
          
          <button
            onClick={handleReset}
            disabled={!selectedFile || isUploading}
            className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}

// Property Image Viewer component
function PropertyImageViewer({ propertyId }: { propertyId: string }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchPropertyImages() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching property images for property:', propertyId);
        const result = await getPropertyImages(propertyId);
        console.log('Property images API response:', result);
        
        if (result.success && result.data) {
          // Sort rooms by name for consistent display
          const sortedRooms = [...result.data].sort((a, b) => 
            a.roomName.localeCompare(b.roomName)
          );
          setRooms(sortedRooms);
        } else {
          setError('Failed to load property images');
        }
      } catch (error) {
        console.error('Error fetching property images:', error);
        setError(error instanceof Error ? error.message : 'Failed to load property images');
      } finally {
        setLoading(false);
      }
    }

    if (propertyId) {
      fetchPropertyImages();
    }
  }, [propertyId]);
  
  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };
  
  const closeImageModal = () => {
    setSelectedImage(null);
  };

  if (loading) {
    return (
      <div className="mt-6 flex justify-center items-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p>Error loading images: {error}</p>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
        <Image className="h-12 w-12 mx-auto text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Images</h3>
        <p className="mt-1 text-sm text-gray-500">Upload images using the form above.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeImageModal}>
          <div className="relative max-w-4xl max-h-screen p-4">
            <button 
              className="absolute top-0 right-0 bg-white rounded-full p-2 m-2 text-gray-800 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                closeImageModal();
              }}
            >
              <X className="h-6 w-6" />
            </button>
            <img 
              src={selectedImage} 
              alt="Full size" 
              className="max-h-screen object-contain" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {rooms.map((room, index) => (
        <div key={index} className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
            <Home className="h-5 w-5 mr-2 text-blue-600" />
            {room.roomName.charAt(0).toUpperCase() + room.roomName.slice(1).replace(/-/g, ' ')}
          </h3>
          
          {!room.images || room.images.length === 0 ? (
            <p className="text-gray-500 italic">No images in this room</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {room.images.map((image: any, imgIndex: number) => {
                // Create a direct reference to the image URL
                const imageUrl = image.url;
                
                return (
                  <div 
                    key={imgIndex} 
                    className="relative overflow-hidden rounded-lg shadow-sm border border-gray-200 aspect-square cursor-pointer hover:shadow-md transition-shadow bg-gray-100 flex items-center justify-center"
                    onClick={() => openImageModal(imageUrl)}
                  >
                    {/* Simple image display with fallback */}
                    <div className="w-full h-full">
                      {/* Loading spinner - shown until image loads */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                      </div>
                      
                      {/* The image itself */}
                      <img 
                        src={imageUrl}
                        alt={`${room.roomName} image ${imgIndex + 1}`}
                        className="w-full h-full object-cover z-20"
                        onLoad={(e) => {
                          // Hide the loading spinner when image loads
                          const img = e.target as HTMLImageElement;
                          const container = img.closest('div.relative');
                          if (container) {
                            const spinner = container.querySelector('div.absolute');
                            if (spinner instanceof HTMLElement) {
                              spinner.style.display = 'none';
                            }
                          }
                        }}
                        onError={(e) => {
                          // Show error state if image fails to load
                          console.error(`Failed to load image: ${imageUrl}`);
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                          
                          const container = img.closest('div.relative');
                          if (container) {
                            const spinner = container.querySelector('div.absolute');
                            if (spinner instanceof HTMLElement) {
                              spinner.innerHTML = '<div class="p-2 text-red-500 text-xs text-center">Image failed to load</div>';
                            }
                          }
                        }}
                      />
                      
                      {/* Hover effect overlay */}
                      <div className="absolute inset-0 bg-black opacity-0 hover:opacity-25 transition-opacity flex items-center justify-center z-30">
                        <Image className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PropertyDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Property>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const result = await getProperty(params.id);
        setProperty(result.data);
        setFormData(result.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load property details');
        console.error('Error fetching property:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProperty();
    }
  }, [params.id]);

  const handleDeleteProperty = async () => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    try {
      await deleteProperty(params.id);
      router.push('/dashboard/properties');
    } catch (err: any) {
      setError(err.message || 'Failed to delete property');
      console.error('Error deleting property:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked
      });
    } else if (name === 'rent_amount' || name === 'deposit_amount') {
      // Allow only numbers and decimals
      const numericValue = value.replace(/[^0-9.]/g, '');
      setFormData({
        ...formData,
        [name]: numericValue ? parseFloat(numericValue) : undefined
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await updateProperty(params.id, formData);
      
      // Refresh property data
      const result = await getProperty(params.id);
      setProperty(result.data);
      
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update property');
      console.error('Error updating property:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-8">
        <p className="text-black mb-4">Property not found</p>
        <Link 
          href="/dashboard/properties" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Properties
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        {/* <div className="flex items-center">
          <Home className="h-6 w-6 mr-2 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">{property.name}</h2>
        </div> */}
        <div className="flex items-center space-x-2">
          <Link 
            href="/dashboard/properties" 
            className="rounded-md bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100"
          >
            <ArrowLeft className="inline-block w-4 h-4 mr-2" />
            Back to Properties
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isEditing ? (
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                      Property Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emoji">
                      Emoji (optional)
                    </label>
                    <input
                      id="emoji"
                      name="emoji"
                      type="text"
                      placeholder="e.g. 🏠 or 🏢"
                      value={formData.emoji || ''}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="property_type">
                      Property Type
                    </label>
                    <select
                      id="property_type"
                      name="property_type"
                      value={formData.property_type || ''}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                      <option value="">Select a type</option>
                      <option value="House">House</option>
                      <option value="Flat">Flat/Apartment</option>
                      <option value="Student">Student Accommodation</option>
                      <option value="HMO">HMO</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="mb-4 flex items-center">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      checked={formData.is_active || false}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <label className="text-gray-700 text-sm font-bold" htmlFor="is_active">
                      Active Property
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4 md:col-span-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address_line1">
                      Address Line 1
                    </label>
                    <input
                      id="address_line1"
                      name="address_line1"
                      type="text"
                      value={formData.address_line1 || ''}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  
                  <div className="mb-4 md:col-span-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address_line2">
                      Address Line 2
                    </label>
                    <input
                      id="address_line2"
                      name="address_line2"
                      type="text"
                      value={formData.address_line2 || ''}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="city">
                      City
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={formData.city || ''}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="county">
                      County
                    </label>
                    <input
                      id="county"
                      name="county"
                      type="text"
                      value={formData.county || ''}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="postcode">
                      Postcode *
                    </label>
                    <input
                      id="postcode"
                      name="postcode"
                      type="text"
                      required
                      value={formData.postcode || ''}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="country">
                      Country
                    </label>
                    <input
                      id="country"
                      name="country"
                      type="text"
                      value={formData.country || ''}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Financial Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rent_amount">
                      Monthly Rent (£)
                    </label>
                    <input
                      id="rent_amount"
                      name="rent_amount"
                      type="text"
                      value={formData.rent_amount || ''}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deposit_amount">
                      Deposit Amount (£)
                    </label>
                    <input
                      id="deposit_amount"
                      name="deposit_amount"
                      type="text"
                      value={formData.deposit_amount || ''}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Lease Period</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lease_start_date">
                      Lease Start Date
                    </label>
                    <input
                      id="lease_start_date"
                      name="lease_start_date"
                      type="date"
                      value={formData.lease_start_date || ''}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lease_end_date">
                      Lease End Date
                    </label>
                    <input
                      id="lease_end_date"
                      name="lease_end_date"
                      type="date"
                      value={formData.lease_end_date || ''}
                      onChange={handleChange}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                {property.emoji ? (
                  <span className="text-4xl mr-3">{property.emoji}</span>
                ) : (
                  <Home className="h-8 w-8 mr-3 text-blue-600" />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
                  <p className="text-black mt-1">
                    {[
                      property.address_line1,
                      property.address_line2,
                      property.city,
                      property.county,
                      property.postcode,
                      property.country
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${property.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {property.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Property Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Type</p>
                    <p className="text-black">{property.property_type || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Financial Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Monthly Rent</p>
                    <p className="text-black">
                      {property.rent_amount ? `£${property.rent_amount.toFixed(2)}` : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Deposit</p>
                    <p className="text-black">
                      {property.deposit_amount ? `£${property.deposit_amount.toFixed(2)}` : 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Lease Period</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Start Date</p>
                  <p className="text-black">
                    {property.lease_start_date || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">End Date</p>
                  <p className="text-black">
                    {property.lease_end_date || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <PropertyImageUpload propertyId={property.id} />
            
            {/* Image Viewer Section */}
            <PropertyImageViewer propertyId={property.id} />
            
            {/* Timeline Events Section */}
            <div className="mt-8 pt-4 border-t">
              <PropertyTimeline propertyId={property.id} propertyName={property.name} />
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
              <button
                onClick={handleDeleteProperty}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <Trash className="w-4 h-4 mr-2" />
                Delete Property
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Property
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 