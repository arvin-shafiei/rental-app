'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, FileText, Search, History, Calendar, Clock, Folder, Loader2, AlertTriangle, X, Check, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
import ContractUploader from '@/components/contracts/ContractUploader';
import ContractHistoryViewer from '@/components/contracts/ContractHistoryViewer';
import dynamic from 'next/dynamic';
import { scanContractDocument, getProperties, getPropertyDocuments } from '@/lib/api';
import { supabase } from '@/lib/supabase/client';
import { fetchFromApi } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

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

interface PropertyDocument {
  id: string;
  filename: string;
  path: string;
  url?: string;
  metadata?: {
    size: number;
  };
  created_at?: string;
}

interface DocumentCategory {
  documentType: string;
  documents: PropertyDocument[];
}

export default function ContractScannerPage() {
  const [scanResults, setScanResults] = useState<any | null>(null);
  const [isFileScanning, setIsFileScanning] = useState(false);
  const [isDocumentScanning, setIsDocumentScanning] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedDocumentPath, setSelectedDocumentPath] = useState<string>('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<ContractSummary[]>([]);
  const [summariesLoading, setSummariesLoading] = useState(true);
  const [summariesError, setSummariesError] = useState<string | null>(null);
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Array<{id: string, name: string}>>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMoreSummaries, setHasMoreSummaries] = useState(true);
  const pageSize = 5;

  // Helper function to fetch summaries using the API helper
  const fetchUserContractSummaries = async (userId: string, currentPage: number = 1, append: boolean = false) => {
    try {
      console.log(`Fetching contract summaries for user: ${userId}, page: ${currentPage}`);
      
      // Use the fetchFromApi helper which handles auth properly
      const result = await fetchFromApi(`/contracts/summaries?userId=${userId}&page=${currentPage}&limit=${pageSize}`);
      console.log('Contract summaries API response:', result);
      
      if (result && result.success && Array.isArray(result.data)) {
        console.log(`Received ${result.data.length} contract summaries`);
        
        if (append) {
          setSummaries(prev => [...prev, ...result.data]);
        } else {
          setSummaries(result.data);
        }
        
        // Check if we have more summaries to load
        setHasMoreSummaries(result.data.length === pageSize);
      } else {
        console.error('Invalid response format:', result);
        setSummariesError('Could not load contract history');
      }
    } catch (error: any) {
      console.error('Error fetching contract summaries:', error);
      setSummariesError(error.message || 'Failed to load summaries');
    } finally {
      setSummariesLoading(false);
    }
  };

  // Load more summaries when requested
  const loadMoreSummaries = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (userId) {
        const nextPage = page + 1;
        setPage(nextPage);
        await fetchUserContractSummaries(userId, nextPage, true);
      }
    } catch (error) {
      console.error('Error loading more summaries:', error);
    }
  };

  useEffect(() => {
    // Fetch contract summaries
    async function fetchSummaries() {
      try {
        setSummariesLoading(true);
        
        // Get the current user's ID from Supabase session
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData?.session?.user?.id;
        
        // Only fetch if we have a userId
        if (!userId) {
          console.log('No authenticated user found for fetching contract summaries');
          setSummariesLoading(false);
          return; // Just return without setting an error to avoid confusion
        }
        
        // Use our helper function to fetch summaries
        await fetchUserContractSummaries(userId, 1, false);
      } catch (error: any) {
        console.error('Error in fetchSummaries:', error);
        setSummariesLoading(false);
      }
    }
    
    fetchSummaries();
  }, []);

  // Fetch properties on component mount
  useEffect(() => {
    const fetchProperties = async () => {
      setPropertiesLoading(true);
      setPropertiesError(null);
      
      try {
        const result = await getProperties();
        
        if (result && result.data) {
          setProperties(result.data);
          // Set the first property as selected by default if available
          if (result.data.length > 0) {
            setSelectedPropertyId(result.data[0].id);
          }
        } else {
          setPropertiesError('Failed to load properties');
        }
      } catch (err: any) {
        console.error('Error fetching properties:', err);
        setPropertiesError(err.message || 'Failed to load properties');
      } finally {
        setPropertiesLoading(false);
      }
    };
    
    fetchProperties();
  }, []);

  // Fetch documents when a property is selected
  useEffect(() => {
    if (!selectedPropertyId) {
      setDocumentCategories([]);
      return;
    }
    
    const fetchDocuments = async () => {
      setIsLoadingDocuments(true);
      setDocumentError(null);
      
      try {
        const response = await getPropertyDocuments(selectedPropertyId);
        
        if (response.success && Array.isArray(response.data)) {
          // Filter document categories to only include contracts
          const contractDocuments = response.data.filter((category: DocumentCategory) => 
            category.documentType.toLowerCase().includes('contract') ||
            category.documentType.toLowerCase().includes('lease') || 
            category.documentType.toLowerCase().includes('agreement') ||
            category.documentType.toLowerCase().includes('rental')
          );
          setDocumentCategories(contractDocuments);
        } else {
          setDocumentError('Failed to load documents');
        }
      } catch (err: any) {
        console.error('Error fetching documents:', err);
        setDocumentError(err.message || 'Failed to load documents');
      } finally {
        setIsLoadingDocuments(false);
      }
    };
    
    fetchDocuments();
  }, [selectedPropertyId]);

  // Updated handler for file uploads
  const handleFileScan = async (file: File) => {
    setIsFileScanning(true);
    setScanError(null);
    
    try {
      // We'll now call the real API instead of using mock data
      const response = await scanContractDocument(file);
      
      if (response.success && response.data) {
        setScanResults(response.data);
        
        // Refresh summaries after scanning
        try {
          // Get the current user's ID from Supabase session
          const { data: sessionData } = await supabase.auth.getSession();
          const userId = sessionData?.session?.user?.id;
          
          if (userId) {
            await fetchUserContractSummaries(userId, 1, false);
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
      setIsFileScanning(false);
    }
  };

  // Updated handler for document scanning
  const handleDocumentScan = async (documentPath: string) => {
    setIsDocumentScanning(true);
    setScanError(null);
    
    try {
      const response = await scanContractDocument(documentPath);
      
      if (response.success && response.data) {
        setScanResults(response.data);
        
        // Refresh summaries after scanning
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const userId = sessionData?.session?.user?.id;
          
          if (userId) {
            await fetchUserContractSummaries(userId, 1, false);
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
      setIsDocumentScanning(false);
    }
  };

  // Helper function to get file icon based on file type
  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      return <FileText className="h-6 w-6 text-blue-500" />;
    } else if (['pdf'].includes(extension || '')) {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else if (['doc', 'docx'].includes(extension || '')) {
      return <FileText className="h-6 w-6 text-blue-700" />;
    } else if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
      return <FileText className="h-6 w-6 text-green-600" />;
    } else if (['ppt', 'pptx'].includes(extension || '')) {
      return <FileText className="h-6 w-6 text-orange-500" />;
    } else {
      return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link
            href="/dashboard"
            className="mr-4 flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl text-gray-700 font-bold">Contract Scanner</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Contract History - Top Left */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-600">
            <History className="h-5 w-5 mr-2 text-blue-600" />
            Your Contract History
          </h2>
          
          <ContractHistoryViewer
            summaries={summaries}
            isLoading={summariesLoading}
            error={summariesError}
            onSelectSummary={setScanResults}
            hasMoreSummaries={hasMoreSummaries}
            onLoadMore={loadMoreSummaries}
          />
        </div>
        
        {/* Upload New Contract - Top Right */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-600">
            <Upload className="h-5 w-5 mr-2 text-blue-600" />
            Upload New Contract
          </h2>
          <ContractUploader onScanContract={handleFileScan} isScanning={isFileScanning} />
          
          {scanError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mt-4">
              <p>{scanError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Show contract analysis results if available */}
      {scanResults && (
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <Search className="h-5 w-5 mr-2 text-blue-600" />
              Contract Analysis Results
            </h2>
            <button 
              onClick={() => setScanResults(null)} 
              className="p-1.5 rounded-full hover:bg-gray-100"
              aria-label="Close analysis"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
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
            isScanning={isFileScanning || isDocumentScanning} 
          />
        </div>
      )}
      
      {/* Select From Property Documents - Bottom */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-600">
          <FileText className="h-5 w-5 mr-2 text-blue-600" />
          Select From Property Contracts
        </h2>
        
        {/* Property selector - updated to use dropdown */}
        <div className="mb-4 w-full max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Select Property
          </label>
          {propertiesLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Loading properties...</span>
            </div>
          ) : propertiesError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              <p className="text-sm">{propertiesError}</p>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 text-gray-600 focus:ring-blue-500 focus:border-blue-500">
                <span className="truncate">
                  {properties.find(p => p.id === selectedPropertyId)?.name || 'Select a property'}
                </span>
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
                      onClick={() => {
                        setSelectedPropertyId(property.id);
                        setSelectedDocumentPath('');
                      }}
                      className="flex justify-between hover:bg-blue-50 cursor-pointer"
                    >
                      {property.name}
                      {selectedPropertyId === property.id && <Check className="h-4 w-4 text-blue-600" />}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* Document display with similar styling to PropertyDocumentViewer */}
        {selectedPropertyId && (
          <>
            {isLoadingDocuments ? (
              <div className="mt-6 flex justify-center items-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : documentError ? (
              <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                <p>Error loading documents: {documentError}</p>
              </div>
            ) : documentCategories.length === 0 ? (
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Contracts</h3>
                <p className="mt-1 text-sm text-gray-500">No contract documents available for this property.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-6">
                {documentCategories.map((docType, index) => (
                  <div key={index} className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                      <Folder className="h-5 w-5 mr-2 text-blue-600" />
                      {docType.documentType.charAt(0).toUpperCase() + docType.documentType.slice(1).replace(/-/g, ' ')}
                    </h3>
                    
                    {!docType.documents || docType.documents.length === 0 ? (
                      <p className="text-gray-500 italic">No documents in this category</p>
                    ) : (
                      <div className="overflow-hidden bg-white border border-gray-200 rounded-md">
                        <ul className="divide-y divide-gray-200">
                          {docType.documents.map((document: PropertyDocument, docIndex: number) => (
                            <li 
                              key={docIndex}
                              className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedDocumentPath === document.path ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                              onClick={() => setSelectedDocumentPath(document.path)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center min-w-0 gap-x-4">
                                  {getFileIcon(document.filename)}
                                  <div className="min-w-0 flex-auto">
                                    <p className="text-sm font-semibold leading-6 text-gray-900 truncate">
                                      {document.filename}
                                    </p>
                                    <p className="mt-1 flex items-center text-xs leading-5 text-gray-500">
                                      {document.metadata && (
                                        <span>{formatFileSize(document.metadata.size)}</span>
                                      )}
                                      {document.created_at && (
                                        <span className="ml-2 border-l border-gray-200 pl-2">
                                          Uploaded on {new Date(document.created_at).toLocaleDateString()}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => selectedDocumentPath && handleDocumentScan(selectedDocumentPath)}
                    disabled={!selectedDocumentPath || isDocumentScanning}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {isDocumentScanning ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Scan Selected Document
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 