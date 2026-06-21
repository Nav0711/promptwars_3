import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const swaps = await db.swapAction.findMany({
      where: { userId }
    });

    return NextResponse.json(swaps);
  } catch (error: any) {
    console.error('Error fetching swaps:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      swapTitle,
      analogyText,
      reasonText,
      estimatedSavingsKgCO2eWeekly,
      action, // 'accept' | 'complete' | 'abandon'
      swapId
    } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'accept') {
      if (!swapTitle) {
        return NextResponse.json({ error: 'swapTitle is required' }, { status: 400 });
      }

      // Create SwapAction
      const swap = await db.swapAction.create({
        data: {
          userId,
          swapTitle,
          analogyText: analogyText || '',
          reasonText: reasonText || '',
          estimatedSavingsKgCO2eWeekly: estimatedSavingsKgCO2eWeekly || 0,
          status: 'active'
        }
      });

      // Create corresponding Goal
      const targetCategory = swapTitle.toLowerCase().includes('commute') || swapTitle.toLowerCase().includes('car') || swapTitle.toLowerCase().includes('transit')
        ? 'transport'
        : swapTitle.toLowerCase().includes('beef') || swapTitle.toLowerCase().includes('meal') || swapTitle.toLowerCase().includes('food')
        ? 'food'
        : 'overall';

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7); // 7-day goal

      await db.goal.create({
        data: {
          userId,
          type: 'category_specific',
          targetValue: estimatedSavingsKgCO2eWeekly || 5.0,
          category: targetCategory,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: 'active'
        }
      });

      return NextResponse.json({ swap });
    }

    if (action === 'complete') {
      if (!swapId) {
        return NextResponse.json({ error: 'swapId is required' }, { status: 400 });
      }

      const updatedSwap = await db.swapAction.update({
        where: { id: swapId },
        data: { status: 'completed' }
      });

      // Award +100 Eco-Points
      let pointsEarned = 100;
      const achievementsUnlocked: string[] = [];

      // Check if they already have FIRST_SWAP achievement
      const ach = await db.achievement.findUnique({ where: { code: 'FIRST_SWAP' } });
      const userAchs = await db.userAchievement.findMany({ where: { userId } });
      const hasFirstSwapAch = userAchs.some((ua: any) => ua.achievementId === ach?.id);

      if (ach && !hasFirstSwapAch) {
        await db.userAchievement.create({
          data: { userId, achievementId: ach.id }
        });
        achievementsUnlocked.push('FIRST_SWAP');
        pointsEarned += 50; // achievement points

        // Also add bird asset to user's ecosystem if they unlocked first swap
        const ecosystem = await db.ecosystemState.findUnique({ where: { userId } });
        if (ecosystem) {
          let unlockedAssets = [];
          try {
            unlockedAssets = typeof ecosystem.unlockedAssets === 'string'
              ? JSON.parse(ecosystem.unlockedAssets)
              : (ecosystem.unlockedAssets || []);
          } catch (e) {
            unlockedAssets = [];
          }
          if (!unlockedAssets.includes('asset_bird')) {
            unlockedAssets.push('asset_bird');
            await db.ecosystemState.update({
              where: { userId },
              data: { unlockedAssets: JSON.stringify(unlockedAssets) }
            });
          }
        }
      }

      // Add points to user profile
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: {
          ecoPoints: user.ecoPoints + pointsEarned
        }
      });

      // Recalculate ecosystem health: completed swap increases health score
      const ecosystem = await db.ecosystemState.findUnique({ where: { userId } });
      if (ecosystem) {
        const newHealth = Math.min(100, ecosystem.healthScore + 25);
        let weatherState = ecosystem.weatherState;
        if (newHealth >= 80) weatherState = 'clear';
        else if (newHealth >= 40) weatherState = 'clear';

        await db.ecosystemState.update({
          where: { userId },
          data: {
            healthScore: newHealth,
            weatherState
          }
        });
      }

      // Sync leaderboard
      await db.leaderboardEntry.upsert({
        where: { userId },
        update: { weeklyPoints: updatedUser.ecoPoints },
        create: { userId, weeklyPoints: updatedUser.ecoPoints, groupId: 'global' }
      });

      return NextResponse.json({
        swap: updatedSwap,
        pointsEarned,
        achievementsUnlocked,
        user: updatedUser
      });
    }

    if (action === 'abandon') {
      if (!swapId) {
        return NextResponse.json({ error: 'swapId is required' }, { status: 400 });
      }

      const updatedSwap = await db.swapAction.update({
        where: { id: swapId },
        data: { status: 'abandoned' }
      });

      return NextResponse.json({ swap: updatedSwap });
    }

    return NextResponse.json({ error: 'Invalid action value' }, { status: 400 });
  } catch (error: any) {
    console.error('Error modifying swap action:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
