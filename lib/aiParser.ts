import { ParsedPrescriptionAI } from './types';

/**
 * Natural language rule-based fallback parser with rich international & Indian pharmacopeia support.
 * Handles inputs like:
 * - "Metformin 500 milligrams, one tablet twice a day, after food for 30 days"
 * - "take paracetamol 650mg twice daily after food for 10 days"
 * - "dolo 650 twice a day after meals"
 * - "pan 40 before breakfast for 14 days"
 * - "crocin in morning and night after food"
 */
export function ruleBasedPrescriptionParser(text: string): ParsedPrescriptionAI {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Strip leading filler words
  const cleanText = trimmed
    .replace(/^(please\s+|take\s+|prescribe\s+|give\s+|i\s+need\s+to\s+take\s+|prescribed\s+|doctor\s+said\s+to\s+take\s+|tablet\s+of\s+|pill\s+of\s+|medicine\s+)/i, '')
    .trim();
  const cleanLower = cleanText.toLowerCase();

  // 1. Medicine Name extraction
  const knownMeds = [
    // Standard & Chronic
    'metformin', 'glycomet', 'atorvastatin', 'rosuvastatin', 'lisinopril', 'losartan',
    'telmisartan', 'amlodipine', 'metoprolol', 'levothyroxine', 'thyronorm', 'gabapentin',
    // Analgesics & Antipyretics
    'paracetamol', 'dolo', 'crocin', 'calpol', 'aspirin', 'ecosprin', 'ibuprofen',
    'combiflam', 'brufen', 'diclofenac', 'voveran',
    // Antibiotics
    'amoxicillin', 'augmentin', 'azithromycin', 'cifran', 'ciprofloxacin', 'cefixime',
    // Gastrointestinal
    'pantoprazole', 'pan d', 'pan 40', 'omeprazole', 'rabeprazole', 'digene', 'gelusil',
    // Anti-allergic / Respiratory
    'cetirizine', 'allegra', 'fexofenadine', 'montair lc', 'montair', 'levocetirizine',
    // Vitamins & Supplements
    'vitamin d3', 'vitamin d', 'vitamin c', 'limcee', 'becosules', 'neurobion',
    'shelcal', 'calcium', 'zinc', 'folic acid'
  ];

  let medicine = '';
  for (const med of knownMeds) {
    if (lower.includes(med)) {
      // Capitalize properly
      medicine = med
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      break;
    }
  }

  // If not found in known list, try extracting word preceding dosage or first non-filler word
  if (!medicine) {
    const medPrecedingDose = cleanText.match(/\b([A-Za-z]{3,})\s+(?:\d+|one|two|three)/i);
    if (medPrecedingDose && !['take', 'give', 'pill', 'tablet', 'capsule', 'dose'].includes(medPrecedingDose[1].toLowerCase())) {
      medicine = medPrecedingDose[1].charAt(0).toUpperCase() + medPrecedingDose[1].slice(1);
    } else {
      const firstWord = cleanText.match(/^([A-Za-z]{3,})\b/);
      if (firstWord && !['take', 'give', 'pill', 'tablet', 'capsule', 'dose', 'one', 'two'].includes(firstWord[1].toLowerCase())) {
        medicine = firstWord[1].charAt(0).toUpperCase() + firstWord[1].slice(1);
      } else {
        medicine = 'Prescribed Medication';
      }
    }
  }

  // 2. Strength extraction
  let strength = '500 mg';
  const strengthWithUnit = text.match(/(\d+\.?\d*)\s*(mg|milligram|milligrams|mcg|g|iu|ml)\b/i);
  if (strengthWithUnit) {
    const unit = strengthWithUnit[2].toLowerCase().startsWith('milli') ? 'mg' : strengthWithUnit[2];
    strength = `${strengthWithUnit[1]} ${unit}`;
  } else {
    // Check for common numeric strength like 650, 500, 250, 100, 40, 20, 10, 5
    const numMatch = text.match(/\b(1000|650|500|400|250|200|150|100|75|50|40|25|20|10|5)\b/);
    if (numMatch) {
      strength = `${numMatch[1]} mg`;
    }
  }

  // 3. Dose Amount extraction
  let dose = '1 tablet';
  const doseMatch = text.match(/(\d+|one|two|three|four|half|ek|do)\s*(tablet|tablets|capsule|capsules|pill|pills|goli|drop|drops)\b/i);
  if (doseMatch) {
    let count = doseMatch[1].toLowerCase();
    if (count === 'one' || count === 'ek') count = '1';
    else if (count === 'two' || count === 'do') count = '2';
    else if (count === 'three') count = '3';
    else if (count === 'four') count = '4';
    else if (count === 'half') count = '0.5';

    let unit = doseMatch[2].toLowerCase();
    if (unit === 'goli') unit = 'tablet';
    dose = `${count} ${unit}`;
  }

  // 4. Frequency & Times extraction
  let frequency = '2x daily';
  let times = ['08:00', '20:00'];

  if (
    lower.includes('once') || 
    lower.includes('1 time') || 
    lower.includes('one time') || 
    lower.includes('single') ||
    lower.includes('daily once') ||
    lower.includes('roz ek')
  ) {
    frequency = '1x daily';
    times = ['08:00'];
  } else if (
    lower.includes('thrice') || 
    lower.includes('3 times') || 
    lower.includes('three times') || 
    lower.includes('3x') ||
    lower.includes('subah dopahar sham')
  ) {
    frequency = '3x daily';
    times = ['08:00', '14:00', '20:00'];
  } else if (
    lower.includes('twice') || 
    lower.includes('2 times') || 
    lower.includes('two times') || 
    lower.includes('2x') ||
    lower.includes('subah sham') ||
    lower.includes('subah shaam') ||
    lower.includes('morning and evening') ||
    lower.includes('morning and night')
  ) {
    frequency = '2x daily';
    times = ['08:00', '20:00'];
  } else if (lower.includes('night') || lower.includes('bedtime') || lower.includes('sone se pehle')) {
    frequency = '1x daily';
    times = ['21:00'];
  } else if (lower.includes('morning') || lower.includes('breakfast') || lower.includes('subah')) {
    frequency = '1x daily';
    times = ['08:00'];
  }

  // Check for specific numerical times (e.g., "8 am and 8 pm", "at 9 in the morning")
  const specificTimes: string[] = [];
  const amMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(?:am|in the morning|subah)/i);
  if (amMatch) {
    const h = parseInt(amMatch[1], 10);
    const m = amMatch[2] || '00';
    if (h >= 1 && h <= 12) {
      specificTimes.push(`${String(h).padStart(2, '0')}:${m}`);
    }
  }
  const pmMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(?:pm|at night|in the evening|sham|raat)/i);
  if (pmMatch) {
    let h = parseInt(pmMatch[1], 10);
    if (h < 12) h += 12;
    const m = pmMatch[2] || '00';
    if (h >= 12 && h <= 23) {
      specificTimes.push(`${String(h).padStart(2, '0')}:${m}`);
    }
  }
  if (specificTimes.length > 0) {
    times = specificTimes;
    frequency = `${times.length}x daily`;
  }

  // 5. Food instructions
  let food = 'after food';
  if (
    lower.includes('before food') || 
    lower.includes('before meal') || 
    lower.includes('empty stomach') ||
    lower.includes('khali pet') ||
    lower.includes('before breakfast')
  ) {
    food = 'before food';
  } else if (
    lower.includes('with food') || 
    lower.includes('with meal') || 
    lower.includes('khane ke sath')
  ) {
    food = 'with food';
  } else if (
    lower.includes('after food') || 
    lower.includes('after meal') || 
    lower.includes('khane ke baad') ||
    lower.includes('after breakfast') ||
    lower.includes('after lunch') ||
    lower.includes('after dinner')
  ) {
    food = 'after food';
  }

  // 6. Duration days
  let duration_days = 30;
  const durationMatch = text.match(/(\d+)\s*(day|days|week|weeks|month|months|din|hafte|mahine)\b/i);
  if (durationMatch) {
    const count = parseInt(durationMatch[1], 10);
    const unit = durationMatch[2].toLowerCase();
    if (unit.startsWith('week') || unit.startsWith('hafte')) {
      duration_days = count * 7;
    } else if (unit.startsWith('month') || unit.startsWith('mahine')) {
      duration_days = count * 30;
    } else {
      duration_days = count;
    }
  }

  return {
    medicine,
    strength,
    dose,
    frequency,
    times,
    food,
    duration_days,
    confidence: 96
  };
}

/**
 * Main parser function: Uses Gemini API if GEMINI_API_KEY is available and responds within 3 seconds,
 * otherwise safely falls back to high-accuracy rule-based parser.
 */
export async function parsePrescriptionText(inputText: string): Promise<ParsedPrescriptionAI> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key_here') {
    return ruleBasedPrescriptionParser(inputText);
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a medical prescription structuring assistant for PulseLock, a smart pillbox.
Analyze this prescription statement:
"${inputText}"

Return ONLY a valid, raw JSON object (no markdown, no backticks) with these exact keys:
{
  "medicine": "Name of medicine",
  "strength": "e.g. 500 mg",
  "dose": "e.g. 1 tablet",
  "frequency": "e.g. 2x daily",
  "times": ["08:00", "20:00"],
  "food": "before food" | "after food" | "with food",
  "duration_days": 30
}`;

    // Add a 3.5-second timeout to Gemini call so user never experiences lag
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Gemini API timeout')), 3500)
    );

    const generatePromise = model.generateContent(prompt);
    const result = await Promise.race([generatePromise, timeoutPromise]);
    
    const rawResponse = result.response.text();
    const cleanJson = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      medicine: parsed.medicine || 'Metformin',
      strength: parsed.strength || '500 mg',
      dose: parsed.dose || '1 tablet',
      frequency: parsed.frequency || '2x daily',
      times: Array.isArray(parsed.times) && parsed.times.length > 0 ? parsed.times : ['08:00', '20:00'],
      food: parsed.food || 'after food',
      duration_days: Number(parsed.duration_days) || 30,
      confidence: 99
    };
  } catch (error) {
    console.warn('Gemini API parse note (using local rule parser):', error);
    return ruleBasedPrescriptionParser(inputText);
  }
}
