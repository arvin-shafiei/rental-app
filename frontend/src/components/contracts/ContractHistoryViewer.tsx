'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Calendar, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ContractSummary {
  id: string;
  summary: any;
  created_at: string;
  user_id?: string;
}

interface ContractHistoryViewerProps {
  summaries: ContractSummary[];
  isLoading: boolean;
  error: string | null;
  onSelectSummary: (summary: any) => void;
  hasMoreSummaries: boolean;
  onLoadMore?: () => void;
}

export default function ContractHistoryViewer({
  summaries,
  isLoading,
  error,
  onSelectSummary,
  hasMoreSummaries,
  onLoadMore
}: ContractHistoryViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Handle scroll event to implement infinite scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (
        !isLoading && 
        !isLoadingMore && 
        hasMoreSummaries && 
        onLoadMore &&
        container.scrollHeight - container.scrollTop <= container.clientHeight + 100 // Load more when near bottom
      ) {
        setIsLoadingMore(true);
        onLoadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMoreSummaries, isLoading, isLoadingMore, onLoadMore]);

  // Reset loading more state when summaries change
  useEffect(() => {
    setIsLoadingMore(false);
  }, [summaries]);

  if (isLoading && summaries.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" />
        <p className="text-gray-500">Loading your contract summaries...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <FileText className="h-12 w-12 text-gray-300 mb-3" />
        <p className="text-center text-gray-500">
          You haven't scanned any contracts yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-gray-600">
      <div 
        ref={containerRef}
        className="space-y-3 h-30 overflow-y-auto pr-2 custom-scrollbar border border-gray-100 rounded-md p-2"
        style={{ scrollBehavior: 'smooth' }}
      >
        {summaries.map((summary) => (
          <div 
            key={summary.id} 
            className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer"
            onClick={() => onSelectSummary(summary.summary)}
          >
            <h3 className="text-sm font-medium truncate">
              {summary.summary.title || summary.summary.name || 'Contract Analysis'}
            </h3>
            <p className="text-xs text-gray-500 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(summary.created_at).toLocaleDateString()} 
              <Clock className="h-3 w-3 mx-1" />
              {new Date(summary.created_at).toLocaleTimeString()}
            </p>
            {summary.summary.keyPoints && summary.summary.keyPoints.length > 0 && (
              <p className="text-xs text-gray-600 truncate mt-1">
                {summary.summary.keyPoints[0]}
              </p>
            )}
          </div>
        ))}
        
        {isLoadingMore && (
          <div className="py-2 text-center">
            <Loader2 className="h-4 w-4 animate-spin mx-auto text-blue-600" />
            <p className="text-xs text-gray-500 mt-1">Loading more...</p>
          </div>
        )}
      </div>
      
      {hasMoreSummaries && summaries.length > 0 && !isLoadingMore && (
        <div className="text-center pt-2">
          <button
            onClick={onLoadMore}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Load More
          </button>
        </div>
      )}
      
      {summaries.length > 5 && (
        <div className="text-center pt-2 border-t border-gray-100">
          <Link 
            href="/dashboard/contract-history"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All Contract Analyses
          </Link>
        </div>
      )}
    </div>
  );
} 