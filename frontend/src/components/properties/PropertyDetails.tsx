import React from 'react';
import PropertyForm from './PropertyForm';
import PropertyDisplay from './PropertyDisplay';

interface Property {
  id: string;
  name: string;
  emoji?: string;
  image_url?: string;
  is_active: boolean;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  county?: string;
  postcode: string;
  country: string;
  property_type?: string;
  landlord_email?: string;
  rent_amount?: number;
  deposit_amount?: number;
  lease_start_date?: string;
  lease_end_date?: string;
}

interface PropertyDetailsProps {
  property: Property;
  isEditing: boolean;
  formData: Partial<Property>;
  isSaving: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  setIsEditing: (value: boolean) => void;
}

export default function PropertyDetails({
  property,
  isEditing,
  formData,
  isSaving,
  handleChange,
  handleSubmit,
  setIsEditing
}: PropertyDetailsProps) {
  if (isEditing) {
    return (
      <PropertyForm
        property={property}
        formData={formData}
        isSaving={isSaving}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        setIsEditing={setIsEditing}
      />
    );
  }
  
  return <PropertyDisplay property={property} />;
}

// Export the Property interface for reuse
export type { Property }; 