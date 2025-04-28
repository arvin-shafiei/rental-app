'use client';

import { useState, useEffect } from 'react';
import TabButton from '@/components/ui/TabButton';
import { getProperties } from '@/lib/api';
import { toast } from '@/components/ui/FormElements';
import CreateAgreementForm from '@/components/agreements/CreateAgreementForm';
import ViewAgreementsPanel from '@/components/agreements/ViewAgreementsPanel';
import { Property } from '@/types/agreement';

export default function AgreementBuilder() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'create' | 'view'>('create');
  
  // Properties state
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // State for syncing between tabs
  const [lastCreatedPropertyId, setLastCreatedPropertyId] = useState<string>('');

  // Fetch properties on initial load
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        const response = await getProperties();
        console.log('Properties response:', response);
        // Extract properties from the data property of the response
        const propertiesArray = response.data && Array.isArray(response.data) ? response.data : [];
        setProperties(propertiesArray);
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast({
          title: 'Error',
          description: 'Failed to load properties',
          variant: 'destructive',
        });
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Handler for when a new agreement is created
  const handleAgreementCreated = (propertyId: string) => {
    setLastCreatedPropertyId(propertyId);
    setActiveTab('view');
  };

  return (
    <div className="container mx-auto py-6 text-black">
      <h1 className="text-3xl font-bold mb-6 text-black">Agreements</h1>
      
      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        <TabButton 
          active={activeTab === 'create'} 
          onClick={() => setActiveTab('create')}
        >
          Create Agreement
        </TabButton>
        <TabButton 
          active={activeTab === 'view'} 
          onClick={() => setActiveTab('view')}
        >
          View Agreements
        </TabButton>
      </div>
      
      {/* Conditional rendering based on active tab */}
      {activeTab === 'create' ? (
        <CreateAgreementForm 
          properties={properties} 
          isLoading={isLoading}
          onAgreementCreated={handleAgreementCreated}
        />
      ) : (
        <ViewAgreementsPanel 
          properties={properties} 
          isLoading={isLoading}
          selectedPropertyId={lastCreatedPropertyId}
        />
      )}
    </div>
  );
}
