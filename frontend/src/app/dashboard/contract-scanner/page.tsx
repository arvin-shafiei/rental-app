'use client';

import { useState } from 'react';
import { ArrowLeft, Upload, FileText, Search } from 'lucide-react';
import Link from 'next/link';
import ContractUploader from '@/components/contracts/ContractUploader';
import dynamic from 'next/dynamic';
import { scanContractDocument } from '@/lib/api';

// Use dynamic imports with proper type declarations
const DynamicPropertyDocumentSelector = dynamic(
  () => import('@/components/contracts/PropertyDocumentSelector'),
  { ssr: false }
);

const DynamicContractScanResults = dynamic(
  () => import('@/components/contracts/ContractScanResults'),
  { ssr: false }
);

export default function ContractScannerPage() {
  const [scanResults, setScanResults] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleScanContract = async (file: File | string) => {
    setIsScanning(true);
    setScanError(null);
    
    try {
      // In a real application, this would call the backend API
      // For now, we'll use a mock response after a delay to simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // We'll now call the real API instead of using mock data
      const response = await scanContractDocument(file);
      
      if (response.success && response.data) {
        setScanResults(response.data);
      } else {
        setScanError('Failed to analyze contract');
      }
    } catch (error) {
      console.error('Error scanning contract:', error);
      setScanError('Failed to scan contract. Please try again later.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link
            href="/dashboard"
            className="mr-4 flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Contract Scanner</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-blue-600" />
              Upload New Contract
            </h2>
            <ContractUploader onScanContract={handleScanContract} isScanning={isScanning} />
          </div>
          
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Select From Property Documents
            </h2>
            <DynamicPropertyDocumentSelector 
              onSelectPropertyId={setSelectedPropertyId}
              onScanContract={handleScanContract}
              isScanning={isScanning}
            />
          </div>
        </div>
        
        <div className="col-span-1 md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Search className="h-5 w-5 mr-2 text-blue-600" />
              Contract Analysis Results
            </h2>
            
            {scanError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                <p>{scanError}</p>
              </div>
            )}
            
            <DynamicContractScanResults 
              results={scanResults} 
              isScanning={isScanning} 
            />
          </div>
        </div>
      </div>
    </div>
  );
} 