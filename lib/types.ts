export type DoseStatus = 'upcoming' | 'available' | 'accessed' | 'missed';
export type PrescriptionStatus = 'draft' | 'confirmed' | 'active' | 'paused' | 'completed';
export type DeviceEventType = 'access_granted' | 'access_denied' | 'sync' | 'unlocked' | 'tamper' | 'manual_override';

export interface User {
  id: string;
  username: string;
  full_name: string;
  pin: string;
  created_at: string;
  email?: string;
  phone?: string;
  emergency_contact?: string;
}

export interface Prescription {
  id: string;
  user_id: string;
  status: PrescriptionStatus;
  start_date: string;
  end_date?: string;
  notes?: string;
  created_at: string;
  medications?: Medication[];
}

export interface Medication {
  id: string;
  prescription_id: string;
  name: string;
  strength: string; // e.g. "500 mg"
  dose_amount: string; // e.g. "1 tablet"
  dose_unit: string; // e.g. "tablet"
  frequency: string; // e.g. "2x daily"
  scheduled_times: string[]; // e.g. ["08:00", "20:00"]
  food_instruction: string; // e.g. "after food"
  duration_days: number; // e.g. 30
  compartment_id: string; // e.g. "C01", "C02"
  color: string;
  total_pills?: number;
  remaining_pills?: number;
  created_at?: string;
}

export interface DoseSchedule {
  id: string;
  medication_id: string;
  scheduled_datetime: string; // ISO 8601 string
  compartment_id: string; // "C01", "C02"
  status: DoseStatus;
  accessed_at?: string | null;
  access_method?: 'biometric' | 'manual_override';
  notes?: string;
  created_at?: string;
  medication?: Medication;
}

export interface DeviceEvent {
  id: string;
  dose_schedule_id?: string | null;
  device_id: string;
  event_type: DeviceEventType;
  compartment?: string;
  patient_id?: string;
  status: string;
  timestamp: string;
  raw_payload?: Record<string, any>;
  medication_name?: string;
}

export interface ParsedPrescriptionAI {
  medicine: string;
  strength: string;
  dose: string;
  frequency: string;
  times: string[];
  food: string;
  duration_days: number;
  confidence?: number;
}

export interface AdherenceStats {
  overall_rate: number;
  scheduled_count: number;
  accessed_count: number;
  missed_count: number;
  upcoming_count: number;
  weekly_trend: {
    day: string;
    date: string;
    rate: number;
    scheduled: number;
    accessed: number;
  }[];
  medication_breakdown: {
    name: string;
    strength: string;
    scheduled: number;
    accessed: number;
    rate: number;
    color: string;
    remaining_pills?: number;
    total_pills?: number;
  }[];
}

export interface PulseLockDeviceState {
  deviceId: string;
  connected: boolean;
  battery: number;
  lastSync: string;
  lockStatus: 'Locked' | 'Unlocked';
  activeCompartment: string | null;
  activeDose: DoseSchedule | null;
  serverIp?: string;
}
