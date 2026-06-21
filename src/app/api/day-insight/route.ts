import { NextRequest, NextResponse } from 'next/server';
import { generateDayInsightAI } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { totalCo2eKg, topCategory, topCategoryKg, topCategoryPercent, date, activities } = await req.json();

    if (typeof totalCo2eKg !== 'number') {
      return NextResponse.json({ error: 'totalCo2eKg is required' }, { status: 400 });
    }

    // Attempt AI-narrated insight
    const aiInsight = await generateDayInsightAI({
      totalCo2eKg,
      topCategory: topCategory || 'unknown',
      topCategoryKg: topCategoryKg || 0,
      topCategoryPercent: topCategoryPercent || 0,
      date
    });

    if (aiInsight) {
      return NextResponse.json({
        insightText: aiInsight.insightText,
        encouragementText: aiInsight.encouragementText,
        source: 'gemini'
      });
    }

    // Fallback: template-based insight
    let insightText = 'No activity logged — your ecosystem drifts toward neutral without logs.';
    let encouragementText = 'Log at least one activity today to keep your ecosystem thriving! 🌱';

    if (totalCo2eKg > 0 && topCategory) {
      const pct = topCategoryPercent || Math.round((topCategoryKg / totalCo2eKg) * 100);
      insightText = `Your ${topCategory} activities accounted for ${pct}% of today's ${totalCo2eKg.toFixed(1)} kg CO2e footprint.`;
      encouragementText = `Every small swap in ${topCategory} adds up over the week — you've got this! 🌿`;
    }

    return NextResponse.json({ insightText, encouragementText, source: 'fallback' });
  } catch (error: any) {
    console.error('Error in day-insight API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
