'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, X, Calendar } from 'lucide-react';
import { createPortal } from 'react-dom';
import { format, parseISO } from 'date-fns';

interface SyncTimelineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: {
    autoGenerateRentDueDates: boolean;
    autoGenerateLeaseEvents: boolean;
    upfrontRentPaid: number;
    rentDueDay: number;
    startDate: string;
    inspectionFrequency?: string;
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
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [inspectionFrequency, setInspectionFrequency] = useState<string>('annual');
  
  // Derive rent due day from the selected start date
  const rentDueDay = startDate ? new Date(startDate).getDate() : 1;

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
        rentDueDay,
        startDate,
        inspectionFrequency
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
          <h2 className="text-lg font-medium text-black">Set Up Timeline for {propertyName}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-sm text-black mb-6">
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

        <div className="space-y-5">
          {/* Start Date Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-black">
                Start Date
              </label>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-blue-600 mr-1" />
                <span className="text-xs text-gray-500">When should events begin?</span>
              </div>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-black shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {startDate && (
              <p className="text-xs text-gray-500 mt-1">
                Rent will be due on day {rentDueDay} of each month
              </p>
            )}
          </div>
          
          {/* Rent Due Dates */}
          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="generate-rent"
                checked={generateRentDueDates}
                onChange={(e) => setGenerateRentDueDates(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="generate-rent" className="ml-2 block text-sm text-black font-medium">
                Generate Monthly Rent Due Dates
              </label>
            </div>
            
            {generateRentDueDates && (
              <div className="ml-6 space-y-3 mt-3 bg-gray-50 p-3 rounded-md border border-gray-200">                
                <div>
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="has-upfront-rent"
                      checked={hasUpfrontRent}
                      onChange={(e) => setHasUpfrontRent(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="has-upfront-rent" className="ml-2 block text-sm text-black">
                      I've paid rent upfront
                    </label>
                  </div>
                  
                  {hasUpfrontRent && (
                    <div className="ml-6 mt-2">
                      <label htmlFor="upfront-months" className="block text-sm text-black mb-1">
                        Number of Months Paid Upfront
                      </label>
                      <input
                        type="number"
                        id="upfront-months"
                        min="0"
                        max="36"
                        value={upfrontRentAmount}
                        onChange={(e) => setUpfrontRentAmount(parseInt(e.target.value, 10) || 0)}
                        className="w-full rounded-md border border-gray-300 py-1.5 px-3 text-black shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Lease Start/End Events */}
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="generate-lease"
                checked={generateLeaseEvents}
                onChange={(e) => setGenerateLeaseEvents(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="generate-lease" className="ml-2 block text-sm text-black font-medium">
                Generate Lease Start/End Events
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Creates timeline events for your lease start and end dates
            </p>
          </div>
          
          {/* Inspection Frequency */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-black mb-3">Property Inspections</h3>
            
            <div className="space-y-2 mb-3">
              <label className="text-sm text-black mb-1 block">How often do you have inspections?</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setInspectionFrequency('quarterly')}
                  className={`px-3 py-1.5 text-sm rounded-full border ${
                    inspectionFrequency === 'quarterly' 
                      ? 'bg-blue-50 border-blue-300 text-blue-700' 
                      : 'border-gray-300 text-black'
                  }`}
                >
                  Quarterly
                </button>
                <button
                  type="button"
                  onClick={() => setInspectionFrequency('biannual')}
                  className={`px-3 py-1.5 text-sm rounded-full border ${
                    inspectionFrequency === 'biannual' 
                      ? 'bg-blue-50 border-blue-300 text-blue-700' 
                      : 'border-gray-300 text-black'
                  }`}
                >
                  Every 6 Months
                </button>
                <button
                  type="button"
                  onClick={() => setInspectionFrequency('annual')}
                  className={`px-3 py-1.5 text-sm rounded-full border ${
                    inspectionFrequency === 'annual' 
                      ? 'bg-blue-50 border-blue-300 text-blue-700' 
                      : 'border-gray-300 text-black'
                  }`}
                >
                  Annual
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-black shadow-sm hover:bg-gray-50"
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