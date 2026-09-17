import { NextResponse } from 'next/server';
import { getAdherenceStats, getDeviceEvents } from '@/lib/db';

export async function GET() {
  try {
    const stats = await getAdherenceStats();
    const events = await getDeviceEvents(10);

    return NextResponse.json({
      success: true,
      stats,
      recentEvents: events
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
