'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, FileText, Search, History, Calendar, Clock } from 'lucide-react';
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

interface ContractSummary {
  id: string;
  summary: any;
  created_at: string;
  user_id?: string;
}

export default function ContractScannerPage() {
  const [scanResults, setScanResults] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<ContractSummary[]>([]);
  const [summariesLoading, setSummariesLoading] = useState(true);
  const [summariesError, setSummariesError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch contract summaries
    async function fetchSummaries() {
      try {
        setSummariesLoading(true);
        const response = await fetch('/api/contracts/summaries');
        
        if (!response.ok) {
          throw new Error('Failed to load contract summaries');
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setSummaries(data.data);
        } else {
          setSummariesError('Could not load contract history');
        }
      } catch (error: any) {
        console.error('Error fetching summaries:', error);
        setSummariesError(error.message || 'Failed to load summaries');
      } finally {
        setSummariesLoading(false);
      }
    }
    
    fetchSummaries();
  }, []);

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
        
        // Refresh summaries after scanning
        try {
          const summariesResponse = await fetch('/api/contracts/summaries');
          const summariesData = await summariesResponse.json();
          if (summariesData.success && Array.isArray(summariesData.data)) {
            setSummaries(summariesData.data);
          }
        } catch (err) {
          console.error('Failed to refresh summaries after scan:', err);
        }
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

      {/* Show contract analysis results at the top if available */}
      {scanResults && (
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Search className="h-5 w-5 mr-2 text-blue-600" />
            Latest Contract Analysis
          </h2>
          
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h3 className="text-lg font-medium">
              {scanResults.title || scanResults.name || 'Contract Analysis'}
            </h3>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleString()}
            </p>
          </div>
          
          <DynamicContractScanResults 
            results={scanResults} 
            isScanning={isScanning} 
          />
        </div>
      )}
      
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
              Contract Scan Details
            </h2>
            
            {scanError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
                <p>{scanError}</p>
              </div>
            )}
            
            {!scanResults && !isScanning ? (
              <div className="py-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No contract analyzed yet. Upload a document to scan it.</p>
              </div>
            ) : isScanning ? (
              <div className="py-8 text-center">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-12 w-12 bg-blue-100 rounded-full mb-3"></div>
                  <div className="h-4 w-48 bg-blue-100 rounded mb-2"></div>
                  <div className="h-3 w-32 bg-blue-50 rounded"></div>
                </div>
                <p className="mt-4 text-gray-600">Analyzing your contract...</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      
      {/* Contract summaries section */}
      <div className="mt-10">
        <div className="flex items-center mb-6">
          <History className="h-5 w-5 mr-2 text-blue-600" />
          <h2 className="text-lg font-semibold">Your Contract History</h2>
        </div>
        
        {summariesLoading ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-gray-500">Loading your contract summaries...</p>
          </div>
        ) : summariesError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p>Error: {summariesError}</p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center min-h-[200px]">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-center text-gray-500">
              You haven't scanned any contracts yet.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summaries.slice(0, 6).map((summary) => (
                <div key={summary.id} className="bg-white rounded-lg shadow-md p-4 h-full">
                  <div className="mb-2">
                    <h3 className="text-lg font-medium truncate">
                      {summary.summary.title || summary.summary.name || 'Contract Analysis'}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(summary.created_at).toLocaleDateString()} 
                      <Clock className="h-3 w-3 mx-1" />
                      {new Date(summary.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {summary.summary.keyPoints && (
                      <div>
                        <h4 className="font-medium text-sm">Key Points</h4>
                        <ul className="text-sm list-disc pl-5 mt-1">
                          {summary.summary.keyPoints.slice(0, 3).map((point: string, i: number) => (
                            <li key={i} className="text-gray-600 truncate">{point}</li>
                          ))}
                          {summary.summary.keyPoints.length > 3 && (
                            <li className="text-blue-600">...</li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    <button
                      onClick={() => setScanResults(summary.summary)}
                      className="block w-full mt-4 px-4 py-2 text-center text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      View Full Analysis
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {summaries.length > 6 && (
              <div className="flex justify-center mt-6">
                <Link 
                  href="/dashboard/contract-history"
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  View All Contract Analyses
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 