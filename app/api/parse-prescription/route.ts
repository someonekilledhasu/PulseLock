import { NextResponse } from 'next/server';
import { parsePrescriptionText } from '@/lib/aiParser';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = body.text;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please provide speech or prescription text to parse.' },
        { status: 400 }
      );
    }

    const structured = await parsePrescriptionText(text);

    return NextResponse.json({
      success: true,
      data: structured,
      originalText: text
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Prescription parsing failed' },
      { status: 500 }
    );
  }
}
