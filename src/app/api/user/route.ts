import { NextRequest, NextResponse } from 'next/server';
import { db, USER_SELECT } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    let user = null;
    if (email) {
      user = await db.user.findUnique({ where: { email }, select: USER_SELECT });
    } else {
      user = await db.user.findFirst({ select: USER_SELECT });
    }

    if (!user) {
      return NextResponse.json({ user: null });
    }

    const ecosystem = await db.ecosystemState.findUnique({ where: { userId: user.id } });
    const achievements = await db.userAchievement.findMany({
      where: { userId: user.id },
      include: { achievement: true }
    });

    return NextResponse.json({
      user,
      ecosystem,
      achievements
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, baselineProfile, baselineFootprintKgCO2e } = await req.json();

    if (!email || !name || !baselineProfile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const profileString = typeof baselineProfile === 'string' ? baselineProfile : JSON.stringify(baselineProfile);

    // Check if user already exists
    let user = await db.user.findUnique({ where: { email }, select: USER_SELECT });
    if (user) {
      // Update baseline
      user = await db.user.update({
        where: { email },
        data: {
          name,
          baselineProfile: profileString,
          baselineFootprintKgCO2e
        },
        select: USER_SELECT
      });
      return NextResponse.json({ user });
    }

    // Create user and trigger default mock ecosystem state inside db.user.create
    user = await db.user.create({
      data: {
        email,
        name,
        baselineProfile: profileString,
        baselineFootprintKgCO2e,
        ecoPoints: 0,
        currentStreak: 0,
        longestStreak: 0
      },
      select: USER_SELECT
    });

    const ecosystem = await db.ecosystemState.findUnique({ where: { userId: user.id } });

    return NextResponse.json({
      user,
      ecosystem,
      isNew: true
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
