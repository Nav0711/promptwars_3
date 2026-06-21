import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { updateEcosystemAndPoints } from '@/lib/ecosystem';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const logs = await db.carbonLog.findMany({
      where: { userId },
      orderBy: { activityDate: 'desc' }
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, rawInputText, activityDate, parsedActivities } = await req.json();

    if (!userId || !parsedActivities) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Parse activities if received as string
    let activities = parsedActivities;
    if (typeof activities === 'string') {
      try {
        activities = JSON.parse(activities);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid parsedActivities JSON' }, { status: 400 });
      }
    }

    if (!Array.isArray(activities)) {
      return NextResponse.json({ error: 'parsedActivities must be an array' }, { status: 400 });
    }

    // Sum total emissions for the log
    const totalCo2eKg = activities.reduce((acc: number, cur: any) => acc + (cur.co2eKg || 0), 0);

    // Group activities by category for the ecosystem updater
    const categoryEmissions: Record<string, number> = {};
    activities.forEach((act: any) => {
      const cat = act.category?.toLowerCase() || 'other';
      categoryEmissions[cat] = (categoryEmissions[cat] || 0) + (act.co2eKg || 0);
    });

    // Create the CarbonLog record
    const log = await db.carbonLog.create({
      data: {
        userId,
        rawInputText: rawInputText || 'Manual activity log',
        activityDate: activityDate ? new Date(activityDate).toISOString() : new Date().toISOString(),
        parsedActivities: JSON.stringify(activities),
        totalCo2eKg,
        source: rawInputText ? 'chat' : 'manual'
      }
    });

    // Recalculate ecosystem state, streaks, points, achievements
    const ecosystemResult = await updateEcosystemAndPoints(userId, categoryEmissions, true);

    // Fetch fresh user data
    const user = await db.user.findUnique({ where: { id: userId } });
    const ecosystem = await db.ecosystemState.findUnique({ where: { userId } });
    const achievements = await db.userAchievement.findMany({
      where: { userId },
      include: { achievement: true }
    });

    return NextResponse.json({
      log,
      update: {
        pointsEarned: ecosystemResult.pointsEarned,
        achievementsUnlocked: ecosystemResult.achievementsUnlocked,
        healthScore: ecosystemResult.healthScore,
        weatherState: ecosystemResult.weatherState,
        user,
        ecosystem,
        achievements
      }
    });
  } catch (error: any) {
    console.error('Error logging activity:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
