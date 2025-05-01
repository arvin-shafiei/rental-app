import React from 'react';
import { Loader2, Edit } from 'lucide-react';
import { Property } from './PropertyDetails';

interface PropertyFormProps {
  property: Property;
  formData: Partial<Property>;
  isSaving: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  setIsEditing: (value: boolean) => void;
}

export default function PropertyForm({
  formData,
  isSaving,
  handleChange,
  handleSubmit,
  setIsEditing
}: PropertyFormProps) {
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Property Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="emoji">
              Emoji (optional)
            </label>
            <input
              id="emoji"
              name="emoji"
              type="text"
              placeholder="e.g. 🏠 or 🏢"
              value={formData.emoji || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="property_type">
              Property Type
            </label>
            <select
              id="property_type"
              name="property_type"
              value={formData.property_type || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              <option value="">Select a type</option>
              <option value="House">House</option>
              <option value="Flat">Flat/Apartment</option>
              <option value="Student">Student Accommodation</option>
              <option value="HMO">HMO</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div className="mb-4 flex items-center">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              checked={formData.is_active || false}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-gray-700 text-sm font-bold" htmlFor="is_active">
              Active Property
            </label>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4 md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address_line1">
              Address Line 1
            </label>
            <input
              id="address_line1"
              name="address_line1"
              type="text"
              value={formData.address_line1 || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4 md:col-span-2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address_line2">
              Address Line 2
            </label>
            <input
              id="address_line2"
              name="address_line2"
              type="text"
              value={formData.address_line2 || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="city">
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              value={formData.city || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="county">
              County
            </label>
            <input
              id="county"
              name="county"
              type="text"
              value={formData.county || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="postcode">
              Postcode *
            </label>
            <input
              id="postcode"
              name="postcode"
              type="text"
              required
              value={formData.postcode || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="country">
              Country
            </label>
            <input
              id="country"
              name="country"
              type="text"
              value={formData.country || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">Financial Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rent_amount">
              Monthly Rent (£)
            </label>
            <input
              id="rent_amount"
              name="rent_amount"
              type="text"
              value={formData.rent_amount || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="deposit_amount">
              Deposit Amount (£)
            </label>
            <input
              id="deposit_amount"
              name="deposit_amount"
              type="text"
              value={formData.deposit_amount || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">Lease Period</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lease_start_date">
              Lease Start Date
            </label>
            <input
              id="lease_start_date"
              name="lease_start_date"
              type="date"
              value={formData.lease_start_date || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lease_end_date">
              Lease End Date
            </label>
            <input
              id="lease_end_date"
              name="lease_end_date"
              type="date"
              value={formData.lease_end_date || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
} 