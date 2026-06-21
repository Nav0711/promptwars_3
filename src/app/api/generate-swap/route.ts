import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSwapAI, embedText, cosineSimilarity } from '@/lib/ai';

const SIMILARITY_THRESHOLD = 0.85; // Swaps more similar than this are considered duplicates
const DEDUP_WINDOW_DAYS = 30;      // PRD: don't re-suggest abandoned swaps for 30 days
const MAX_RETRY_ATTEMPTS = 3;

// Curated static fallback library
const STATIC_SWAP_LIBRARY = [
  {
    swapTitle: 'Swap your Tuesday beef lunch for a vegan bowl',
    analogyText: 'Saves carbon equivalent to charging your smartphone 1,170 times',
    reasonText: 'Beef produces 6.61kg CO2e per meal, whereas a vegan meal generates just 0.59kg CO2e. Shifting just one meal weekly delivers an outsized impact for minimal effort.',
    estimatedSavingsKgCO2eWeekly: 6.0,
    targetCategory: 'food'
  },
  {
    swapTitle: 'Swap your solo car commute for the metro or bus once a week',
    analogyText: 'Saves equivalent to driving a petrol car 23 fewer kilometres',
    reasonText: 'Solo driving emits 0.192kg CO2e/km, while the metro emits only 0.041kg CO2e/km. Taking transit once weekly can reduce your weekly commute emissions by about 20%.',
    estimatedSavingsKgCO2eWeekly: 4.5,
    targetCategory: 'transport'
  },
  {
    swapTitle: 'Set your AC 2°C warmer and pair it with a fan',
    analogyText: 'Saves carbon equivalent to running an LED bulb for 500 hours',
    reasonText: 'Air conditioning is one of the largest household energy draws. Raising the thermostat just 2°C cuts AC power consumption by 15–20% while a fan costs 90% less energy.',
    estimatedSavingsKgCO2eWeekly: 3.5,
    targetCategory: 'electricity'
  },
  {
    swapTitle: 'Shorten your hot shower by 3 minutes',
    analogyText: 'Saves enough water to fill 60 sports drink bottles',
    reasonText: 'Water heating accounts for roughly 18% of home energy use. Cutting 3 minutes per shower saves both water and the energy needed to heat it, every single day.',
    estimatedSavingsKgCO2eWeekly: 1.2,
    targetCategory: 'water'
  },
  {
    swapTitle: 'Compost organic kitchen waste instead of binning it',
    analogyText: 'Prevents methane equivalent to 180 smartphone charges from entering the atmosphere',
    reasonText: 'Food waste in landfills decomposes anaerobically, producing methane — a greenhouse gas 80× more potent than CO2 over 20 years. Composting channels decomposition with oxygen, slashing this impact.',
    estimatedSavingsKgCO2eWeekly: 1.8,
    targetCategory: 'waste'
  },
  {
    swapTitle: 'Choose second-hand or swap before buying new clothes',
    analogyText: 'Saves more CO2 than driving 20 km in a petrol car',
    reasonText: 'Producing a single cotton t-shirt generates around 2.1 kg CO2e — and that\'s before transport. Buying second-hand bypasses this production footprint entirely.',
    estimatedSavingsKgCO2eWeekly: 2.5,
    targetCategory: 'shopping'
  }
];

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ 
      where: { id: userId },
      select: { id: true, baselineProfile: true }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get last 14 days of logs
    const logs = await db.carbonLog.findMany({
      where: { userId },
      orderBy: { activityDate: 'desc' }
    });

    // Aggregate category totals
    const categoryTotals: Record<string, number> = {
      transport: 0, food: 0, electricity: 0, water: 0, waste: 0, shopping: 0
    };

    logs.forEach((log: any) => {
      let parsed: any[] = [];
      try {
        parsed = typeof log.parsedActivities === 'string'
          ? JSON.parse(log.parsedActivities)
          : log.parsedActivities;
      } catch { parsed = log.parsedActivities || []; }

      if (Array.isArray(parsed)) {
        parsed.forEach((act: any) => {
          const cat = act.category?.toLowerCase();
          if (cat in categoryTotals) categoryTotals[cat] += act.co2eKg || 0;
        });
      }
    });

    // Find highest emission category
    let highestCategory = 'food';
    let highestValue = 0;
    Object.entries(categoryTotals).forEach(([cat, val]) => {
      if (val > highestValue) { highestValue = val; highestCategory = cat; }
    });

    // Fetch recent abandoned swaps for deduplication (last 30 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DEDUP_WINDOW_DAYS);

    const recentAbandonedSwaps = await db.swapAction.findMany({
      where: {
        userId: user.id,
        status: 'abandoned',
        createdAt: { gte: cutoffDate }
      },
      select: { targetCategory: true, embeddingVector: true }
    });

    // Helper: check if a candidate swap is too similar to any recent abandoned swap
    async function isDuplicate(candidateTitle: string): Promise<boolean> {
      if (recentAbandonedSwaps.length === 0) return false;

      const candidateEmbed = await embedText(candidateTitle);
      if (!candidateEmbed) return false; // No embedding API → skip dedup

      for (const abandoned of recentAbandonedSwaps) {
        if (!abandoned.embeddingVector) continue;
        let storedVector: number[];
        try {
          storedVector = typeof abandoned.embeddingVector === 'string'
            ? JSON.parse(abandoned.embeddingVector as string)
            : abandoned.embeddingVector as number[];
        } catch { continue; }

        const similarity = cosineSimilarity(candidateEmbed, storedVector);
        if (similarity > SIMILARITY_THRESHOLD) return true;
      }
      return false;
    }

    const logsText = `Baseline Profile: ${JSON.stringify(user.baselineProfile || {})}
14-day category emissions (kg CO2e): ${JSON.stringify(categoryTotals)}
Highest footprint category: ${highestCategory} (${highestValue.toFixed(2)} kg)
Recently abandoned swap categories (avoid re-suggesting these): ${recentAbandonedSwaps.map((s: any) => s.targetCategory).join(', ') || 'none'}`;

    // Try AI with deduplication, retry up to 3 times
    let swap: any = null;
    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
      const candidate = await generateSwapAI(logsText);
      if (!candidate) break;

      const duplicate = await isDuplicate(candidate.swapTitle);
      if (!duplicate) {
        swap = candidate;
        // Embed and store the new swap's vector for future dedup
        const embedding = await embedText(candidate.swapTitle);
        swap.embeddingVector = embedding;
        break;
      }
      console.log(`[generate-swap] Swap attempt ${attempt + 1} was a duplicate, retrying...`);
    }

    // Fallback: static library
    if (!swap) {
      const matchingSwaps = STATIC_SWAP_LIBRARY.filter(s => s.targetCategory === highestCategory);
      const pool = matchingSwaps.length > 0 ? matchingSwaps : STATIC_SWAP_LIBRARY;
      swap = pool[Math.floor(Math.random() * pool.length)];
    }

    return NextResponse.json(swap);
  } catch (error: any) {
    console.error('Error generating swap:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
