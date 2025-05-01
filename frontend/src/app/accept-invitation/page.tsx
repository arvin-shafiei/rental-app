'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/components/ui/FormElements';
import { acceptInvitation } from '@/lib/api';

export default function AcceptInvitationPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = searchParams.get('token');
  
  useEffect(() => {
    if (!token) {
      setError('Invalid invitation token');
      setIsLoading(false);
      return;
    }
    
    const processInvitation = async () => {
      try {
        // Use the API helper function
        const data = await acceptInvitation(token);
        
        toast({
          title: 'Invitation Accepted',
          description: 'You have successfully joined the property!',
        });
        
        // Redirect to the property page
        router.push(`/dashboard/properties/${data.data.propertyId}`);
      } catch (err) {
        console.error('Error accepting invitation:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsLoading(false);
      }
    };
    
    processInvitation();
  }, [token, router]);
  
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