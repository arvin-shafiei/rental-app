"use client";

import { useState, useEffect } from 'react';

export default function BackendTest() {
  const [message, setMessage] = useState<string>('Testing connection to backend...');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    async function testBackend() {
      try {
        // Try to connect to the backend health endpoint
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
        const response = await fetch(`${backendUrl}/health`);
        
        if (response.ok) {
          const data = await response.json();
          setMessage(`✅ Successfully connected to backend: ${data.message}`);
          setStatus('success');
        } else {
          setMessage(`❌ Backend responded with status: ${response.status}`);
          setStatus('error');
        }
      } catch (error) {
        setMessage(`❌ Failed to connect to backend: ${error instanceof Error ? error.message : String(error)}`);
        setStatus('error');
      }
    }

    testBackend();
  }, []);

  return (
    <div className="p-4 my-4 rounded-lg border">
      <h2 className="text-xl font-semibold mb-2">Backend Connection Test</h2>
      <p className={`${
        status === 'loading' ? 'text-gray-500' :
        status === 'success' ? 'text-green-600' : 'text-red-600'
      }`}>
        {message}
      </p>
      {status === 'error' && (
        <div className="mt-2 text-sm text-gray-500">
          <p>Check that:</p>
          <ul className="list-disc ml-5">
            <li>The backend server is running</li>
            <li>NEXT_PUBLIC_BACKEND_URL is correctly set in your .env.local file</li>
            <li>The backend is accessible from this frontend application</li>
          </ul>
        </div>
      )}
    </div>
  );
} 