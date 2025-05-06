import React, { useEffect, useRef } from 'react';

interface InfiniteScrollProps {
  children: React.ReactNode;
  hasMore: boolean;
  loadMore: () => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  endMessage?: React.ReactNode;
}

export function InfiniteScroll({
  children,
  hasMore,
  loadMore,
  loading = false,
  loadingComponent = <div className="text-center py-4">Loading more...</div>,
  endMessage = <div className="text-center py-4">No more items to load</div>
}: InfiniteScrollProps) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disconnect previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // If there are no more items, don't create an observer
    if (!hasMore) return;

    // Create a new IntersectionObserver
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        // If the bottom element is visible and we're not already loading
        if (entry.isIntersecting && !loading && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    // Observe the loadMore element
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadMore]);

  return (
    <div>
      {children}
      <div ref={loadMoreRef}>
        {loading && loadingComponent}
        {!hasMore && !loading && endMessage}
      </div>
    </div>
  );
} 