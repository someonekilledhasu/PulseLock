import { DoseSchedule, DoseStatus, Medication } from './types';

/**
 * Calculates real-time status of a dose given its scheduled time and access record.
 */
export function computeDoseStatus(scheduledDatetime: string, accessedAt?: string | null): DoseStatus {
  if (accessedAt) {
    return 'accessed';
  }

  const now = new Date().getTime();
  const scheduledTime = new Date(scheduledDatetime).getTime();
  
  // Available window: 30 minutes before scheduled time up to 60 minutes after
  const windowStart = scheduledTime - 30 * 60 * 1000;
  const windowEnd = scheduledTime + 60 * 60 * 1000;

  if (now >= windowStart && now <= windowEnd) {
    return 'available';
  } else if (now > windowEnd) {
    return 'missed';
  } else {
    return 'upcoming';
  }
}

/**
 * Generates an array of scheduled doses across duration_days for a medication.
 */
export function generateDoseSchedule(
  medication: Medication,
  startDateStr?: string
): Omit<DoseSchedule, 'id'>[] {
  const baseDate = startDateStr ? new Date(startDateStr) : new Date();
  baseDate.setHours(0, 0, 0, 0);

  const schedules: Omit<DoseSchedule, 'id'>[] = [];
  const duration = medication.duration_days || 30;
  const times = medication.scheduled_times && medication.scheduled_times.length > 0 
    ? medication.scheduled_times 
    : ['08:00', '20:00'];

  for (let dayOffset = 0; dayOffset < duration; dayOffset++) {
    const currentDay = new Date(baseDate);
    currentDay.setDate(currentDay.getDate() + dayOffset);

    for (const timeStr of times) {
      const [hh, mm] = timeStr.split(':').map(Number);
      const doseTime = new Date(currentDay);
      doseTime.setHours(hh || 8, mm || 0, 0, 0);

      const status = computeDoseStatus(doseTime.toISOString(), null);

      schedules.push({
        medication_id: medication.id,
        scheduled_datetime: doseTime.toISOString(),
        compartment_id: medication.compartment_id || 'C01',
        status,
        accessed_at: null,
      });
    }
  }

  return schedules;
}

/**
 * Calculates human readable countdown string to next upcoming or available dose.
 */
export function getCountdown(targetDatetime: string): { text: string; isPast: boolean } {
  const now = new Date().getTime();
  const target = new Date(targetDatetime).getTime();
  const diffMs = target - now;

  if (diffMs <= 0 && Math.abs(diffMs) < 60 * 60 * 1000) {
    return { text: 'Window is currently open', isPast: false };
  } else if (diffMs < 0) {
    return { text: 'Dose window ended', isPast: true };
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return { text: `${days}d ${hours % 24}h`, isPast: false };
  }

  return {
    text: `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`,
    isPast: false
  };
}
