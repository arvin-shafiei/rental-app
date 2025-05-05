'use client';

import { useState, useEffect } from 'react';
import { Loader2, Search, AlertTriangle } from 'lucide-react';
import { getProperties, getPropertyDocuments } from '@/lib/api';
import React from 'react';

interface Property {
  id: string;
  name: string;
}

// Match the actual backend response structure
interface DocumentCategory {
  documentType: string;  // Updated from 'type' to 'documentType'
  documents: {
    id: string;
    filename: string;  // Updated from 'name' to 'filename'
    path: string;
    metadata?: {
      size: number;
    };
    created_at?: string;
    url?: string;
  }[];
}

interface PropertyDocumentSelectorProps {
  onSelectPropertyId: (propertyId: string | null) => void;
  onScanContract: (documentPath: string) => void;
  isScanning: boolean;
}

export default function PropertyDocumentSelector({ 
  onSelectPropertyId, 
  onScanContract, 
  isScanning 
}: PropertyDocumentSelectorProps) {
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch properties on component mount
  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoadingProperties(true);
      setError(null);
      
      try {
        const response = await getProperties();
        if (response.success && Array.isArray(response.data)) {
          setProperties(response.data);
        } else {
          setError('Failed to load properties');
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load properties');
      } finally {
        setIsLoadingProperties(false);
      }
    };
    
    fetchProperties();
  }, []);

  // Fetch documents when a property is selected
  useEffect(() => {
    if (!selectedProperty) {
      setDocumentCategories([]);
      return;
    }
    
    const fetchDocuments = async () => {
      setIsLoadingDocuments(true);
      setError(null);
      
      try {
        const response = await getPropertyDocuments(selectedProperty);
        
        console.log('Document response:', response); // Debug the response
        
        if (response.success && Array.isArray(response.data)) {
          setDocumentCategories(response.data);
        } else {
          setError('Failed to load documents');
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents');
      } finally {
        setIsLoadingDocuments(false);
      }
    };
    
    fetchDocuments();
  }, [selectedProperty]);

  // Count total documents across all categories
  const totalDocuments = documentCategories.reduce(
    (count, category) => count + (category.documents?.length || 0), 
    0
  );

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const propId = e.target.value;
    setSelectedProperty(propId);
    setSelectedDocument('');
    onSelectPropertyId(propId || null);
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDocument(e.target.value);
  };

  const handleScanDocument = () => {
    if (selectedDocument) {
      onScanContract(selectedDocument);
    }
  };

  if (isScanning) {
    return (
      <div className="p-4 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
        <p className="mt-2 text-sm text-gray-500">Scanning document...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {error && (
        <div className="mb-3 p-2 bg-red-50 text-red-700 border border-red-200 rounded-md flex items-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Property:
        </label>
        {isLoadingProperties ? (
          <div className="flex items-center justify-center p-2">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-sm text-gray-500">Loading properties...</span>
          </div>
        ) : (
          <select
            value={selectedProperty}
            onChange={handlePropertyChange}
            className="block w-full p-2 border border-gray-300 rounded-md"
            disabled={isLoadingProperties}
          >
            <option value="">Select a property</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedProperty && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Document:
          </label>
          {isLoadingDocuments ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Loading documents...</span>
            </div>
          ) : totalDocuments === 0 ? (
            <p className="text-sm text-gray-500 p-2">No documents found for this property</p>
          ) : (
            <select
              value={selectedDocument}
              onChange={handleDocumentChange}
              className="block w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a document</option>
              {documentCategories.map(category => (
                <React.Fragment key={category.documentType || 'undefined'}>
                  {category.documentType && category.documents && category.documents.length > 0 && (
                    <optgroup label={category.documentType.charAt(0).toUpperCase() + category.documentType.slice(1).replace(/-/g, ' ')}>
                      {category.documents.map(doc => (
                        <option key={doc.id} value={doc.path}>
                          {doc.filename}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </React.Fragment>
              ))}
            </select>
          )}
        </div>
      )}

      <button
        onClick={handleScanDocument}
        disabled={!selectedDocument || isScanning}
        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        <Search className="w-4 h-4 inline mr-2" />
        Scan Selected Document
      </button>
    </div>
  );
} 