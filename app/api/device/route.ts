import { NextResponse } from 'next/server';
import { getNextDose, recordAccessEvent, getDeviceEvents } from '@/lib/db';

/**
 * GET /api/device
 * Polled by ESP32 or web app to inspect current device lock status and scheduled dose.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId') || 'ESP32_01';

    const nextDose = await getNextDose();
    const isAvailable = nextDose?.status === 'available';

    return NextResponse.json({
      status: 'online',
      deviceId,
      serverTime: new Date().toISOString(),
      activeDose: nextDose ? {
        id: nextDose.id,
        medicationName: nextDose.medication?.name || 'Metformin',
        strength: nextDose.medication?.strength || '500 mg',
        doseAmount: nextDose.medication?.dose_amount || '1 tablet',
        compartment: nextDose.compartment_id || 'C01',
        status: nextDose.status,
        isWindowOpen: isAvailable,
        scheduledTime: nextDose.scheduled_datetime,
        authorizedPatientId: 'P001'
      } : null,
      lockState: isAvailable ? 'READY_FOR_BIOMETRIC' : 'LOCKED'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Device sync failed' }, { status: 500 });
  }
}

/**
 * POST /api/device
 * Called by ESP32 microcontroller over Wi-Fi when fingerprint sensor authenticates dose access,
 * or by the Web UI hardware simulation bar during demonstrations.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const deviceId = body.deviceId || 'ESP32_01';
    const compartment = body.compartment || 'C01';
    const eventType = body.eventType || 'access_granted';
    const patientId = body.patientId || 'P001';
    const status = body.status || 'accessed';

    const result = await recordAccessEvent({
      deviceId,
      compartment,
      patientId,
      eventType,
      status,
      forceOverride: body.forceOverride || false
    });

    return NextResponse.json({
      success: result.success,
      accessGranted: result.accessGranted,
      lockState: result.lockState,
      message: result.message,
      scheduledTime: result.scheduledTime,
      doseUpdated: result.doseUpdated,
      event: result.event
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to process device event' },
      { status: 500 }
    );
  }
}
