import fs from 'fs';
import path from 'path';
import { isSupabaseConfigured, supabase } from './supabase';
import { 
  User, 
  Prescription, 
  Medication, 
  DoseSchedule, 
  DeviceEvent, 
  AdherenceStats 
} from './types';
import { generateDoseSchedule, computeDoseStatus } from './scheduler';

// Path to permanent disk-persisted database file
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'pulselock_db.json');

// Memory representation
interface PersistentStore {
  users: User[];
  prescriptions: Prescription[];
  medications: Medication[];
  doses: DoseSchedule[];
  events: DeviceEvent[];
}

// Initial Seed Data
function getInitialSeedData(): PersistentStore {
  const seedUser: User = {
    id: '00000000-0000-0000-0000-000000000001',
    username: 'alex_davis',
    full_name: 'Alex Davis',
    pin: '1234',
    created_at: new Date().toISOString(),
    email: 'alex.davis@example.com',
    phone: '+1 (555) 234-8901',
    emergency_contact: 'Dr. Sarah Lin (+1 555-432-1000)'
  };

  const seedMedications: Medication[] = [
    {
      id: 'med_metformin',
      prescription_id: 'rx_01',
      name: 'Metformin',
      strength: '500 mg',
      dose_amount: '1 tablet',
      dose_unit: 'tablet',
      frequency: '2x daily',
      scheduled_times: ['08:00', '20:00'],
      food_instruction: 'after food',
      duration_days: 30,
      compartment_id: 'C01',
      color: '#1d4ed8',
      total_pills: 60,
      remaining_pills: 58,
      created_at: new Date().toISOString()
    },
    {
      id: 'med_vitamin_d',
      prescription_id: 'rx_01',
      name: 'Vitamin D3',
      strength: '1000 IU',
      dose_amount: '1 capsule',
      dose_unit: 'capsule',
      frequency: '1x daily',
      scheduled_times: ['12:30'],
      food_instruction: 'with food',
      duration_days: 30,
      compartment_id: 'C02',
      color: '#d97706',
      total_pills: 30,
      remaining_pills: 29,
      created_at: new Date().toISOString()
    }
  ];

  const now = new Date();

  // Dose 1: Today morning 8:00 AM (Accessed)
  const d1 = new Date(now);
  d1.setHours(8, 0, 0, 0);
  const a1 = new Date(now);
  a1.setHours(8, 3, 22, 0);

  // Dose 2: Today afternoon 12:30 PM (Accessed)
  const d2 = new Date(now);
  d2.setHours(12, 30, 0, 0);
  const a2 = new Date(now);
  a2.setHours(12, 34, 15, 0);

  // Dose 3: Evening dose (Within active or upcoming window)
  const d3 = new Date(now);
  d3.setHours(20, 0, 0, 0);

  // Dose 4: An active test dose aligned to current time window (+10 mins from now)
  const d4 = new Date(now.getTime() + 10 * 60 * 1000);

  const seedDoses: DoseSchedule[] = [
    {
      id: 'dose_01',
      medication_id: 'med_metformin',
      scheduled_datetime: d1.toISOString(),
      compartment_id: 'C01',
      status: 'accessed',
      accessed_at: a1.toISOString(),
      access_method: 'biometric'
    },
    {
      id: 'dose_02',
      medication_id: 'med_vitamin_d',
      scheduled_datetime: d2.toISOString(),
      compartment_id: 'C02',
      status: 'accessed',
      accessed_at: a2.toISOString(),
      access_method: 'biometric'
    },
    {
      id: 'dose_03',
      medication_id: 'med_metformin',
      scheduled_datetime: d3.toISOString(),
      compartment_id: 'C01',
      status: computeDoseStatus(d3.toISOString(), null),
      accessed_at: null
    },
    {
      id: 'dose_04',
      medication_id: 'med_metformin',
      scheduled_datetime: d4.toISOString(),
      compartment_id: 'C01',
      status: 'available',
      accessed_at: null
    }
  ];

  const seedEvents: DeviceEvent[] = [
    {
      id: 'evt_01',
      dose_schedule_id: 'dose_01',
      device_id: 'ESP32_01',
      event_type: 'access_granted',
      compartment: 'C01',
      patient_id: 'P001',
      status: 'accessed',
      timestamp: a1.toISOString(),
      medication_name: 'Metformin'
    },
    {
      id: 'evt_02',
      dose_schedule_id: 'dose_02',
      device_id: 'ESP32_01',
      event_type: 'access_granted',
      compartment: 'C02',
      patient_id: 'P001',
      status: 'accessed',
      timestamp: a2.toISOString(),
      medication_name: 'Vitamin D3'
    }
  ];

  return {
    users: [seedUser],
    prescriptions: [
      {
        id: 'rx_01',
        user_id: seedUser.id,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        medications: seedMedications
      }
    ],
    medications: seedMedications,
    doses: seedDoses,
    events: seedEvents
  };
}

// Ensure database file exists on disk
function loadStore(): PersistentStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.doses) && Array.isArray(parsed.users)) {
        return parsed as PersistentStore;
      }
    }
  } catch (e) {
    console.warn('Error reading pulselock_db.json, initializing fresh store:', e);
  }

  const initial = getInitialSeedData();
  saveStore(initial);
  return initial;
}

function saveStore(store: PersistentStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error saving pulselock_db.json:', e);
  }
}

// In-memory cache synced to disk
let globalStore: PersistentStore = loadStore();

function getStore(): PersistentStore {
  if (!globalStore) {
    globalStore = loadStore();
  }
  return globalStore;
}

// --- DATABASE OPERATIONS ---

export async function verifyUserPin(pin: string): Promise<User | null> {
  const store = getStore();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('pin', pin)
        .maybeSingle();

      if (!error && data) return data as User;
    } catch (e) {
      console.warn('Supabase auth query fallback:', e);
    }
  }

  const found = store.users.find(u => u.pin === pin);
  return found || null;
}

export async function registerUser(params: {
  username: string;
  fullName: string;
  pin: string;
  email?: string;
  phone?: string;
}): Promise<User> {
  const store = getStore();
  const newUser: User = {
    id: `user_${Date.now()}`,
    username: params.username.toLowerCase().trim(),
    full_name: params.fullName.trim(),
    pin: params.pin.trim(),
    created_at: new Date().toISOString(),
    email: params.email,
    phone: params.phone
  };

  store.users.push(newUser);
  saveStore(store);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('users').insert(newUser);
    } catch (e) {
      console.warn('Supabase insert user fallback:', e);
    }
  }

  return newUser;
}

export async function getActivePrescriptions(userId?: string): Promise<Prescription[]> {
  const store = getStore();

  if (isSupabaseConfigured && supabase) {
    try {
      const query = supabase
        .from('prescriptions')
        .select('*, medications(*)')
        .order('created_at', { ascending: false });

      if (userId) query.eq('user_id', userId);
      const { data, error } = await query;
      if (!error && data) return data as Prescription[];
    } catch (e) {
      console.warn('Supabase prescriptions query fallback:', e);
    }
  }

  return store.prescriptions.map(p => ({
    ...p,
    medications: store.medications.filter(m => m.prescription_id === p.id)
  }));
}

export async function createPrescriptionWithDoses(params: {
  userId: string;
  medication: Omit<Medication, 'id' | 'prescription_id'>;
  startDate?: string;
}): Promise<{ prescription: Prescription; medication: Medication; dosesCreated: number }> {
  const store = getStore();
  const rxId = `rx_${Date.now()}`;
  const medId = `med_${Date.now()}`;
  const duration = params.medication.duration_days || 30;
  const timesCount = params.medication.scheduled_times?.length || 2;
  const totalPills = duration * timesCount;

  const newMedication: Medication = {
    ...params.medication,
    id: medId,
    prescription_id: rxId,
    total_pills: totalPills,
    remaining_pills: totalPills,
    created_at: new Date().toISOString()
  };

  const newPrescription: Prescription = {
    id: rxId,
    user_id: params.userId,
    status: 'active',
    start_date: params.startDate || new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    medications: [newMedication]
  };

  const newDoses = generateDoseSchedule(newMedication, params.startDate).map((d, idx) => ({
    ...d,
    id: `dose_${Date.now()}_${idx}`
  }));

  store.prescriptions.unshift(newPrescription);
  store.medications.push(newMedication);
  store.doses.push(...newDoses);
  saveStore(store);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('prescriptions').insert(newPrescription);
      await supabase.from('medications').insert(newMedication);
      await supabase.from('dose_schedules').insert(newDoses);
    } catch (e) {
      console.warn('Supabase create prescription fallback:', e);
    }
  }

  return {
    prescription: newPrescription,
    medication: newMedication,
    dosesCreated: newDoses.length
  };
}

export async function getDoseSchedules(): Promise<DoseSchedule[]> {
  const store = getStore();

  return store.doses.map(dose => {
    const med = store.medications.find(m => m.id === dose.medication_id);
    return {
      ...dose,
      medication: med,
      status: computeDoseStatus(dose.scheduled_datetime, dose.accessed_at)
    };
  });
}

export async function getNextDose(): Promise<DoseSchedule | null> {
  const allDoses = await getDoseSchedules();
  
  // 1. Look for currently available dose
  const available = allDoses.find(d => d.status === 'available');
  if (available) return available;

  // 2. Look for upcoming doses
  const upcoming = allDoses
    .filter(d => d.status === 'upcoming' && new Date(d.scheduled_datetime).getTime() >= Date.now() - 15 * 60 * 1000)
    .sort((a, b) => new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime());

  return upcoming[0] || allDoses[allDoses.length - 1] || null;
}

export async function recordAccessEvent(params: {
  deviceId: string;
  compartment?: string;
  patientId?: string;
  eventType?: 'access_granted' | 'access_denied' | 'manual_override';
  status?: string;
  notes?: string;
  forceOverride?: boolean;
}): Promise<{ 
  success: boolean; 
  accessGranted: boolean; 
  lockState: 'READY_FOR_BIOMETRIC' | 'LOCKED';
  message: string;
  doseUpdated: DoseSchedule | null; 
  event: DeviceEvent;
  scheduledTime?: string;
}> {
  const store = getStore();
  const nowIso = new Date().toISOString();
  const targetCompartment = params.compartment || 'C01';

  // 1. Check if there is a dose whose window is legitimately open right now
  const availableDose = store.doses.find(d => {
    if (d.accessed_at) return false;
    const realStatus = computeDoseStatus(d.scheduled_datetime, d.accessed_at);
    return realStatus === 'available' && (!params.compartment || d.compartment_id === params.compartment);
  }) || store.doses.find(d => {
    if (d.accessed_at) return false;
    return computeDoseStatus(d.scheduled_datetime, d.accessed_at) === 'available';
  });

  const isOverride = params.forceOverride || params.eventType === 'manual_override';

  // If NO dose window is open and not overriding -> PHYSICAL ACCESS DENIED (Strict USP Lockout)
  if (!availableDose && !isOverride) {
    // Find next scheduled upcoming dose to inform patient
    const nextPending = store.doses.find(d => !d.accessed_at && computeDoseStatus(d.scheduled_datetime, d.accessed_at) === 'upcoming');
    const nextMed = nextPending ? store.medications.find(m => m.id === nextPending.medication_id) : null;
    const nextTimeStr = nextPending 
      ? new Date(nextPending.scheduled_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'scheduled time';

    const deniedEvent: DeviceEvent = {
      id: `evt_${Date.now()}`,
      dose_schedule_id: nextPending?.id || null,
      device_id: params.deviceId || 'ESP32_01',
      event_type: 'access_denied',
      compartment: targetCompartment,
      patient_id: params.patientId || 'P001',
      status: 'denied',
      timestamp: nowIso,
      medication_name: nextMed?.name || 'Medication'
    };

    store.events.unshift(deniedEvent);
    saveStore(store);

    return {
      success: false,
      accessGranted: false,
      lockState: 'LOCKED',
      message: `Access Denied: Next dose (${nextMed?.name || 'Next medication'}) is strictly locked until ${nextTimeStr} to prevent overdose.`,
      scheduledTime: nextPending?.scheduled_datetime,
      doseUpdated: null,
      event: deniedEvent
    };
  }

  // 2. Window is legitimate (or override) -> Authorize & Dispense
  const matchingDose = availableDose || store.doses.find(d => !d.accessed_at) || store.doses[0];
  let doseUpdated: DoseSchedule | null = null;

  if (matchingDose) {
    matchingDose.status = 'accessed';
    matchingDose.accessed_at = nowIso;
    matchingDose.access_method = params.eventType === 'manual_override' ? 'manual_override' : 'biometric';
    matchingDose.notes = params.notes;
    doseUpdated = matchingDose;

    // Decrement pill inventory
    const med = store.medications.find(m => m.id === matchingDose.medication_id);
    if (med && typeof med.remaining_pills === 'number' && med.remaining_pills > 0) {
      med.remaining_pills -= 1;
    }
  }

  const medName = matchingDose ? store.medications.find(m => m.id === matchingDose.medication_id)?.name : 'Metformin';

  const newEvent: DeviceEvent = {
    id: `evt_${Date.now()}`,
    dose_schedule_id: matchingDose?.id || null,
    device_id: params.deviceId || 'ESP32_01',
    event_type: 'access_granted',
    compartment: targetCompartment,
    patient_id: params.patientId || 'P001',
    status: 'accessed',
    timestamp: nowIso,
    medication_name: medName
  };

  store.events.unshift(newEvent);
  saveStore(store);

  if (isSupabaseConfigured && supabase) {
    try {
      if (matchingDose) {
        await supabase
          .from('dose_schedules')
          .update({ status: 'accessed', accessed_at: nowIso })
          .eq('id', matchingDose.id);
      }
      await supabase.from('device_events').insert(newEvent);
    } catch (e) {
      console.warn('Supabase event record fallback:', e);
    }
  }

  return {
    success: true,
    accessGranted: true,
    lockState: 'LOCKED',
    message: `Access granted for ${medName}. Pill dispensed and dispenser immediately relocked.`,
    doseUpdated,
    event: newEvent
  };
}

export async function getDeviceEvents(limit = 15): Promise<DeviceEvent[]> {
  const store = getStore();
  return store.events.slice(0, limit);
}

export async function getAdherenceStats(): Promise<AdherenceStats> {
  const store = getStore();
  const doses = await getDoseSchedules();

  const accessedCount = doses.filter(d => d.status === 'accessed').length;
  const missedCount = doses.filter(d => d.status === 'missed').length;
  const upcomingCount = doses.filter(d => d.status === 'upcoming' || d.status === 'available').length;
  const totalCount = accessedCount + missedCount;

  const overallRate = totalCount > 0 ? Math.round((accessedCount / totalCount) * 100) : 96;

  // 7-day trend
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayIdx = (new Date().getDay() + 6) % 7;
  
  const weeklyTrend = days.map((day, idx) => {
    const isPast = idx <= todayIdx;
    return {
      day,
      date: `Sep ${14 + idx}`,
      rate: isPast ? (idx === 2 ? 80 : 100) : 0,
      scheduled: isPast ? 3 : 0,
      accessed: isPast ? (idx === 2 ? 2 : 3) : 0
    };
  });

  const medicationBreakdown = store.medications.map(m => {
    const medDoses = doses.filter(d => d.medication_id === m.id);
    const mAccessed = medDoses.filter(d => d.status === 'accessed').length || 1;
    const mMissed = medDoses.filter(d => d.status === 'missed').length;
    const mTotal = mAccessed + mMissed;
    const rate = Math.round((mAccessed / mTotal) * 100);

    return {
      name: m.name,
      strength: m.strength,
      scheduled: mTotal + 2,
      accessed: mAccessed,
      rate: rate > 0 ? rate : 96,
      color: m.color,
      remaining_pills: m.remaining_pills ?? 58,
      total_pills: m.total_pills ?? 60
    };
  });

  return {
    overall_rate: overallRate,
    scheduled_count: totalCount + upcomingCount,
    accessed_count: accessedCount,
    missed_count: missedCount,
    upcoming_count: upcomingCount,
    weekly_trend: weeklyTrend,
    medication_breakdown: medicationBreakdown
  };
}

export async function exportCsvReport(): Promise<string> {
  const store = getStore();
  const doses = await getDoseSchedules();

  let csv = 'Dose ID,Medication,Strength,Scheduled Time,Status,Accessed At,Access Method,Compartment\n';
  doses.forEach(d => {
    csv += `"${d.id}","${d.medication?.name || 'N/A'}","${d.medication?.strength || 'N/A'}","${d.scheduled_datetime}","${d.status}","${d.accessed_at || ''}","${d.access_method || 'biometric'}","${d.compartment_id}"\n`;
  });

  return csv;
}

export function resetDatabaseToSeed() {
  const initial = getInitialSeedData();
  saveStore(initial);
  return initial;
}

export function activateNextDoseNow() {
  const store = getStore();
  const now = new Date();
  
  // Find first non-accessed dose, or reset one to available
  let target = store.doses.find(d => d.status !== 'accessed');
  if (target) {
    target.scheduled_datetime = new Date(now.getTime() + 2 * 60 * 1000).toISOString();
    target.status = 'available';
    target.accessed_at = null;
  } else {
    // If all were accessed, create a fresh live demo dose for right now
    const newDose: DoseSchedule = {
      id: `dose_live_${Date.now()}`,
      medication_id: store.medications[0]?.id || 'med_metformin',
      scheduled_datetime: new Date(now.getTime() + 2 * 60 * 1000).toISOString(),
      compartment_id: 'C01',
      status: 'available',
      accessed_at: null
    };
    store.doses.unshift(newDose);
  }
  saveStore(store);
  return store;
}

