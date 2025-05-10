'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Loader2, Trash } from 'lucide-react';
import { getProperty, deleteProperty, updateProperty } from '@/lib/api';
import { supabase } from '@/lib/supabase/client';
import PropertyTimeline from '@/components/timeline/PropertyTimeline';
import PropertyDetails from '@/components/properties/PropertyDetails';
import PropertyImageUpload from '@/components/properties/PropertyImageUpload';
import PropertyImageViewer from '@/components/properties/PropertyImageViewer';
import PropertyDocumentUpload from '@/components/properties/PropertyDocumentUpload';
import PropertyDocumentViewer from '@/components/properties/PropertyDocumentViewer';
import PropertyTenants from '@/components/properties/PropertyTenants';
import type { Property } from '@/components/properties/PropertyDetails';

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export default function PropertyDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Property>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [documentRefreshCounter, setDocumentRefreshCounter] = useState(0);

  // Get the current user ID using the same approach as dashboard/page.tsx
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          const userId = data.session.user.id;
          console.log('Current user ID from session:', userId);
          setCurrentUserId(userId);
        } else {
          console.log('No session found');
        }
      } catch (err) {
        console.error('Error fetching session:', err);
      }
    };
    
    fetchCurrentUser();
  }, []);

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

  // Function to trigger document list refresh
  const handleDocumentUploaded = () => {
    setDocumentRefreshCounter(prev => prev + 1);
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Link 
            href="/dashboard/properties" 
            className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100 transition-colors"
          >
            <ArrowLeft className="inline-block w-4 h-4 mr-2" />
            Back to Properties
          </Link>
          {property.name && (
            <h1 className="text-2xl font-bold text-gray-900 ml-2">{property.name}</h1>
          )}
        </div>
        
        {!isEditing && (
          <div className="flex space-x-2">
            <button
              onClick={handleDeleteProperty}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <Tabs
          defaultValue="overview"
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <div className="mb-6">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-full bg-gray-100 p-1 text-slate-500 w-auto">
              <TabsTrigger 
                value="overview" 
                className="rounded-full px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="images" 
                className="rounded-full px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              Deposit Protection
              </TabsTrigger>
              <TabsTrigger 
                value="documents" 
                className="rounded-full px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              Documents
              </TabsTrigger>
              <TabsTrigger 
                value="timeline" 
                className="rounded-full px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
            >
              Timeline
              </TabsTrigger>
            </TabsList>
        </div>
        
          <Card className="rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <TabsContent value="overview" className="p-6 focus:outline-none">
              <div className="space-y-10">
            <PropertyDetails 
              property={property}
              isEditing={isEditing}
              formData={formData}
              isSaving={isSaving}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              setIsEditing={setIsEditing}
            />
                
                <div className="mt-8 border-t border-gray-200 pt-8">
                  <PropertyTenants 
                    propertyId={property.id} 
                    currentUserId={currentUserId || ''} 
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="images" className="p-6 focus:outline-none">
              <PropertyImageUpload propertyId={property.id} />
              <PropertyImageViewer propertyId={property.id} />
            </TabsContent>
          
            <TabsContent value="documents" className="p-6 focus:outline-none">
              <PropertyDocumentUpload 
                propertyId={property.id} 
                onDocumentUploaded={handleDocumentUploaded}
              />
              <PropertyDocumentViewer 
                propertyId={property.id} 
                key={`document-viewer-${documentRefreshCounter}`}
              />
            </TabsContent>
          
            <TabsContent value="timeline" className="p-6 focus:outline-none">
            <PropertyTimeline propertyId={property.id} propertyName={property.name} />
            </TabsContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
} 