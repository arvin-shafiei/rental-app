'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, FileText, Search, History, Calendar, Clock, Folder, Loader2, AlertTriangle, X, Check, ChevronsUpDown, ExternalLink } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Toast } from "@/components/ui/FormElements";

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
  const [view, setView] = useState<'upload' | 'result' | 'history'>('upload');
  const [result, setResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMoreSummaries, setHasMoreSummaries] = useState(true);
  const [showLimitError, setShowLimitError] = useState<boolean>(false);
  const pageSize = 5;

  const router = useRouter();

  // Helper function to fetch summaries using the API helper
  const fetchSummaries = async (resetOffset = false) => {
    if (loadingSummaries) return;
    
    const newOffset = resetOffset ? 0 : offset;
    
    try {
      setLoadingSummaries(true);
      
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      
      const response = await fetch(`/api/contracts/summaries?offset=${newOffset}&limit=${pageSize}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch summaries');
      }
      
      const data2 = await response.json();
      
      if (resetOffset) {
        setSummaries(data2.data || []);
      } else {
        setSummaries([...summaries, ...(data2.data || [])]);
      }
      
      setHasMoreSummaries((data2.data || []).length === pageSize);
      
      if (!resetOffset) {
        setOffset(newOffset + pageSize);
      } else {
        setOffset(pageSize);
      }
    } catch (error) {
      console.error('Error fetching summaries:', error);
    } finally {
      setLoadingSummaries(false);
    }
  };
  
  // Load summaries when the view changes to history
  useEffect(() => {
    if (view === 'history') {
      fetchSummaries(true);
    }
  }, [view]);
  
  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Helper to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Check if user has reached summaries limit
  const checkSummariesLimit = async (): Promise<boolean> => {
    try {
      const { data } = await supabase.auth.getSession();
      const authToken = data.session?.access_token || null;
      
      if (!authToken) return true;
      
      const response = await fetch('/api/stripe/check-limits?feature=summaries', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const result = await response.json();
      
      return result.allowed;
    } catch (error) {
      console.error('Error checking summaries limits:', error);
      return true; // Allow scan if check fails to prevent blocking users
    }
  };
  
  // Handle successful contract scan
  const handleScanSuccess = (data: any) => {
    setResult(data);
    setView('result');
    setError(null);
  };
  
  // Handle scan error
  const handleScanError = (errorMessage: string) => {
    setError(errorMessage);
  };
  
  // Handle scan start
  const handleScanStart = () => {
    setScanning(true);
    setError(null);
  };
  
  // Handle limit exceeded
  const handleLimitExceeded = () => {
    setShowLimitError(true);
  };
  
  // View a summary from history
  const viewSummary = (summary: any) => {
    setResult(summary);
    setView('result');
  };

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Contract Scanner</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('upload')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              view === 'upload' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-1" />
            Upload
          </button>
          <button
            onClick={() => setView('history')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              view === 'history' 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <History className="w-4 h-4 inline mr-1" />
            History
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-start">
          <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error scanning contract</p>
            <p className="text-sm">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-5 h-5 text-red-500 hover:text-red-700" />
          </button>
        </div>
      )}
      
      {view === 'upload' && !result && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Upload Contract Document
          </h2>
          <p className="text-gray-600 mb-6">
            Upload a lease agreement, rental contract, or any other legal document to get an AI-powered summary and analysis.
          </p>
          
          <ContractUploader
            onSuccess={handleScanSuccess}
            onError={handleScanError}
            onScanStart={handleScanStart}
            onLimitExceeded={handleLimitExceeded}
            checkSummariesLimit={checkSummariesLimit}
          />
        </div>
      )}
      
      {view === 'result' && result && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Search className="w-5 h-5 mr-2 text-blue-600" />
              Contract Analysis
            </h2>
            <button
              onClick={() => {
                setResult(null);
                setView('upload');
              }}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <Upload className="w-4 h-4 mr-1" />
              Scan Another
            </button>
          </div>
          
          <DynamicContractScanResults 
            results={result} 
            isScanning={scanning} 
          />
        </div>
      )}
      
      {view === 'history' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <History className="w-5 h-5 mr-2 text-blue-600" />
              Recent Contract Analyses
            </h2>
          </div>
          
          {loadingSummaries && summaries.length === 0 ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 text-blue-500 mb-4 mx-auto animate-spin" />
              <p className="text-gray-600">Loading your contract history...</p>
            </div>
          ) : summaries.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No contracts analyzed yet</h3>
              <p className="text-gray-600 mb-4">
                Upload your first contract document to get a detailed analysis.
              </p>
              <button
                onClick={() => setView('upload')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 inline mr-1" />
                Upload Contract
              </button>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-gray-200">
                {summaries.map((summary) => (
                  <li key={summary.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {summary.contract_title || 'Untitled Contract'}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="w-3.5 h-3.5 mr-1" />
                          <span className="mr-3">
                            {formatDate(summary.created_at)}
                          </span>
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          <span>
                            {formatDate(summary.created_at) === formatDate(new Date().toISOString())
                              ? 'Today'
                              : new Date(summary.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => viewSummary(summary)}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm hover:bg-blue-100"
                      >
                        View Analysis
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              
              {hasMoreSummaries && (
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => fetchSummaries()}
                    disabled={loadingSummaries}
                    className="w-full py-2 text-center text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    {loadingSummaries ? (
                      <>
                        <Loader2 className="w-4 h-4 inline mr-1 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      {/* Limit exceeded toast with link to billing */}
      <Toast 
        title="Summary Limit Reached"
        description={
          <div>
            You've reached your contract summary limit. 
            <Link 
              href="/dashboard/settings/billing" 
              className="ml-1 text-blue-600 hover:text-blue-800 underline"
            >
              Upgrade your plan
            </Link> to analyze more contracts.
          </div>
        }
        variant="destructive"
        visible={showLimitError}
        onClose={() => setShowLimitError(false)}
      />
    </div>
  );
} 