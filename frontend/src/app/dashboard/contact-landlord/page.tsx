'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Check, ChevronsUpDown, AlertCircle, MapPin, AtSign } from 'lucide-react';
import Link from 'next/link';
import { getProperties } from '@/lib/api';
import { Property } from '@/components/properties/PropertyDetails';
import PropertyLandlordContact from '@/components/properties/PropertyLandlordContact';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

export default function ContactLandlordPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const result = await getProperties();
        
        if (result && result.data) {
          setProperties(result.data);
          // Set the first property as selected by default if available
          if (result.data.length > 0) {
            setSelectedProperty(result.data[0]);
          }
        }
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load properties');
        console.error('Error fetching properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
  };

  // Get full address as a formatted string
  const getFullAddress = (property: Property) => {
    if (!property) return '';
    
    const parts = [];
    if (property.address_line1) parts.push(property.address_line1);
    if (property.address_line2) parts.push(property.address_line2);
    if (property.city) parts.push(property.city);
    if (property.county) parts.push(property.county);
    if (property.postcode) parts.push(property.postcode);
    
    return parts.join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Link
            href="/dashboard"
            className="mr-4 flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl text-gray-700 font-bold">Contact Landlord</h1>
        </div>
      </div>
      
      {/* Property Selector - Now at the top */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex flex-col space-y-5">
          <div className="w-full max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select Property
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 text-gray-600 focus:ring-blue-500 focus:border-blue-500">
                <span className="truncate">{selectedProperty ? selectedProperty.name : 'Select a property'}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 text-gray-500 flex-shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[300px] max-h-[400px] overflow-y-auto bg-white border border-gray-200 shadow-md" sideOffset={4}>
                <DropdownMenuLabel className="font-semibold">Your Properties</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200" />
                {properties.length === 0 ? (
                  <DropdownMenuItem disabled className="opacity-50 cursor-default">
                    No properties available
                  </DropdownMenuItem>
                ) : (
                  properties.map(property => (
                    <DropdownMenuItem
                      key={property.id}
                      onClick={() => handlePropertySelect(property)}
                      className="flex justify-between hover:bg-blue-50 cursor-pointer"
                    >
                      {property.name}
                      {selectedProperty?.id === property.id && <Check className="h-4 w-4 text-blue-600" />}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {selectedProperty && (
            <div className="border-t border-gray-200 pt-4 text-sm">
              <div className="flex flex-col sm:flex-row sm:gap-x-12">
                <div className="flex items-start mb-2 sm:mb-0">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-700 mb-0.5">Address</div>
                    <div className="text-gray-600">{getFullAddress(selectedProperty)}</div>
                  </div>
                </div>
                
                {selectedProperty.landlord_email && (
                  <div className="flex items-start">
                    <AtSign className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-700 mb-0.5">Landlord Email</div>
                      <div className="text-gray-600">{selectedProperty.landlord_email}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Contact Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {!selectedProperty ? (
          <div className="py-8 text-center text-gray-500">
            <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Please select a property to contact the landlord.</p>
          </div>
        ) : loading ? (
          <div className="py-8 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-blue-100 rounded-full mb-3"></div>
              <div className="h-4 w-48 bg-blue-100 rounded mb-2"></div>
              <div className="h-3 w-32 bg-blue-50 rounded"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <PropertyLandlordContact
            propertyId={selectedProperty.id}
            propertyName={selectedProperty.name}
            landlordEmail={selectedProperty.landlord_email}
          />
        )}
      </div>
    </div>
  );
} 