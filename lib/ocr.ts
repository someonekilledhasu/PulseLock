import type { Medication } from './types';

export interface OCRResult { medication: Omit<Medication, 'id' | 'adherence' | 'color'>; confidence: number; source: string; }
export async function scanDemoPrescription(): Promise<OCRResult> {
  await new Promise(resolve => setTimeout(resolve, 900));
  return { confidence: 94, source: 'Demo OCR extraction — review before use', medication: { name: 'Amoxicillin', strength: '500 mg', dose: '1 capsule', form: 'Capsule', quantity: 21, times: ['08:00', '14:00', '20:00'], instructions: 'Take after meals. Complete the prescribed course.', window: '±30 minutes' } };
}
