import { NextResponse } from 'next/server';
import { getActivePrescriptions, createPrescriptionWithDoses } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '00000000-0000-0000-0000-000000000001';

    const prescriptions = await getActivePrescriptions(userId);
    return NextResponse.json({ success: true, prescriptions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch prescriptions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId || '00000000-0000-0000-0000-000000000001';
    const medication = body.medication;

    if (!medication || !medication.name || !medication.strength) {
      return NextResponse.json(
        { error: 'Medication name and strength are required.' },
        { status: 400 }
      );
    }

    const result = await createPrescriptionWithDoses({
      userId,
      medication: {
        name: medication.name,
        strength: medication.strength,
        dose_amount: medication.dose_amount || '1 tablet',
        dose_unit: medication.dose_unit || 'tablet',
        frequency: medication.frequency || '2x daily',
        scheduled_times: medication.scheduled_times || ['08:00', '20:00'],
        food_instruction: medication.food_instruction || 'after food',
        duration_days: Number(medication.duration_days) || 30,
        compartment_id: medication.compartment_id || 'C01',
        color: medication.color || '#3b82f6'
      },
      startDate: body.startDate
    });

    return NextResponse.json({
      success: true,
      message: `Prescription confirmed! ${result.dosesCreated} doses generated across ${medication.duration_days || 30} days.`,
      data: result
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create prescription' }, { status: 500 });
  }
}
