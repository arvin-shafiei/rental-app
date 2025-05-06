'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/FormElements';
import { acceptInvitation } from '@/lib/api';
import { supabase } from '@/lib/supabase/client';

// Create a separate client component that uses useSearchParams
import { useSearchParams } from 'next/navigation';

function InvitationAccepter() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = searchParams.get('token');
  
  // Check authentication status first
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          
          // Redirect to login with return URL
          if (token) {
            const returnUrl = encodeURIComponent(`/accept-invitation?token=${token}`);
            router.push(`/auth?returnUrl=${returnUrl}`);
          } else {
            setError('Invalid invitation token');
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        setIsAuthenticated(false);
        setError('Authentication error');
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [token, router]);
  
  // Process invitation once authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) return;
    
    const processInvitation = async () => {
      try {
        // Use the API helper function
        const response = await acceptInvitation(token);
        
        console.log('Invitation acceptance response:', response);
        
        toast({
          title: 'Invitation Accepted',
          description: 'You have successfully joined the property!',
        });
        
        // Safely extract propertyId and redirect
        let propertyId;
        
        // Handle multiple possible response formats
        if (response && response.data && response.data.propertyId) {
          propertyId = response.data.propertyId;
        } else if (response && response.propertyId) {
          propertyId = response.propertyId;
        }
        
        if (propertyId) {
          // Redirect to the property page
          router.push(`/dashboard/properties/${propertyId}`);
        } else {
          // If no property ID was found, redirect to dashboard
          console.error('No propertyId found in response:', response);
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Error accepting invitation:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsLoading(false);
      }
    };
    
    processInvitation();
  }, [isAuthenticated, token, router]);
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            onClick={() => router.push('/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Accepting Invitation</h1>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600">Processing your invitation...</p>
          </div>
        ) : (
          <p className="text-green-600">Invitation accepted successfully!</p>
        )}
      </div>
    </div>
  );
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Loading</h1>
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Loading invitation details...</p>
        </div>
      </div>
    </div>
  );
}

// Main component that wraps the InvitationAccepter in a Suspense boundary
export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <InvitationAccepter />
    </Suspense>
  );
} 