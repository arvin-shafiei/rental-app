export interface Property {
  id: string;
  address: string;
  name?: string;
}

export interface PropertyUsers {
  id: string;
  property_id: string;
  user_id: string;
  user_role: 'owner' | 'tenant';
  created_at: string;
  updated_at: string;
  profile?: {
    display_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface CheckItem {
  id: string;
  text: string;
  checked: boolean;
  assignedTo?: string | null;
  completed_by?: string | null;
  completed_at?: string | null;
  notificationDaysBefore?: number | null;
  event_id?: string | null;
}

export interface Agreement {
  id: string;
  title: string;
  property_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  due_date?: string | null;
  check_items: Array<{
    text: string;
    checked: boolean;
    assigned_to?: string | null;
    completed_by?: string | null;
    completed_at?: string | null;
    notification_days_before?: number | null;
    event_id?: string | null;
  }>;
  property?: {
    id: string;
    name: string;
    address: string;
  };
}

export interface ApiCheckItem {
  text: string;
  checked: boolean;
  assigned_to: string | null;
  notification_days_before?: number | null;
}

export interface AgreementData {
  title: string;
  propertyId: string;
  checkItems: ApiCheckItem[];
  dueDate?: string | null;
} 