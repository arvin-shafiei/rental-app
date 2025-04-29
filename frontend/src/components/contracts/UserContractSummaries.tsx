'use client';

import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import Link from 'next/link';

// Augment window type to include possible supabase object
declare global {
  interface Window {
    supabase?: any;
  }
}

interface ContractSummary {
  id: string;
  summary: any;
  created_at: string;
  user_id: string;
}

export default function UserContractSummaries() {
  const [summaries, setSummaries] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserSummaries() {
      try {
        setLoading(true);
        
        // Try to get user ID from session or localStorage if available
        let userId = '';
        try {
          // First attempt: check localStorage
          const userJson = localStorage.getItem('user');
          if (userJson) {
            const userData = JSON.parse(userJson);
            userId = userData.id || '';
          }
          
          // Second attempt: check Supabase auth if available
          if (!userId && window.supabase) {
            const { data } = await window.supabase.auth.getUser();
            userId = data?.user?.id || '';
          }
        } catch (e) {
          console.warn('Could not determine user ID:', e);
        }
        
        // Add userId as a query param if available
        const url = userId 
          ? `/api/contracts/summaries?userId=${encodeURIComponent(userId)}` 
          : '/api/contracts/summaries';
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to load contract summaries');
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setSummaries(data.data);
        } else {
          setError('Invalid data format received from server');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load summaries');
        console.error('Error fetching summaries:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserSummaries();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Loading your contract summaries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p>Error: {error}</p>
        <button className="mt-2 px-4 py-2 bg-white border border-gray-300 rounded-md" onClick={() => setError(null)}>
          Try Again
        </button>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center min-h-[200px]">
        <FileText className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-center text-gray-500">
          You haven't scanned any contracts yet.
        </p>
        <Link href="/dashboard/contract-scanner" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Scan a Contract
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Recent Contract Analyses</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summaries.map((summary) => (
          <div key={summary.id} className="bg-white rounded-lg shadow-md p-4 h-full">
            <div className="mb-2">
              <h3 className="text-lg font-medium truncate">
                {summary.summary.title || summary.summary.name || 'Contract Analysis'}
              </h3>
              <p className="text-sm text-gray-500">
                {new Date(summary.created_at).toLocaleString()}
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
              
              <Link 
                href={`/dashboard/contract-details/${summary.id}`}
                className="block w-full mt-4 px-4 py-2 text-center text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                View Full Analysis
              </Link>
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
    </div>
  );
} 