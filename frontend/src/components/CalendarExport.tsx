'use client';

import { useState, useEffect } from 'react';
import { PlusCircleIcon, CalendarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase/client';

type CalendarExportProps = {
  eventData?: {
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
  };
};

export default function CalendarExport({ eventData }: CalendarExportProps) {
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Get the auth token when component mounts
  useEffect(() => {
    const getAuthToken = async () => {
      const { data } = await supabase.auth.getSession();
      const authToken = data.session?.access_token || null;
      console.log("Auth token available:", !!authToken);
      setToken(authToken);
    };
    
    getAuthToken();
  }, []);
  
  // Check if the user already has a calendar
  useEffect(() => {
    const checkCalendar = async () => {
      try {
        if (!token) {
          console.log("No auth token available yet");
          return;
        }
        
        console.log("Checking if user has a calendar with token");
        
        const response = await fetch('/api/calendar/ics', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        console.log("Calendar check response:", data);
        
        if (response.ok && data.success && data.data?.calendarUrl) {
          console.log("Found calendar URL:", data.data.calendarUrl);
          setCalendarUrl(data.data.calendarUrl);
        }
      } catch (err) {
        // Calendar not found is not an error, it just means the user doesn't have one yet
        console.log('No calendar found or error checking:', err);
      }
    };
    
    // Only check for calendar if we have event data and token
    if (eventData && token) {
      checkCalendar();
    }
  }, [eventData, token]);
  
  // Validate event data
  const validateEventData = () => {
    if (!eventData) {
      setError("No event data provided");
      return false;
    }
    
    if (!eventData.title) {
      setError("Event title is required");
      return false;
    }
    
    if (!eventData.startDateTime) {
      setError("Event start date/time is required");
      return false;
    }
    
    if (!eventData.endDateTime) {
      setError("Event end date/time is required");
      return false;
    }
    
    // Validate dates are in correct format
    try {
      const startDate = new Date(eventData.startDateTime);
      const endDate = new Date(eventData.endDateTime);
      
      if (isNaN(startDate.getTime())) {
        setError("Invalid start date/time format");
        return false;
      }
      
      if (isNaN(endDate.getTime())) {
        setError("Invalid end date/time format");
        return false;
      }
      
      if (startDate > endDate) {
        setError("End date/time must be after start date/time");
        return false;
      }
    } catch (err) {
      setError("Invalid date format");
      return false;
    }
    
    return true;
  };
  
  const addToCalendar = async () => {
    if (!token) {
      // Try to refresh the token if it's not available
      const { data } = await supabase.auth.getSession();
      const authToken = data.session?.access_token;
      
      if (!authToken) {
        setError("You need to be logged in. Please refresh the page and try again.");
        return;
      }
      
      setToken(authToken);
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Make sure eventData exists
      if (!eventData) {
        throw new Error("No event data provided");
      }
      
      if (!validateEventData()) {
        setLoading(false);
        return;
      }
      
      console.log("Adding event to calendar:", eventData);
      
      const response = await fetch('/api/calendar/ics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });
      
      const data = await response.json();
      console.log("Calendar add response:", data);
      
      if (response.ok && data.success) {
        setCalendarUrl(data.data?.calendarUrl);
        setSuccess(true);
        
        // Reset success state after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError(data.message || 'Failed to add event to calendar');
      }
    } catch (err: any) {
      console.error("Error adding to calendar:", err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // If no event data is provided, don't render the component
  if (!eventData) {
    return null;
  }
  
  // Define button text constants for immediate display
  const addEventText = 'Add Event';
  const addToCalendarText = 'Add to Calendar';
  const addedText = 'Added!';
  
  return (
    <div className="flex flex-col space-y-2">
      {calendarUrl ? (
        <div className="flex flex-col space-y-2">
          <a 
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Subscribe to Calendar
          </a>
          
          <button
            onClick={addToCalendar}
            className={`inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md ${
              loading 
                ? 'bg-gray-300 text-gray-700 cursor-not-allowed' 
                : success
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {addEventText}
              </>
            ) : success ? (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-1 text-white" />
                {addedText}
              </>
            ) : (
              <>
                <PlusCircleIcon className="h-4 w-4 mr-1" />
                {addEventText}
              </>
            )}
          </button>
          
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </div>
      ) : (
        <button
          onClick={addToCalendar}
          className={`inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md ${
            loading 
              ? 'bg-gray-300 text-gray-700 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {addToCalendarText}
            </>
          ) : (
            <>
              <PlusCircleIcon className="h-4 w-4 mr-1" />
              {addToCalendarText}
            </>
          )}
        </button>
      )}
      
      {error && !calendarUrl && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
} 