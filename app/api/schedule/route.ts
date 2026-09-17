import { NextResponse } from 'next/server';
import { getDoseSchedules, getNextDose } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'today' | 'week' | 'all'

    const allDoses = await getDoseSchedules();
    const nextDose = await getNextDose();

    // Filter today's doses
    const today = new Date().toISOString().split('T')[0];
    const todayDoses = allDoses.filter(d => d.scheduled_datetime.startsWith(today));

    let filtered = allDoses;
    if (filter === 'today') {
      filtered = todayDoses;
    } else if (filter === 'week') {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = allDoses.filter(d => {
        const t = new Date(d.scheduled_datetime);
        return t >= now && t <= weekFromNow;
      });
    }

    return NextResponse.json({
      success: true,
      nextDose,
      todayDoses,
      doses: filtered
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch schedule' }, { status: 500 });
  }
}
