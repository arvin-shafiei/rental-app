export enum TimelineEventType {
    LEASE_START = 'lease_start',
    LEASE_END = 'lease_end',
    RENT_DUE = 'rent_due',
    INSPECTION = 'inspection',
    MAINTENANCE = 'maintenance',
    OTHER = 'other'
}

export enum TimelineEventRecurrence {
    NONE = 'none',
    DAILY = 'daily',
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
    QUARTERLY = 'quarterly'
}

export interface TimelineEvent {
    id: string;
    property_id: string;
    user_id: string;
    title: string;
    description?: string;
    event_type: TimelineEventType;
    start_date: string; // ISO date string
    end_date?: string; // ISO date string
    is_all_day: boolean;
    recurrence_type: TimelineEventRecurrence;
    recurrence_end_date?: string;
    notification_days_before?: number;
    is_completed?: boolean;
    created_at: string;
    updated_at: string;
    metadata?: Record<string, any>;
}

export interface CreateTimelineEventDTO {
    property_id: string;
    title: string;
    description?: string;
    event_type: TimelineEventType;
    start_date: string; // ISO date string
    end_date?: string; // ISO date string
    is_all_day?: boolean;
    recurrence_type?: TimelineEventRecurrence;
    recurrence_end_date?: string;
    notification_days_before?: number;
    metadata?: Record<string, any>;
}

export interface UpdateTimelineEventDTO extends Partial<CreateTimelineEventDTO> {
    id: string;
    is_completed?: boolean;
}

export interface TimelineSyncOptions {
    autoGenerateRentDueDates?: boolean;
    autoGenerateLeaseEvents?: boolean;
    upfrontRentPaid?: number;
    rentDueDay?: number;
    clearAllEvents?: boolean;
    includeInspections?: boolean;
    includeMaintenanceReminders?: boolean;
    includePropertyTaxes?: boolean;
    includeInsurance?: boolean;
    startDate?: string;
    inspectionFrequency?: string;
}