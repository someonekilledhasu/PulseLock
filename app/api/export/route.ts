import { NextResponse } from 'next/server';
import { exportCsvReport } from '@/lib/db';

export async function GET() {
  try {
    const csv = await exportCsvReport();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="PulseLock_Adherence_Report_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
