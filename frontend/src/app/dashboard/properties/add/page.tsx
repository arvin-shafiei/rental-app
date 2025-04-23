'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Save, Loader2, Home, Search, Calendar, MapPin, PoundSterling, ArrowLeftCircle, ArrowRightCircle, CheckCircle } from 'lucide-react';
import { createProperty } from '@/lib/api';
import { useLoadScript } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { format, addYears, isValid, parseISO } from 'date-fns';

// Emoji list for student properties
const PROPERTY_EMOJIS = [
  { emoji: '🏠', label: 'House' },
  { emoji: '🏢', label: 'Apartment Building' },
  { emoji: '🏘️', label: 'Student Village' },
  { emoji: '🏫', label: 'University Building' },
  { emoji: '🏡', label: 'Cottage' },
  { emoji: '🏨', label: 'Dorm' },
  { emoji: '🏣', label: 'Small Building' },
  { emoji: '🏛️', label: 'Classic Building' },
];

// Property type options
const PROPERTY_TYPES = [
  { value: 'Student', label: 'Student Accommodation' },
  { value: 'House', label: 'House' },
  { value: 'Flat', label: 'Flat/Apartment' },
  { value: 'HMO', label: 'HMO' },
  { value: 'Other', label: 'Other' },
];

// Update label text colors - remove explicit text-black
const labelClass = "block font-bold mb-2";
const inputClass = "shadow appearance-none border rounded w-full py-3 px-4 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const inputWithIconClass = "pl-10 " + inputClass;
const helperTextClass = "text-sm mt-1";

// Define interface for address objects
interface AddressResult {
  place_id: string;
  description: string;
  formatted_address?: string;
  postcode?: string;
}

// Enhanced Address search component using usePlacesAutocomplete
const PlacesAutocomplete = ({ onAddressSelect }: { onAddressSelect: (address: any) => void }) => {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
    requestOptions: {
      componentRestrictions: { country: 'gb' },
      // Remove type restrictions to allow flexible searching
    },
    cache: 86400,
  });

  const [postcodeLookup, setPostcodeLookup] = useState<{
    active: boolean;
    postcode: string;
    addresses: AddressResult[];
    loading: boolean;
  }>({
    active: false,
    postcode: '',
    addresses: [],
    loading: false
  });

  // Function to check if a suggestion is likely a postcode
  const isPostcode = (description: string) => {
    return /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i.test(description);
  };

  // Function to search for houses/addresses at a specific postcode
  const findAddressesAtPostcode = async (postcode: string, placeId: string) => {
    setPostcodeLookup(prev => ({ ...prev, active: true, postcode, loading: true }));
    
    try {
      // First get the coordinates of the postcode
      const results = await getGeocode({ placeId });
      const { lat, lng } = getLatLng(results[0]);
      
      // Get the street name from the geocoded results
      let streetName = '';
      if (results && results[0] && results[0].address_components) {
        const routeComponent = results[0].address_components.find(
          component => component.types.includes('route')
        );
        if (routeComponent) {
          streetName = routeComponent.long_name;
        }
      }
      
      // Initialize places service to query for addresses
      const placesService = new google.maps.places.PlacesService(document.createElement('div'));
      
      // Create a list of addresses to display
      const allAddresses: AddressResult[] = [];
      
      // Add the postcode itself as an option
      allAddresses.push({
        place_id: placeId,
        description: `Use postcode: ${postcode}`,
        formatted_address: postcode
      });
      
      // If we have a street name, search for addresses on that street
      if (streetName) {
        // Use TextSearch to find addresses on this street with this postcode
        const textSearchPromise = new Promise<AddressResult[]>((resolve) => {
          placesService.textSearch(
            {
              query: `${streetName} ${postcode}`,
              location: new google.maps.LatLng(lat, lng),
              radius: 500,
              type: 'address'
            },
            (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                // Map the results to our address format
                const addresses = results.map(result => ({
                  place_id: result.place_id || `text-${Math.random().toString(36).substring(2, 9)}`,
                  description: result.name || result.formatted_address || `${streetName}, ${postcode}`,
                  formatted_address: result.formatted_address || `${streetName}, ${postcode}`
                }));
                resolve(addresses);
              } else {
                resolve([]);
              }
            }
          );
        });
        
        // Use NearbySearch as a backup to find addresses near this location
        const nearbySearchPromise = new Promise<AddressResult[]>((resolve) => {
          placesService.nearbySearch(
            {
              location: new google.maps.LatLng(lat, lng),
              radius: 300,
              type: 'premise' // 'premise' is more likely to find residential addresses
            },
            (results, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                // Filter to likely addresses and map to our format
                const addresses = results
                  .filter(result => 
                    // Filter to results that might be addresses
                    result.types?.some(type => 
                      ['premise', 'street_address', 'subpremise', 'point_of_interest'].includes(type)
                    ) || false
                  )
                  .map(result => ({
                    place_id: result.place_id || `nearby-${Math.random().toString(36).substring(2, 9)}`,
                    description: result.name || result.vicinity || `Building at ${postcode}`,
                    formatted_address: result.vicinity || `${postcode}`
                  }));
                resolve(addresses);
              } else {
                resolve([]);
              }
            }
          );
        });
        
        // Wait for both search methods and combine results
        const [textResults, nearbyResults] = await Promise.all([
          textSearchPromise, 
          nearbySearchPromise
        ]);
        
        // Combine and de-duplicate results
        const combinedAddresses = [...textResults];
        
        // Add nearby results that don't duplicate text results
        for (const addr of nearbyResults) {
          if (!combinedAddresses.some(existing => 
            existing.place_id === addr.place_id || 
            existing.description === addr.description
          )) {
            combinedAddresses.push(addr);
          }
        }
        
        // Add all unique addresses to our results
        allAddresses.push(...combinedAddresses);
      }
      
      // Update state with all found addresses
      setPostcodeLookup(prev => ({
        ...prev,
        loading: false,
        addresses: allAddresses.length > 1 ? allAddresses : [
          {
            place_id: placeId,
            description: `Use postcode: ${postcode}`,
            formatted_address: postcode
          },
          {
            place_id: `${placeId}_manual`,
            description: `Enter address manually at ${postcode}`,
            formatted_address: postcode
          }
        ]
      }));
    } catch (error) {
      console.error('Error fetching addresses at postcode:', error);
      // Fallback to just the postcode
      setPostcodeLookup(prev => ({ 
        ...prev, 
        loading: false,
        addresses: [{
          place_id: placeId,
          description: `Use postcode: ${postcode}`,
          formatted_address: postcode
        }]
      }));
    }
  };

  const handlePostcodeClick = (item: any) => {
    if (isPostcode(item.description)) {
      // For postcodes, provide some sample addresses at that postcode
      findAddressesAtPostcode(item.description, item.place_id);
    } else {
      // For regular addresses, just select them directly
      setValue(item.description, false);
      clearSuggestions();
      onAddressSelect(item);
      setPostcodeLookup({ active: false, postcode: '', addresses: [], loading: false });
    }
  };

  // Function to handle selecting an address from the postcode results
  const handleAddressFromPostcodeSelect = (address: AddressResult) => {
    setValue(address.description, false);
    clearSuggestions();
    onAddressSelect({
      ...address,
      postcode: postcodeLookup.postcode
    });
    setPostcodeLookup({ active: false, postcode: '', addresses: [], loading: false });
  };

  // Go back to the main search
  const handleBackToSearch = () => {
    setPostcodeLookup({ active: false, postcode: '', addresses: [], loading: false });
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5" />
      </div>
      
      {postcodeLookup.active ? (
        <>
          <div className="flex items-center mb-2">
            <button 
              onClick={handleBackToSearch}
              className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to search
            </button>
            <span className="ml-2">Addresses at {postcodeLookup.postcode}</span>
          </div>
          
          {postcodeLookup.loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-500" />
              <span className="text-sm">Loading addresses...</span>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-md border border-gray-200 max-h-60 overflow-y-auto">
              <ul>
                {postcodeLookup.addresses.map((address, index) => (
                  <li 
                    key={address.place_id || `address-${index}`}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleAddressFromPostcodeSelect(address)}
                  >
                    <div className="font-medium">{address.description}</div>
                    {address.formatted_address && address.formatted_address !== address.description && (
                      <div className="text-xs">{address.formatted_address}</div>
                    )}
                  </li>
                ))}
                {postcodeLookup.addresses.length === 0 && (
                  <li className="px-4 py-2">
                    No specific addresses found. Try entering address details manually.
                  </li>
                )}
              </ul>
            </div>
          )}
        </>
      ) : (
        <>
          <input
            id="postcode_search"
            type="text"
            placeholder="Enter address, postcode, area, or landmark..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={!ready}
            className={inputWithIconClass}
          />
          
          {status === "OK" && (
            <div className="mt-2 bg-white shadow-md rounded-md border border-gray-200 max-h-60 overflow-y-auto z-10 absolute w-full">
              <ul>
                {data.map((item) => {
                  const isPostcodeResult = isPostcode(item.description);
                  return (
                    <li 
                      key={item.place_id}
                      className={`px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${isPostcodeResult ? 'bg-blue-50' : ''}`}
                      onClick={() => handlePostcodeClick(item)}
                    >
                      <div className="font-medium">
                        {item.structured_formatting.main_text}
                        {isPostcodeResult && (
                          <span className="ml-2 text-blue-600">- View all addresses at this postcode</span>
                        )}
                      </div>
                      <div className="text-xs">{item.structured_formatting.secondary_text}</div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Simplify the LeaseDatePicker component by making date selection immediate without confirmation
const LeaseDatePicker = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange 
}: { 
  startDate: string; 
  endDate: string; 
  onStartDateChange: (date: string) => void; 
  onEndDateChange: (date: string) => void; 
}) => {
  const [selectionMode, setSelectionMode] = useState<'start' | 'end'>('start');
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  
  // Format a date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'Select date';
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'dd MMM yyyy') : 'Select date';
  };
  
  // Get month name and year for the calendar header
  const monthYearDisplay = format(viewMonth, 'MMMM yyyy');
  
  // Generate days for the current month view
  const daysInMonth = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();
    
    // Get day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDay.getDay();
    // Adjust for monday as first day of week
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: 0, date: null }); // Empty cell
    }
    
    // Add actual days of the month
    for (let i = 1; i <= daysCount; i++) {
      days.push({ 
        day: i, 
        date: new Date(year, month, i) 
      });
    }
    
    return days;
  }, [viewMonth]);
  
  // Handle date selection - auto-save without confirmation but don't auto-switch modes
  const handleDateSelect = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    
    if (selectionMode === 'start') {
      // Auto-save start date
      onStartDateChange(dateString);
      
      // Automatically calculate and save end date
      const oneYearLater = addYears(date, 1);
      onEndDateChange(format(oneYearLater, 'yyyy-MM-dd'));
      
      // Don't automatically switch to end date selection
      // Stay in start date mode until user explicitly switches
    } else {
      // Auto-save end date
      onEndDateChange(dateString);
    }
  };
  
  // Go to previous month
  const prevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };
  
  // Go to next month
  const nextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };
  
  // Check if a date is selected as start or end date
  const isConfirmedDate = (date: Date) => {
    if (!date) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    return dateStr === startDate || dateStr === endDate;
  };
  
  // Check if date is in the range between start and end
  const isInRange = (date: Date) => {
    if (!date || !startDate || !endDate) return false;
    const dateTime = date.getTime();
    const start = parseISO(startDate).getTime();
    const end = parseISO(endDate).getTime();
    return dateTime > start && dateTime < end;
  };
  
  // Get appropriate class for a calendar day
  const getDayClass = (date: Date | null) => {
    if (!date) return "invisible";
    
    let baseClass = "h-10 w-10 rounded-full flex items-center justify-center cursor-pointer";
    
    if (isConfirmedDate(date)) {
      if (format(date, 'yyyy-MM-dd') === startDate) {
        return `${baseClass} bg-blue-600 text-white font-bold border-2 border-blue-700`;
      } else {
        return `${baseClass} bg-blue-600 text-white font-bold`;
      }
    } else if (isInRange(date)) {
      return `${baseClass} bg-blue-100 text-blue-800`;
    } else {
      return `${baseClass} hover:bg-blue-50`;
    }
  };
  
  // Day names for the header
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Initialize view month based on existing date if available
  useEffect(() => {
    if (selectionMode === 'start' && startDate) {
      setViewMonth(parseISO(startDate));
    } else if (selectionMode === 'end' && endDate) {
      setViewMonth(parseISO(endDate));
    }
  }, [selectionMode, startDate, endDate]);
  
  return (
    <div className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
      {/* Mode Selector */}
      <div className="mb-4 rounded-lg bg-gray-50 p-2 flex justify-between">
        <div className="flex space-x-2">
          <button 
            type="button"
            onClick={() => setSelectionMode('start')}
            className={`py-2 px-3 rounded-md ${
              selectionMode === 'start' 
                ? 'bg-blue-100 text-blue-800 font-medium border border-blue-300' 
                : 'hover:bg-gray-100'
            }`}
          >
            Start Date
          </button>
          <button 
            type="button"
            onClick={() => setSelectionMode('end')}
            className={`py-2 px-3 rounded-md ${
              selectionMode === 'end' 
                ? 'bg-blue-100 text-blue-800 font-medium border border-blue-300' 
                : 'hover:bg-gray-100'
            }`}
          >
            End Date
          </button>
        </div>
        <div className="text-sm font-medium">
          {selectionMode === 'start' ? 'Click to set start date' : 'Click to set end date'}
        </div>
      </div>
      
      {/* Current Selection Display */}
      <div className="mb-4 flex justify-between items-center p-2 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-sm font-medium block">Start Date:</span>
            <span className="text-md block">{formatDateForDisplay(startDate)}</span>
          </div>
          <div className="text-gray-400">→</div>
          <div>
            <span className="text-sm font-medium block">End Date:</span>
            <span className="text-md block">{formatDateForDisplay(endDate)}</span>
          </div>
        </div>
      </div>
      
      <div className="calendar">
        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-4">
          <button 
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Previous month"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="font-bold">{monthYearDisplay}</div>
          <button 
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Next month"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
        
        {/* Day Names Header */}
        <div className="grid grid-cols-7 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((day, index) => (
            <div 
              key={index} 
              className={getDayClass(day.date)}
              onClick={() => day.date && handleDateSelect(day.date)}
            >
              {day.day > 0 ? day.day : ''}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-gray-700">
        <div className="font-medium mb-1">📝 UK Lease Information:</div>
        <p>• Standard UK lease is typically 12 months</p>
        <p>• Start date automatically sets end date to 1 year later</p>
        <p>• Click any date to select it - no confirmation needed</p>
      </div>
    </div>
  );
};

export default function AddPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [addressSearching, setAddressSearching] = useState(false);
  const libraries = useMemo(() => ['places'], []);
  
  // Current step in the wizard
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    emoji: '🏠',
    is_active: true, // Default is true for a new property
    address_line1: '',
    address_line2: '',
    city: '',
    county: '',
    postcode: '',
    country: 'United Kingdom',
    property_type: '',
    rent_amount: '',
    deposit_amount: '',
    lease_start_date: '',
    lease_end_date: ''
  });

  // Load Google Maps script
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: libraries as any,
  });

  // Fix for hydration issues with form elements
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle selecting an address from Places Autocomplete
  const handleAddressSelect = async (address: { place_id: string, description: string }) => {
    setAddressSearching(true);
    try {
      const results = await getGeocode({ placeId: address.place_id });
      const addressComponents = results[0]?.address_components || [];
      
      // Extract address components
      let streetNumber = '';
      let route = '';
      let subpremise = '';
      let locality = '';
      let city = '';
      let county = '';
      let postcode = '';
      let country = '';
      
      // Check if this is primarily a postcode search
      const isPostcodeSearch = address.description.match(/^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i);
      
      addressComponents.forEach(component => {
        const types = component.types;
        
        if (types.includes('street_number')) {
          streetNumber = component.long_name;
        } else if (types.includes('route')) {
          route = component.long_name;
        } else if (types.includes('subpremise')) {
          subpremise = component.long_name;
        } else if (types.includes('sublocality') || types.includes('neighborhood')) {
          locality = component.long_name;
        } else if (types.includes('postal_town') || types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_2')) {
          county = component.long_name;
        } else if (types.includes('postal_code')) {
          postcode = component.long_name;
        } else if (types.includes('country')) {
          country = component.long_name;
        }
      });
      
      // Get coordinates for potential reverse geocoding 
      const latLng = getLatLng(results[0]);
      
      // For postcode-only searches with no specific address, try to get a default address
      if ((isPostcodeSearch || !streetNumber) && !route && postcode) {
        if (!city) {
          // Extract city from description if not found in components
          const parts = address.description.split(',');
          if (parts.length > 1) {
            city = parts[parts.length - 2].trim();
          }
        }
      }
      
      // Format address lines
      const addressLine1 = `${streetNumber} ${route}`.trim();
      const addressLine2 = subpremise || locality;
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        address_line1: addressLine1 || '',
        address_line2: addressLine2 || '',
        city: city || '',
        county: county || '',
        postcode: postcode || '',
        country: country || 'United Kingdom'
      }));
      
      console.log('Address selected:', {
        addressLine1, 
        addressLine2, 
        city, 
        county, 
        postcode, 
        country,
        coordinates: latLng
      });
      
    } catch (error) {
      console.error("Error selecting address:", error);
      setError("Failed to get address details");
    } finally {
      setAddressSearching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({
        ...formData,
        [name]: checked
      });
    } else if (name === 'rent_amount' || name === 'deposit_amount') {
      // Allow only numbers and decimals
      const numericValue = value.replace(/[^0-9.]/g, '');
      setFormData({
        ...formData,
        [name]: numericValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setFormData(prev => ({
      ...prev,
      emoji
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert string amounts to numbers for the API
      const propertyData = {
        ...formData,
        rent_amount: formData.rent_amount ? parseFloat(formData.rent_amount) : undefined,
        deposit_amount: formData.deposit_amount ? parseFloat(formData.deposit_amount) : undefined,
        is_active: true // Always set active to true for new properties
      };

      // Use the API helper function to create property
      console.log('Creating property using API helper...');
      await createProperty(propertyData);
      console.log('Property created successfully');

      // Navigate back to properties page on success
      router.push('/dashboard/properties');
    } catch (err: any) {
      setError(err.message || 'Failed to create property');
      console.error('Error creating property:', err);
    } finally {
      setLoading(false);
    }
  };

  // Go to next step
  const goToNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  // Go to previous step
  const goToPrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Check if current step is valid to proceed
  const isStepValid = () => {
    switch (currentStep) {
      case 1: // Property Details
        return formData.name.trim() !== '' && formData.property_type !== '';
      case 2: // Address
        return formData.address_line1.trim() !== '' && formData.postcode.trim() !== '';
      case 3: // Financial Details
        return formData.rent_amount.trim() !== '';
      case 4: // Lease Period
        return true; // Always allow proceeding since lease dates are optional
      default:
        return false;
    }
  };

  // If not mounted yet, return an empty div to avoid hydration errors
  if (!isMounted) {
    return <div />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Home className="h-6 w-6 mr-2 text-blue-600" />
          <h2 className="text-xl font-bold text-black">Add Property</h2>
        </div>
        <Link 
          href="/dashboard/properties" 
          className="rounded-md bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100"
        >
          <ArrowLeft className="inline-block w-4 h-4 mr-2" />
          Back to Properties
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {['Property Details', 'Address', 'Financial', 'Lease Period'].map((step, index) => (
            <div 
              key={index}
              className={`flex flex-col items-center ${index + 1 <= currentStep ? 'text-blue-600' : 'text-gray-700 font-medium'}`}
            >
              <div className={`rounded-full h-10 w-10 flex items-center justify-center mb-2 
                ${index + 1 === currentStep ? 'bg-blue-100 border-2 border-blue-500 text-blue-700' : 
                  index + 1 < currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 border border-gray-400'}`}>
                {index + 1 < currentStep ? <CheckCircle className="h-6 w-6" /> : index + 1}
              </div>
              <span className="text-sm hidden md:block">{step}</span>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute h-1 bg-gray-300 top-0 left-0 right-0 -mt-1 border border-gray-400"></div>
          <div className={`absolute h-1 bg-blue-500 top-0 left-0 -mt-1 border border-blue-600`} style={{ width: `${(currentStep - 1) * 33.33}%` }}></div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg transition-all duration-500">
        <div className="px-6 py-6 md:px-8 md:py-8">
          <form onSubmit={handleSubmit} className="text-black">
            {/* Step 1: Property Details */}
            <div className={`${currentStep === 1 ? 'block' : 'hidden'}`}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center">
                  <span className="bg-blue-100 text-blue-800 p-1 rounded-full w-7 h-7 inline-flex items-center justify-center mr-2">1</span>
                  Property Details
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className={labelClass} htmlFor="name">
                      Property Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      placeholder="e.g. My Student Flat"
                      value={formData.name}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  
                  <div>
                    <label className={labelClass}>
                      Choose an Emoji
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {PROPERTY_EMOJIS.map((item) => (
                        <button
                          key={item.emoji}
                          type="button"
                          onClick={() => handleEmojiSelect(item.emoji)}
                          className={`flex flex-col items-center justify-center p-3 rounded-lg ${
                            formData.emoji === item.emoji 
                              ? 'bg-blue-100 border-2 border-blue-400' 
                              : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-2xl mb-1">{item.emoji}</span>
                          <span className="text-xs text-black">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className={labelClass} htmlFor="property_type">
                      Property Type *
                    </label>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
                      {PROPERTY_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({...formData, property_type: type.value})}
                          className={`py-2 px-3 rounded-lg border text-sm font-medium ${
                            formData.property_type === type.value
                              ? 'bg-blue-100 border-blue-400 text-blue-800'
                              : 'bg-white border-black text-black hover:bg-gray-50'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Address */}
            <div className={`${currentStep === 2 ? 'block' : 'hidden'}`}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center">
                  <span className="bg-blue-100 text-blue-800 p-1 rounded-full w-7 h-7 inline-flex items-center justify-center mr-2">2</span>
                  Address
                </h2>
                <div className="space-y-6">
                  <div className="mb-4">
                    <label className={labelClass} htmlFor="postcode_search">
                      Search by Address or Postcode
                    </label>
                    {isLoaded ? (
                      <PlacesAutocomplete onAddressSelect={handleAddressSelect} />
                    ) : (
                      <div className="flex items-center mt-2 text-blue-500">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span className="text-sm">Loading Google Maps...</span>
                      </div>
                    )}
                    
                    {addressSearching && (
                      <div className="flex items-center mt-2 text-blue-500">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span className="text-sm">Loading address details...</span>
                      </div>
                    )}
                    
                    <p className={helperTextClass}>
                      <MapPin className="inline-block w-4 h-4 mr-1" />
                      Search by postcode, street name, area, or select from suggestions to auto-fill address details
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass} htmlFor="address_line1">
                        Address Line 1 *
                      </label>
                      <input
                        id="address_line1"
                        name="address_line1"
                        type="text"
                        required
                        placeholder="Street address, street number"
                        value={formData.address_line1}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className={labelClass} htmlFor="address_line2">
                        Address Line 2
                      </label>
                      <input
                        id="address_line2"
                        name="address_line2"
                        type="text"
                        placeholder="Apartment, unit, floor, building"
                        value={formData.address_line2}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="city">
                        City *
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        required
                        placeholder="e.g. London"
                        value={formData.city}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                    
                    <div>
                      <label className={labelClass} htmlFor="county">
                        County
                      </label>
                      <input
                        id="county"
                        name="county"
                        type="text"
                        placeholder="e.g. Greater London"
                        value={formData.county}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                    
                    <div>
                      <label className={labelClass} htmlFor="postcode">
                        Postcode *
                      </label>
                      <input
                        id="postcode"
                        name="postcode"
                        type="text"
                        required
                        placeholder="e.g. SW1A 1AA"
                        value={formData.postcode}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                    
                    <div>
                      <label className={labelClass} htmlFor="country">
                        Country
                      </label>
                      <input
                        id="country"
                        name="country"
                        type="text"
                        placeholder="United Kingdom"
                        value={formData.country}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Financial Details */}
            <div className={`${currentStep === 3 ? 'block' : 'hidden'}`}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center">
                  <span className="bg-blue-100 text-blue-800 p-1 rounded-full w-7 h-7 inline-flex items-center justify-center mr-2">3</span>
                  Financial Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass} htmlFor="rent_amount">
                      Monthly Rent (£) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <PoundSterling className="h-5 w-5" />
                      </div>
                      <input
                        id="rent_amount"
                        name="rent_amount"
                        type="text"
                        required
                        placeholder="e.g. 1200"
                        value={formData.rent_amount}
                        onChange={handleChange}
                        className={inputWithIconClass}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className={labelClass} htmlFor="deposit_amount">
                      Deposit Amount (£)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <PoundSterling className="h-5 w-5" />
                      </div>
                      <input
                        id="deposit_amount"
                        name="deposit_amount"
                        type="text"
                        placeholder="e.g. 1380"
                        value={formData.deposit_amount}
                        onChange={handleChange}
                        className={inputWithIconClass}
                      />
                    </div>
                    <p className={helperTextClass}>
                      Typically 4-6 weeks of rent
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Lease Period */}
            <div className={`${currentStep === 4 ? 'block' : 'hidden'}`}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center">
                  <span className="bg-blue-100 text-blue-800 p-1 rounded-full w-7 h-7 inline-flex items-center justify-center mr-2">4</span>
                  Lease Period
                </h2>
                <div>
                  <label className={labelClass}>
                    <Calendar className="inline-block h-5 w-5 mr-2" />
                    Lease Dates
                  </label>
                  <LeaseDatePicker 
                    startDate={formData.lease_start_date}
                    endDate={formData.lease_end_date}
                    onStartDateChange={(date) => 
                      setFormData(prev => ({ ...prev, lease_start_date: date }))
                    }
                    onEndDateChange={(date) => 
                      setFormData(prev => ({ ...prev, lease_end_date: date }))
                    }
                  />
                  <p className={helperTextClass}>
                    Select your lease start and end dates. Standard UK rentals are typically for 12-month terms.
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={goToPrevStep}
                disabled={currentStep === 1}
                className={`py-2 px-4 rounded-md flex items-center ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <ArrowLeftCircle className="w-5 h-5 mr-2" />
                Previous
              </button>
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={!isStepValid()}
                  className={`py-2 px-4 rounded-md flex items-center ${
                    !isStepValid()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Next
                  <ArrowRightCircle className="w-5 h-5 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Property
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
 