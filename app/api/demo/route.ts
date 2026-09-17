import { NextResponse } from 'next/server';
import { resetDatabaseToSeed, activateNextDoseNow, getDoseSchedules, getAdherenceStats } from '@/lib/db';

async function handleDemoAction(action: string) {
  if (action === 'reset') {
    resetDatabaseToSeed();
    const doses = await getDoseSchedules();
    const stats = await getAdherenceStats();
    return NextResponse.json({
      success: true,
      action: 'reset',
      message: 'Demo database reset to initial clinical seed state.',
      dosesCount: doses.length,
      stats
    });
  }

  if (action === 'activate_window') {
    activateNextDoseNow();
    const doses = await getDoseSchedules();
    return NextResponse.json({
      success: true,
      action: 'activate_window',
      message: 'Next dose scheduled window moved to NOW (Available for Biometric Unlock).',
      dosesCount: doses.length
    });
  }

  return NextResponse.json({ error: `Unknown demo action: ${action}` }, { status: 400 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'reset';
  return handleDemoAction(action);
}

export async function POST(request: Request) {
  try {
    let action = 'reset';
    try {
      const body = await request.json();
      if (body && body.action) {
        action = body.action;
      }
    } catch {
      const { searchParams } = new URL(request.url);
      action = searchParams.get('action') || 'reset';
    }

    return handleDemoAction(action);
  } catch (error: any) {
    console.error('Demo API error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
