'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Loader2, Trash, Users } from 'lucide-react';
import { getProperty, deleteProperty, updateProperty } from '@/lib/api';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import PropertyTimeline from '@/components/timeline/PropertyTimeline';
import TabButton from '@/components/ui/TabButton';
import PropertyDetails from '@/components/properties/PropertyDetails';
import PropertyImageUpload from '@/components/properties/PropertyImageUpload';
import PropertyImageViewer from '@/components/properties/PropertyImageViewer';
import PropertyDocumentUpload from '@/components/properties/PropertyDocumentUpload';
import PropertyDocumentViewer from '@/components/properties/PropertyDocumentViewer';
import PropertyTenants from '@/components/properties/PropertyTenants';
import type { Property } from '@/components/properties/PropertyDetails';

export default function PropertyDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Property>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Get the current user ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUserId(data.user.id);
      }
    };
    
    fetchCurrentUser();
  }, [supabase.auth]);

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
        <div className="flex items-center space-x-2">
          <Link 
            href="/dashboard/properties" 
            className="rounded-md bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100"
          >
            <ArrowLeft className="inline-block w-4 h-4 mr-2" />
            Back to Properties
          </Link>
        </div>
        
        {!isEditing && (
          <div className="flex space-x-2">
            <button
              onClick={handleDeleteProperty}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Tab navigation */}
        <div className="border-b border-gray-200 bg-gray-50 px-4">
          <div className="flex space-x-4">
            <TabButton 
              active={activeTab === 'details'} 
              onClick={() => setActiveTab('details')}
            >
              Details
            </TabButton>
            <TabButton 
              active={activeTab === 'images'} 
              onClick={() => setActiveTab('images')}
            >
              Images
            </TabButton>
            <TabButton 
              active={activeTab === 'documents'} 
              onClick={() => setActiveTab('documents')}
            >
              Documents
            </TabButton>
            <TabButton 
              active={activeTab === 'timeline'} 
              onClick={() => setActiveTab('timeline')}
            >
              Timeline
            </TabButton>
            <TabButton 
              active={activeTab === 'tenants'} 
              onClick={() => setActiveTab('tenants')}
            >
              Tenants
            </TabButton>
          </div>
        </div>
        
        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <PropertyDetails 
              property={property}
              isEditing={isEditing}
              formData={formData}
              isSaving={isSaving}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              setIsEditing={setIsEditing}
            />
          )}
          
          {activeTab === 'images' && (
            <>
              <PropertyImageUpload propertyId={property.id} />
              <PropertyImageViewer propertyId={property.id} />
            </>
          )}
          
          {activeTab === 'documents' && (
            <>
              <PropertyDocumentUpload propertyId={property.id} />
              <PropertyDocumentViewer propertyId={property.id} />
            </>
          )}
          
          {activeTab === 'timeline' && (
            <PropertyTimeline propertyId={property.id} propertyName={property.name} />
          )}
          
          {activeTab === 'tenants' && (
            <PropertyTenants propertyId={property.id} currentUserId={currentUserId || ''} />
          )}
        </div>
      </div>
    </div>
  );
} 