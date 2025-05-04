export interface Property {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
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
  property_details?: Record<string, any>;
}

export interface CreatePropertyDTO {
  name: string;
  emoji?: string;
  image_url?: string;
  is_active?: boolean;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  county?: string;
  postcode: string;
  country?: string;
  property_type?: string;
  landlord_email?: string;
  rent_amount?: number;
  deposit_amount?: number;
  lease_start_date?: string;
  lease_end_date?: string;
  property_details?: Record<string, any>;
}

export interface UpdatePropertyDTO extends Partial<CreatePropertyDTO> {
  id: string;
}

export type PropertyUserRole = 'owner' | 'tenant';

export interface PropertyUser {
  id: string;
  property_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  user_role: PropertyUserRole;
}

export interface CreatePropertyUserDTO {
  property_id: string;
  user_id: string;
  user_role: PropertyUserRole;
} 