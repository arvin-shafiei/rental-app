import React from 'react';
import { Home } from 'lucide-react';
import { Property } from './PropertyDetails';

interface PropertyDisplayProps {
  property: Property;
}

export default function PropertyDisplay({ property }: PropertyDisplayProps) {
  return (
    <>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center">
          {property.emoji ? (
            <span className="text-4xl mr-3">{property.emoji}</span>
          ) : (
            <Home className="h-8 w-8 mr-3 text-blue-600" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
            <p className="text-black mt-1">
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
        <span className={`px-2 py-1 rounded-full text-xs ${property.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {property.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Property Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Type</p>
              <p className="text-black">{property.property_type || 'Not specified'}</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Financial Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Monthly Rent</p>
              <p className="text-black">
                {property.rent_amount ? `£${property.rent_amount.toFixed(2)}` : 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Deposit</p>
              <p className="text-black">
                {property.deposit_amount ? `£${property.deposit_amount.toFixed(2)}` : 'Not specified'}
              </p>
            </div>
            <div className="col-span-2 mt-2">
              <p className="text-sm font-medium text-gray-500">Landlord Email</p>
              <p className="text-black">
                {property.landlord_email || 'Not specified'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Lease Period</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Start Date</p>
            <p className="text-black">
              {property.lease_start_date || 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">End Date</p>
            <p className="text-black">
              {property.lease_end_date || 'Not specified'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 