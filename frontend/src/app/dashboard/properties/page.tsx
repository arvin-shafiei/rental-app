'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Home, Trash, Building, Loader2 } from 'lucide-react';
import { getProperties, deleteProperty } from '@/lib/api';

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

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch properties when component mounts
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      console.log('Fetching properties using API helper...');
      
      // Use the API helper function to fetch properties
      const data = await getProperties();
      
      console.log('Properties data received:', data);
      setProperties(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load properties');
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProperty = async (id: string, e: React.MouseEvent) => {
    // Stop propagation to prevent navigating to edit page when clicking delete
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    try {
      console.log(`Deleting property with ID: ${id}`);
      
      // Use the API helper function to delete the property
      await deleteProperty(id);
      
      console.log('Property deleted successfully');
      
      // Refresh the properties list
      fetchProperties();
    } catch (err: any) {
      setError(err.message || 'Failed to delete property');
      console.error('Error deleting property:', err);
    }
  };

  const navigateToPropertyDetails = (id: string) => {
    router.push(`/dashboard/properties/${id}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Building className="h-6 w-6 mr-2 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">My Properties</h2>
        </div>
        <Link 
          href="/dashboard/properties/add" 
          className="rounded-md bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 text-sm font-semibold shadow-sm flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Property
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <Building className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium mb-2">No properties found</h3>
          <p className="text-black mb-6">
            You haven't added any properties yet. Add your first property to get started.
          </p>
          <Link 
            href="/dashboard/properties/add" 
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Property
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div 
              key={property.id} 
              className="bg-white border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => navigateToPropertyDetails(property.id)}
            >
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold mb-2 flex items-center text-gray-900">
                    {property.emoji ? (
                      <span className="mr-2 text-2xl">{property.emoji}</span>
                    ) : (
                      <Home className="w-5 h-5 mr-2 text-blue-600" />
                    )}
                    {property.name}
                  </h2>
                  <span className={`px-2 py-1 rounded-full text-xs ${property.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {property.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <p className="text-black mb-4">
                  {[
                    property.address_line1,
                    property.city,
                    property.postcode
                  ].filter(Boolean).join(', ')}
                </p>
                
                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button
                    onClick={(e) => handleDeleteProperty(property.id, e)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 