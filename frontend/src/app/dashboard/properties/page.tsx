'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Home, Building, Loader2, MapPin, ArrowRight, ShieldCheck, ShieldX, Info, Camera } from 'lucide-react';
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
  // Additional fields for deposit protection
  deposit_protected?: boolean;
  protected_rooms?: string[];
}

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredShield, setHoveredShield] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

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
      
      // Enhance properties with mock deposit protection data for demonstration
      const enhancedProperties = (data.data || []).map((property: Property) => {
        // Randomly assign deposit protection status and rooms for demo
        const isProtected = Math.random() > 0.5;
        
        // Sample protected rooms if deposit is protected
        const sampleRooms = isProtected ? 
          ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom'].filter(() => Math.random() > 0.3) :
          [];
          
        return {
          ...property,
          deposit_protected: isProtected,
          protected_rooms: sampleRooms
        };
      });
      
      setProperties(enhancedProperties);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load properties');
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigateToPropertyDetails = (id: string) => {
    router.push(`/dashboard/properties/${id}`);
  };
  
  // Handle shield icon hover
  const handleShieldMouseEnter = (e: React.MouseEvent, propertyId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY
    });
    setHoveredShield(propertyId);
    e.stopPropagation(); // Prevent card hover effect from interfering
  };
  
  const handleShieldMouseLeave = (e: React.MouseEvent) => {
    setHoveredShield(null);
    e.stopPropagation(); // Prevent card hover effect from interfering
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <Building className="h-7 w-7 mr-3 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">My Properties</h2>
        </div>
        <Link 
          href="/dashboard/properties/add" 
          className="rounded-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-5 text-sm font-semibold shadow-sm flex items-center transition-all duration-200 hover:shadow-md"
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-blue-50 shadow-lg rounded-xl p-10 text-center">
          <Building className="w-20 h-20 mx-auto text-blue-500 mb-6 opacity-80" />
          <h3 className="text-2xl font-medium mb-3">No properties found</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            You haven't added any properties yet. Add your first property to get started with managing your rental properties.
          </p>
          <Link 
            href="/dashboard/properties/add" 
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-full inline-flex items-center shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Property
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div 
                key={property.id} 
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1" 
                onClick={() => navigateToPropertyDetails(property.id)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold mb-3 flex items-center text-gray-900 group-hover:text-blue-600 transition-colors">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 mr-3 group-hover:bg-blue-100 transition-colors">
                        {property.emoji ? (
                          <span className="text-xl">{property.emoji}</span>
                        ) : (
                          <Home className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      {property.name}
                    </h2>
                    
                    {/* Deposit Protection Indicator */}
                    <div 
                      className={`flex items-center p-1.5 rounded-lg ${property.deposit_protected ? 'bg-green-50' : 'bg-amber-50'} cursor-pointer`}
                      onMouseEnter={(e) => handleShieldMouseEnter(e, property.id)}
                      onMouseLeave={handleShieldMouseLeave}
                      onClick={(e) => e.stopPropagation()} // Prevent navigating when clicking the shield
                    >
                      {property.deposit_protected ? (
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                      ) : (
                        <ShieldX className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start mt-4 text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm">
                      {[
                        property.address_line1,
                        property.city,
                        property.postcode
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-end mt-5 pt-4 border-t border-gray-100">                  
                    <ArrowRight className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Fixed position tooltip that won't be cut off by overflow */}
          {hoveredShield && (
            <div 
              className="fixed bg-white p-4 rounded-lg shadow-xl z-50 border border-gray-200 w-72 animate-fadeIn"
              style={{
                top: `${tooltipPosition.y + 5}px`, 
                left: `${tooltipPosition.x - 200}px`
              }}
            >
              {(() => {
                const property = properties.find(p => p.id === hoveredShield);
                if (!property) return null;
                
                return (
                  <>
                    <div className="flex items-center mb-3">
                      {property.deposit_protected ? (
                        <>
                          <ShieldCheck className="w-5 h-5 text-green-600 mr-2" />
                          <span className="font-semibold text-green-700">Deposit Protected</span>
                        </>
                      ) : (
                        <>
                          <ShieldX className="w-5 h-5 text-amber-600 mr-2" />
                          <span className="font-semibold text-amber-700">Deposit Not Protected</span>
                        </>
                      )}
                    </div>
                    
                    {property.deposit_protected && property.protected_rooms && property.protected_rooms.length > 0 ? (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Rooms with evidence:</p>
                        <ul className="space-y-1.5">
                          {property.protected_rooms.map((room, idx) => (
                            <li key={idx} className="flex items-center text-sm text-gray-700">
                              <Camera className="w-4 h-4 mr-2 text-blue-500" />
                              {room}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : property.deposit_protected ? (
                      <p className="text-sm text-gray-600">No rooms documented yet</p>
                    ) : (
                      <div className="flex items-start mt-2">
                        <Info className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                        <p className="text-sm text-gray-600">Document your property condition to protect your security deposit</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
} 