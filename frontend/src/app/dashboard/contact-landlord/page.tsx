'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Check, ChevronsUpDown, AlertCircle, MapPin, AtSign, Edit2, Save } from 'lucide-react';
import Link from 'next/link';
import { getProperties, updateProperty } from '@/lib/api';
import { Property } from '@/components/properties/PropertyDetails';
import PropertyLandlordContact from '@/components/properties/PropertyLandlordContact';
import { Toast } from "@/components/ui/FormElements";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/FormElements';
import { supabase } from '@/lib/supabase/client';

// Update the PropertyLandlordContact props type to include our new props
interface ExtendedPropertyLandlordContactProps {
  propertyId: string;
  propertyName: string;
  landlordEmail?: string;
  onEmailLimitError: () => void;
  checkEmailLimit: () => Promise<boolean>;
}

export default function ContactLandlordPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [landlordEmail, setLandlordEmail] = useState<string>('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showLimitError, setShowLimitError] = useState<boolean>(false);

  useEffect(() => {
    // Get the auth token
    async function getAuthToken() {
      const { data } = await supabase.auth.getSession();
      setAuthToken(data.session?.access_token || null);
    }

    getAuthToken();
  }, []);

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
            setLandlordEmail(result.data[0].landlord_email || '');
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

  // Check if user has reached email limit
  const checkEmailLimit = async (): Promise<boolean> => {
    try {
      // Try to get a fresh token
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      
      if (!token) {
        console.error('No access token available');
        return false; // Don't allow email if we can't verify limits
      }
      
      console.log('Checking email limits with token');
      
      const response = await fetch(`/api/stripe/check-limits?feature=emails`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.error(`Check limit failed with status: ${response.status}`);
        if (response.status === 401) {
          // If unauthorized, try refreshing the token and retrying once
          const { data: refreshData } = await supabase.auth.refreshSession();
          if (refreshData.session?.access_token) {
            const retryResponse = await fetch(`/api/stripe/check-limits?feature=emails`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${refreshData.session.access_token}`
              }
            });
            
            if (retryResponse.ok) {
              const retryResult = await retryResponse.json();
              return retryResult.allowed;
            }
          }
        }
        // If we still can't check limits after retry, be cautious and don't allow
        return false;
      }
      
      const result = await response.json();
      console.log('Limit check result:', result);
      
      return result.allowed;
    } catch (error) {
      console.error('Error checking email limits:', error);
      return false; // Don't allow email if check fails
    }
  };

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setLandlordEmail(property.landlord_email || '');
    setIsEditingEmail(false);
    setUpdateSuccess(false);
    setUpdateError(null);
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

  const handleEditEmail = () => {
    setIsEditingEmail(true);
    setUpdateSuccess(false);
    setUpdateError(null);
  };

  const handleSaveEmail = async () => {
    if (!selectedProperty) return;
    
    setUpdateLoading(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    
    try {
      // Update property with new landlord email
      const updatedData = { landlord_email: landlordEmail };
      const result = await updateProperty(selectedProperty.id, updatedData);
      
      if (result && result.success) {
        // Update the local property data
        const updatedProperty = { ...selectedProperty, landlord_email: landlordEmail };
        setSelectedProperty(updatedProperty);
        
        // Update the property in the properties list
        const updatedProperties = properties.map(prop => 
          prop.id === selectedProperty.id ? updatedProperty : prop
        );
        setProperties(updatedProperties);
        
        setUpdateSuccess(true);
        setIsEditingEmail(false);
      } else {
        setUpdateError('Failed to update landlord email');
      }
    } catch (err: any) {
      setUpdateError(err.message || 'Failed to update landlord email');
      console.error('Error updating landlord email:', err);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Function to handle email limit error
  const handleEmailLimitError = () => {
    setShowLimitError(true);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Link 
          href="/dashboard/properties" 
          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Properties
        </Link>
        <h1 className="text-2xl font-bold mt-4 text-gray-900">Contact Landlord</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 lg:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
            </div>
            <div className="p-0">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading properties...</p>
                </div>
              ) : error ? (
                <div className="p-4 text-red-600 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
              ) : properties.length === 0 ? (
                <div className="p-4 text-gray-600">
                  <p>No properties found.</p>
                  <Link 
                    href="/dashboard/properties/add" 
                    className="text-blue-600 hover:text-blue-800 mt-2 block"
                  >
                    Add a property
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {properties.map((property) => (
                    <li key={property.id}>
                      <button
                        className={`w-full text-left px-5 py-3 ${
                          selectedProperty?.id === property.id 
                            ? 'bg-blue-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handlePropertySelect(property)}
                      >
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{property.emoji || '🏠'}</span>
                          <span className="font-medium text-gray-900">{property.name}</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1 flex items-center">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">
                            {property.address_line1}, {property.city}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        
        <div className="md:col-span-8 lg:col-span-9">
          {!selectedProperty ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                {properties.length > 0 ? 
                  "Select a property to contact the landlord" : 
                  "Add a property to contact your landlord"
                }
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
                <div className="p-5 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Property Details</h2>
                </div>
                <div className="p-5">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">{selectedProperty.emoji || '🏠'}</span>
                    <h3 className="text-xl font-bold text-gray-900">{selectedProperty.name}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Address</h4>
                      <p className="text-gray-900">{getFullAddress(selectedProperty)}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Landlord Email</h4>
                      
                      <div className="flex items-center gap-2">
                        {isEditingEmail ? (
                          <div className="flex items-center gap-2" style={{ minWidth: '450px' }}>
                            <Input
                              type="email"
                              value={landlordEmail}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLandlordEmail(e.target.value)}
                              placeholder="Enter landlord email"
                              className="!w-64 h-8 text-sm"
                            />
                            <Button 
                              onClick={handleSaveEmail} 
                              size="sm" 
                              variant="outline" 
                              className="h-8 gap-1 text-blue-600 hover:text-blue-800 border-blue-600 hover:border-blue-800 hover:bg-blue-50"
                              disabled={updateLoading}
                            >
                              {updateLoading ? (
                                <>
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                                  <span>Saving</span>
                                </>
                              ) : (
                                <>
                                  <Save className="h-3 w-3" />
                                  <span>Save</span>
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="text-gray-600">
                              {selectedProperty.landlord_email || 'Not set'}
                            </span>
                            <Button 
                              onClick={handleEditEmail} 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 px-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span className="ml-1">Edit</span>
                            </Button>
                          </>
                        )}
                      </div>
                      {updateSuccess && (
                        <div className="text-green-600 flex items-center gap-1 mt-1 text-xs">
                          <Check className="h-3 w-3" />
                          <span>Landlord email updated successfully</span>
                        </div>
                      )}
                      {updateError && (
                        <div className="text-red-600 flex items-center gap-1 mt-1 text-xs">
                          <AlertCircle className="h-3 w-3" />
                          <span>{updateError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Contact Form */}
      {selectedProperty && (
        <div className="mt-8">
          <PropertyLandlordContact 
            propertyId={selectedProperty.id} 
            propertyName={selectedProperty.name}
            landlordEmail={selectedProperty.landlord_email}
            onEmailLimitError={handleEmailLimitError}
            checkEmailLimit={checkEmailLimit}
          />
        </div>
      )}
      
      {/* Limit exceeded toast with link to billing */}
      <Toast 
        title="Email Limit Reached"
        description={
          <div>
            You've reached your email sending limit. 
            <Link 
              href="/dashboard/settings/billing" 
              className="ml-1 text-blue-600 hover:text-blue-800 underline"
            >
              Upgrade your plan
            </Link> to send more emails.
          </div>
        }
        variant="destructive"
        visible={showLimitError}
        onClose={() => setShowLimitError(false)}
      />
    </div>
  );
} 