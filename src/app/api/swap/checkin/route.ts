import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Points awarded for completing a swap (from PRD section 2.E)
const SWAP_COMPLETE_POINTS = 100;

export async function POST(req: NextRequest) {
  try {
    const { swapId, userId, result } = await req.json();

    if (!swapId || !userId || !result) {
      return NextResponse.json({ error: 'swapId, userId, and result are required' }, { status: 400 });
    }

    if (result !== 'completed' && result !== 'abandoned') {
      return NextResponse.json({ error: 'result must be "completed" or "abandoned"' }, { status: 400 });
    }

    // Update the swap status
    const now = new Date().toISOString();
    await db.swapAction.update({
      where: { id: swapId },
      data: {
        status: result,
        ...(result === 'completed' ? { completedAt: now } : { abandonedAt: now })
      }
    });

    let pointsEarned = 0;
    let achievementsUnlocked: string[] = [];

    if (result === 'completed') {
      // Award bonus points to the user
      const user = await db.user.findUnique({ where: { id: userId } });
      if (user) {
        const newPoints = (user.ecoPoints || 0) + SWAP_COMPLETE_POINTS;
        await db.user.update({
          where: { id: userId },
          data: { ecoPoints: newPoints }
        });
        pointsEarned = SWAP_COMPLETE_POINTS;

        // Check for FIRST_SWAP achievement
        const allSwaps = await db.swapAction.findMany({ where: { userId } });
        const completedSwaps = allSwaps.filter((s: any) => s.status === 'completed');
        if (completedSwaps.length === 1) {
          // First completed swap — unlock achievement
          const achievement = await db.achievement.findUnique({ where: { code: 'FIRST_SWAP' } });
          if (achievement) {
            const existing = await db.userAchievement.findMany({ where: { userId } });
            const alreadyUnlocked = existing.some((ua: any) => ua.achievementId === achievement.id);
            if (!alreadyUnlocked) {
              await db.userAchievement.create({
                data: { userId, achievementId: achievement.id }
              });
              achievementsUnlocked.push(achievement.title);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      status: result,
      pointsEarned,
      achievementsUnlocked
    });
  } catch (error: any) {
    console.error('Error in swap check-in:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
