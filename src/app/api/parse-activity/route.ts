import { NextRequest, NextResponse } from 'next/server';
import { parseActivityAI, ChatHistoryItem } from '@/lib/ai';
import { parseActivityFallback } from '@/lib/fallbackParser';
import { calculateCo2e } from '@/lib/emissionFactors';

export async function POST(req: NextRequest) {
  try {
    const { rawText, history = [] } = await req.json();

    if (!rawText || typeof rawText !== 'string') {
      return NextResponse.json({ error: 'rawText is required' }, { status: 400 });
    }

    // Try AI parser with multi-turn conversation history
    const aiResponse = await parseActivityAI(rawText, history as ChatHistoryItem[]);

    let result: any = null;
    let updatedHistory: ChatHistoryItem[] = history;
    let usedFallback = false;

    if (aiResponse) {
      result = aiResponse.result;
      updatedHistory = aiResponse.updatedHistory;
    } else {
      // Fallback to rule-based parser (no history in fallback)
      result = parseActivityFallback(rawText);
      usedFallback = true;
    }

    // Validate and recalculate co2e values deterministically
    if (result && result.activities && result.activities.length > 0) {
      result.activities = result.activities.map((act: any) => {
        const co2e = calculateCo2e(act.category, act.subcategory, act.quantity, act.unit);
        return {
          ...act,
          co2eKg: parseFloat(co2e.toFixed(3))
        };
      });

      // Sum total emissions
      const totalCo2eKg = result.activities.reduce(
        (acc: number, cur: any) => acc + (cur.co2eKg || 0),
        0
      );
      result.totalCo2eKg = parseFloat(totalCo2eKg.toFixed(3));
    } else if (!result || !result.clarificationNeeded) {
      result = {
        activities: [],
        totalCo2eKg: 0,
        clarificationNeeded: true,
        clarificationQuestion:
          "I couldn't quite catch that! Could you mention the activity type and amount? For example: \"drove 12 km\" or \"had a beef burger\" 🌿"
      };
    }

    return NextResponse.json({
      ...result,
      updatedHistory,
      usedFallback
    });
  } catch (error: any) {
    console.error('Error in parse-activity API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
