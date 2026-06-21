import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with a temporary baseline profile to ensure onboarding can complete
    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        baselineProfile: JSON.stringify({ completed: false }),
        baselineFootprintKgCO2e: 0.0
      }
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
