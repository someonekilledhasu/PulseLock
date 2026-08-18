import type { Device, RiskAssessment } from './types';

export function assessRisk(device: Device, attempts: number, unusualTiming = false): RiskAssessment {
  const physiology = Math.max(0, Math.min(40, (device.heartRate - device.baseline) * 2));
  const behavior = Math.min(30, attempts * 9);
  const timing = unusualTiming ? 15 : 0;
  const tamper = device.tamper ? 15 : 0;
  const score = Math.round(Math.min(100, physiology + behavior + timing + tamper));
  const level = score >= 70 ? 'High' : score >= 40 ? 'Elevated' : 'Normal';
  return { score, level, explanation: level === 'Normal' ? 'Current device and behavioral signals look within your usual range.' : 'Based on current device and behavioral signals. A brief safety check may help.' };
}
