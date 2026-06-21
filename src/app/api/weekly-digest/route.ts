import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateWeeklyDigestAI } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get logs from the last 7 days
    const allLogs = await db.carbonLog.findMany({
      where: { userId },
      orderBy: { activityDate: 'desc' }
    });

    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);

    const thisWeekLogs = allLogs.filter((log: any) => new Date(log.activityDate) >= weekAgo);
    const prevWeekLogs = allLogs.filter((log: any) => {
      const d = new Date(log.activityDate);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(now.getDate() - 14);
      return d >= twoWeeksAgo && d < weekAgo;
    });

    // Aggregate this week's category totals
    const categoryTotals: Record<string, number> = {
      transport: 0, food: 0, electricity: 0, water: 0, waste: 0, shopping: 0
    };
    let weeklyTotalKg = 0;

    thisWeekLogs.forEach((log: any) => {
      weeklyTotalKg += log.totalCo2eKg || 0;
      let parsed: any[] = [];
      try {
        parsed = typeof log.parsedActivities === 'string'
          ? JSON.parse(log.parsedActivities)
          : log.parsedActivities;
      } catch { parsed = log.parsedActivities || []; }

      if (Array.isArray(parsed)) {
        parsed.forEach((act: any) => {
          const cat = act.category?.toLowerCase();
          if (cat && cat in categoryTotals) categoryTotals[cat] += act.co2eKg || 0;
        });
      }
    });

    // Calculate prev week total for comparison
    const prevWeekTotal = prevWeekLogs.reduce((sum: number, l: any) => sum + (l.totalCo2eKg || 0), 0);
    const reductionPercent = prevWeekTotal > 0
      ? parseFloat(((prevWeekTotal - weeklyTotalKg) / prevWeekTotal * 100).toFixed(1))
      : null;

    // Find best (lowest-emission) category with actual logs
    let bestCategory: string | null = null;
    let bestVal = Infinity;
    Object.entries(categoryTotals).forEach(([cat, val]) => {
      if (val > 0 && val < bestVal) { bestVal = val; bestCategory = cat; }
    });

    // Try AI digest generation
    const aiDigest = await generateWeeklyDigestAI({
      userName: (user as any).name || 'Eco Warrior',
      categoryTotals,
      weeklyTotalKg,
      reductionPercent,
      bestCategory,
      streakDays: (user as any).currentStreak || 0
    });

    if (aiDigest) {
      return NextResponse.json({
        summaryText: aiDigest.summaryText,
        badgeText: aiDigest.badgeText || null,
        weeklyTotalKg: parseFloat(weeklyTotalKg.toFixed(2)),
        reductionPercent,
        bestCategory,
        categoryTotals,
        source: 'gemini'
      });
    }

    // Fallback: template digest
    let summaryText = `This week you logged ${weeklyTotalKg.toFixed(1)} kg CO2e across ${thisWeekLogs.length} entries.`;
    if (reductionPercent !== null && reductionPercent > 0) {
      summaryText += ` That's a ${reductionPercent}% reduction from last week — great progress!`;
    } else if (reductionPercent !== null && reductionPercent < 0) {
      summaryText += ` Emissions rose ${Math.abs(reductionPercent)}% vs last week — small swaps next week can turn that around!`;
    }
    if (bestCategory) {
      summaryText += ` Your ${bestCategory} footprint was your greenest category. 🌿`;
    }

    return NextResponse.json({
      summaryText,
      badgeText: reductionPercent && reductionPercent > 10 ? '🏆 10%+ Reduction!' : null,
      weeklyTotalKg: parseFloat(weeklyTotalKg.toFixed(2)),
      reductionPercent,
      bestCategory,
      categoryTotals,
      source: 'fallback'
    });
  } catch (error: any) {
    console.error('Error in weekly-digest:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
