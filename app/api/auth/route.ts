import { NextResponse } from 'next/server';
import { verifyUserPin, registerUser } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || 'login';

    if (action === 'register') {
      const { username, fullName, pin, email, phone } = body;
      if (!fullName || !pin || pin.length < 4) {
        return NextResponse.json(
          { error: 'Full name and a 4-digit PIN are required.' },
          { status: 400 }
        );
      }

      const user = await registerUser({
        username: username || fullName.toLowerCase().replace(/\s+/g, '_'),
        fullName,
        pin,
        email,
        phone
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          email: user.email,
          phone: user.phone
        }
      });
    }

    // Default: Login
    const pin = body.pin || '';
    const user = await verifyUserPin(pin);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid PIN. Please check your credentials.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Auth failed' }, { status: 500 });
  }
}
