'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface SyncTimelineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: {
    autoGenerateRentDueDates: boolean;
    autoGenerateLeaseEvents: boolean;
    upfrontRentPaid: number;
    rentDueDay: number;
  }) => Promise<void>;
  propertyName: string;
}

export default function SyncTimelineDialog({
  isOpen,
  onClose,
  onConfirm,
  propertyName,
}: SyncTimelineDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Sync options
  const [generateRentDueDates, setGenerateRentDueDates] = useState(true);
  const [generateLeaseEvents, setGenerateLeaseEvents] = useState(true);
  const [hasUpfrontRent, setHasUpfrontRent] = useState(false);
  const [upfrontRentAmount, setUpfrontRentAmount] = useState<number>(0);
  const [rentDueDay, setRentDueDay] = useState<number>(1);

  // Only mount the portal on the client
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Hide dialog when not open
  if (!isOpen || !mounted) return null;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await onConfirm({
        autoGenerateRentDueDates: generateRentDueDates,
        autoGenerateLeaseEvents: generateLeaseEvents,
        upfrontRentPaid: hasUpfrontRent ? upfrontRentAmount : 0,
        rentDueDay: rentDueDay
      });
      
      // Reset form state after successful submission
      setHasUpfrontRent(false);
      setUpfrontRentAmount(0);
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sync timeline');
      console.error('Error syncing timeline:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render the dialog as a portal to ensure it's at the top level of the DOM
  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Semi-transparent backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      ></div>
      
      {/* Dialog content */}
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full relative z-10 mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Generate Events for {propertyName}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">
          Generate timeline events based on your property information
        </p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="rent-due-dates"
              checked={generateRentDueDates}
              onChange={(e) => setGenerateRentDueDates(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="rent-due-dates" className="text-sm text-gray-700">
              Generate rent due dates
            </label>
          </div>

          {generateRentDueDates && (
            <div className="space-y-2 pl-6">
              <label htmlFor="rent-due-day" className="block text-sm font-medium text-gray-700">
                Day of month rent is due
              </label>
              <input
                id="rent-due-day"
                type="number"
                min="1"
                max="31"
                value={rentDueDay}
                onChange={(e) => setRentDueDay(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Default is the 1st day of each month</p>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="lease-events"
              checked={generateLeaseEvents}
              onChange={(e) => setGenerateLeaseEvents(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="lease-events" className="text-sm text-gray-700">
              Generate lease start/end events
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="upfront-rent"
              checked={hasUpfrontRent}
              onChange={(e) => setHasUpfrontRent(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="upfront-rent" className="text-sm text-gray-700">
              I've already paid some rent upfront
            </label>
          </div>

          {hasUpfrontRent && (
            <div className="space-y-2 pl-6">
              <label htmlFor="upfront-amount" className="block text-sm font-medium text-gray-700">
                Number of months paid upfront
              </label>
              <input
                id="upfront-amount"
                type="number"
                min="0"
                step="1"
                value={upfrontRentAmount.toString()}
                onChange={(e) => setUpfrontRentAmount(Number(e.target.value))}
                placeholder="e.g., 1 for one month"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            disabled={isLoading}
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Generate Events'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Use createPortal to render the modal at the root level
  return createPortal(modalContent, document.body);
} 