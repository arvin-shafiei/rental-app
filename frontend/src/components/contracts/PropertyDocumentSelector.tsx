'use client';

import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';

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

  // Mock data until real API is connected
  const properties = [
    { id: '1', name: 'Apartment 123' },
    { id: '2', name: 'House 456' }
  ];
  
  const documents = [
    { path: 'doc1', filename: 'Lease.pdf', documentType: 'lease' },
    { path: 'doc2', filename: 'Inventory.docx', documentType: 'inventory' }
  ];

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const propId = e.target.value;
    setSelectedProperty(propId);
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
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Property:
        </label>
        <select
          value={selectedProperty}
          onChange={handlePropertyChange}
          className="block w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="">Select a property</option>
          {properties.map(property => (
            <option key={property.id} value={property.id}>
              {property.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProperty && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Document:
          </label>
          <select
            value={selectedDocument}
            onChange={handleDocumentChange}
            className="block w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select a document</option>
            {documents.map((doc, index) => (
              <option key={index} value={doc.path}>
                {doc.filename} ({doc.documentType})
              </option>
            ))}
          </select>
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