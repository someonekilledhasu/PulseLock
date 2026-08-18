export type Role = 'patient' | 'caregiver' | 'admin';
export type RiskLevel = 'Normal' | 'Elevated' | 'High';
export type DoseStatus = 'completed' | 'available' | 'upcoming' | 'missed';
export type EventType = 'scheduled' | 'access' | 'verified' | 'denied' | 'cooling' | 'reset' | 'unlocked' | 'removed' | 'missed' | 'tamper' | 'notified' | 'device';

export interface Medication {
  id: string; name: string; strength: string; dose: string; form: string; quantity: number;
  times: string[]; instructions: string; window: string; adherence: number; color: string;
}
export interface Dose { id: string; medicationId: string; time: string; status: DoseStatus; day: string }
export interface PulseEvent { id: string; type: EventType; title: string; detail: string; time: string; medication?: string; }
export interface Device { connected: boolean; lockState: 'Locked' | 'Unlocked'; heartRate: number; baseline: number; battery: number; lastSync: string; weight: number; tamper: boolean; }
export interface RiskAssessment { score: number; level: RiskLevel; explanation: string; }

export const seedMedications: Medication[] = [
  { id: 'm1', name: 'Paracetamol', strength: '500 mg', dose: '1 tablet', form: 'Tablet', quantity: 18, times: ['10:00', '18:00'], instructions: 'With water, after food if preferred.', window: '±30 minutes', adherence: 96, color: '#d47567' },
  { id: 'm2', name: 'Vitamin D', strength: '1000 IU', dose: '1 capsule', form: 'Capsule', quantity: 24, times: ['12:30'], instructions: 'Take with a meal containing healthy fats.', window: '±30 minutes', adherence: 100, color: '#bca56a' },
  { id: 'm3', name: 'Metformin', strength: '500 mg', dose: '1 tablet', form: 'Tablet', quantity: 40, times: ['08:00', '20:00'], instructions: 'Take with meals.', window: '±30 minutes', adherence: 88, color: '#8e9d8a' }
];

export const seedDoses: Dose[] = [
  { id: 'd1', medicationId: 'm3', time: '08:00', status: 'completed', day: 'Today' },
  { id: 'd2', medicationId: 'm1', time: '10:00', status: 'available', day: 'Today' },
  { id: 'd3', medicationId: 'm2', time: '12:30', status: 'upcoming', day: 'Today' },
  { id: 'd4', medicationId: 'm1', time: '18:00', status: 'upcoming', day: 'Today' },
  { id: 'd5', medicationId: 'm3', time: '20:00', status: 'upcoming', day: 'Today' },
  { id: 'd6', medicationId: 'm1', time: '18:00', status: 'missed', day: 'Yesterday' }
];

export const seedEvents: PulseEvent[] = [
  { id: 'e1', type: 'verified', title: 'Identity confirmed', detail: 'Demo fingerprint verification completed.', time: '08:01', medication: 'Metformin' },
  { id: 'e2', type: 'removed', title: 'Dose removal confirmed', detail: 'Weight change detected after access.', time: '08:02', medication: 'Metformin' },
  { id: 'e3', type: 'missed', title: 'Dose window closed', detail: 'Yesterday’s evening dose was not confirmed.', time: 'Yesterday, 18:31', medication: 'Paracetamol' },
  { id: 'e4', type: 'device', title: 'Device synchronized', detail: 'PulseLock is connected and ready.', time: 'Yesterday, 17:46' }
];
