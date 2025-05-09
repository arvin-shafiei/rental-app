import React from 'react';
import { Home, CalendarRange, PiggyBank, Landmark, MapPin } from 'lucide-react';
import { Property } from './PropertyDetails';
import { format } from 'date-fns';

interface PropertyDisplayProps {
  property: Property;
}

export default function PropertyDisplay({ property }: PropertyDisplayProps) {
  // Format dates if available
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-8">
      {/* Property Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
            {property.emoji ? (
              <span className="text-3xl">{property.emoji}</span>
            ) : (
              <Home className="h-8 w-8 text-blue-600" />
            )}
          </div>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
            <div className="flex items-center text-gray-600">
              <MapPin className="mr-1 h-4 w-4" />
              <p className="text-sm">
                {[
                  property.address_line1,
                  property.address_line2,
                  property.city,
                  property.county,
                  property.postcode,
                  property.country
                ].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Property Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financial Details Card */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
            <PiggyBank className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">Financial Details</h3>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Monthly Rent</p>
              <p className="font-semibold text-gray-900">
                {property.rent_amount 
                  ? `£${property.rent_amount.toFixed(2)}` 
                  : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Deposit</p>
              <p className="font-semibold text-gray-900">
                {property.deposit_amount 
                  ? `£${property.deposit_amount.toFixed(2)}` 
                  : 'Not specified'}
              </p>
            </div>
          </div>
        </div>

        {/* Lease Period Card */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
            <CalendarRange className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">Lease Period</h3>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="font-semibold text-gray-900">{formatDate(property.lease_start_date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">End Date</p>
              <p className="font-semibold text-gray-900">{formatDate(property.lease_end_date)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Landlord Information */}
      {property.landlord_email && (
        <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
              <Landmark className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Landlord Contact</h3>
              <p className="text-gray-600">{property.landlord_email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 