import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const goals = await db.goal.findMany({
      where: { userId }
    });

    return NextResponse.json(goals);
  } catch (error: any) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, type, targetValue, category, startDate, endDate } = await req.json();

    if (!userId || !type || targetValue === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const goal = await db.goal.create({
      data: {
        userId,
        type,
        targetValue: parseFloat(targetValue),
        category: category || null,
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // defaults to 7 days
        status: 'active'
      }
    });

    return NextResponse.json(goal);
  } catch (error: any) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
