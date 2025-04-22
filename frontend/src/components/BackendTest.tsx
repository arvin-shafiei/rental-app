"use client";

import { useState } from 'react';
import { testBackendConnection } from '@/lib/api';

export default function BackendTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{success?: boolean; message?: string; data?: any} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const data = await testBackendConnection();
      setResult({
        success: true,
        message: 'Successfully connected to backend!',
        data
      });
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend');
      setResult({
        success: false,
        message: 'Connection failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="p-5">
        <h3 className="text-lg font-medium text-gray-900">Backend Connection Test</h3>
        <p className="mt-1 text-sm text-gray-500">
          Test the connection to your backend API with Supabase authentication
        </p>
        
        <div className="mt-4">
          <button
            onClick={handleTestConnection}
            disabled={isLoading}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
        
        {result && (
          <div className={`mt-4 rounded-md p-4 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {result.success ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </h3>
                {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
                {result.success && result.data && (
                  <div className="mt-2 text-sm text-green-700">
                    <pre className="bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 