import { db } from './db';

// Baseline daily averages in kg CO2e
export const DAILY_AVERAGES: Record<string, number> = {
  transport: 5.0, // equivalent to ~26 km car ride
  food: 3.0,      // roughly equivalent to 2 chicken meals or 1 low-impact beef meal
  electricity: 4.0, // ~9 kWh grid electricity
  water: 0.5,      // ~150 liters of water
  waste: 1.0,      // ~1.7 kg landfill waste
  shopping: 1.5    // ~$25 spent
};

export interface EcosystemUpdateResult {
  healthScore: number;
  weatherState: string;
  pointsEarned: number;
  achievementsUnlocked: string[];
}

/**
 * Deterministic function to recalculate a user's ecosystem state.
 * Also calculates points earned and handles streaks/achievements.
 */
export async function updateEcosystemAndPoints(
  userId: string,
  newLogEmissions: Record<string, number>, // e.g. { food: 1.2, transport: 0.4 }
  isNewLog: boolean = true
): Promise<EcosystemUpdateResult> {
  // 1. Fetch current user and ecosystem state
  const user = await db.user.findUnique({ where: { id: userId } });
  const ecosystem = await db.ecosystemState.findUnique({ where: { userId } });
  
  if (!user || !ecosystem) {
    throw new Error('User or ecosystem state not found');
  }

  let currentHealth = ecosystem.healthScore;
  let pointsEarned = 0;
  const achievementsUnlocked: string[] = [];

  // 2. Process points and health updates for the current log
  if (isNewLog) {
    // Logging daily activity award
    pointsEarned += 10;

    let totalBelowAverage = true;
    let loggedCategories = 0;

    Object.entries(newLogEmissions).forEach(([category, co2e]) => {
      const avg = DAILY_AVERAGES[category.toLowerCase()] || 3.0;
      loggedCategories++;

      if (co2e < avg) {
        // Logging below average carbon footprint is a positive score
        currentHealth = Math.min(100, currentHealth + 5);
      } else {
        // Logging above average carbon footprint is a negative score
        currentHealth = Math.max(0, currentHealth - 8);
        totalBelowAverage = false;
      }
    });

    // Award bonus points for staying under daily average
    if (loggedCategories > 0 && totalBelowAverage) {
      pointsEarned += 25;
      currentHealth = Math.min(100, currentHealth + 3);
    }
  }

  // 3. Check for daily decay
  // Decay logic: -3 health for each full day passed with no logs
  if (user.lastLogDate) {
    const lastLog = new Date(user.lastLogDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastLog.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 2) {
      const decay = (diffDays - 1) * 3;
      currentHealth = Math.max(0, currentHealth - decay);
    }
  }

  // 4. Map healthScore to weatherState
  // healthScore: 0-100
  // 80–100: clear (lush forest/island, bright blue sky)
  // 60–79: clear (healthy but sparser vegetation)
  // 40–59: cloudy (neutral baseline)
  // 20–39: polluted (wilting plants, grey haze)
  // 0–19: stormy (dead/grey trees, storm clouds, rain)
  let weatherState = 'cloudy';
  if (currentHealth >= 80) {
    weatherState = 'clear';
  } else if (currentHealth >= 60) {
    weatherState = 'clear';
  } else if (currentHealth >= 40) {
    weatherState = 'cloudy';
  } else if (currentHealth >= 20) {
    weatherState = 'polluted';
  } else {
    weatherState = 'stormy';
  }

  // 5. Update user streak
  let currentStreak = user.currentStreak;
  let longestStreak = user.longestStreak;
  const now = new Date();

  if (isNewLog) {
    if (user.lastLogDate) {
      const lastLog = new Date(user.lastLogDate);
      const diffTime = Math.abs(now.getTime() - lastLog.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        // Logged on same day or consecutive day
        if (diffDays === 1) {
          currentStreak += 1;
        }
      } else {
        // Streak broken
        currentStreak = 1;
      }
    } else {
      // First log ever
      currentStreak = 1;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }
  }

  // 6. Check for Achievements
  const existingUserAchs = await db.userAchievement.findMany({
    where: { userId },
    include: { achievement: true }
  });
  
  const hasAch = (code: string) => existingUserAchs.some((ua: any) => ua.achievement?.code === code);

  // FIRST_LOG achievement
  if (isNewLog && !hasAch('FIRST_LOG')) {
    const ach = await db.achievement.findUnique({ where: { code: 'FIRST_LOG' } });
    if (ach) {
      await db.userAchievement.create({ data: { userId, achievementId: ach.id } });
      achievementsUnlocked.push('FIRST_LOG');
      pointsEarned += 50; // extra points for achievements
    }
  }

  // STREAK_7 achievement
  if (currentStreak >= 7 && !hasAch('STREAK_7')) {
    const ach = await db.achievement.findUnique({ where: { code: 'STREAK_7' } });
    if (ach) {
      await db.userAchievement.create({ data: { userId, achievementId: ach.id } });
      achievementsUnlocked.push('STREAK_7');
      pointsEarned += 100;
    }
  }

  // STREAK_30 achievement
  if (currentStreak >= 30 && !hasAch('STREAK_30')) {
    const ach = await db.achievement.findUnique({ where: { code: 'STREAK_30' } });
    if (ach) {
      await db.userAchievement.create({ data: { userId, achievementId: ach.id } });
      achievementsUnlocked.push('STREAK_30');
      pointsEarned += 200;
    }
  }

  // FOREST_BLOOM achievement
  if (currentHealth >= 80 && !hasAch('FOREST_BLOOM')) {
    const ach = await db.achievement.findUnique({ where: { code: 'FOREST_BLOOM' } });
    if (ach) {
      await db.userAchievement.create({ data: { userId, achievementId: ach.id } });
      achievementsUnlocked.push('FOREST_BLOOM');
      pointsEarned += 100;
    }
  }

  // 7. Update Unlocked Assets list
  // Unlocked assets list is updated based on achievements unlocked
  let unlockedAssets = [];
  try {
    unlockedAssets = typeof ecosystem.unlockedAssets === 'string'
      ? JSON.parse(ecosystem.unlockedAssets)
      : (ecosystem.unlockedAssets || []);
  } catch (e) {
    unlockedAssets = [];
  }

  achievementsUnlocked.forEach(code => {
    // Add corresponding asset code
    let assetId = '';
    if (code === 'FIRST_LOG') assetId = 'asset_sprout';
    else if (code === 'STREAK_7') assetId = 'asset_squirrel';
    else if (code === 'STREAK_30') assetId = 'asset_deer';
    else if (code === 'FOREST_BLOOM') assetId = 'asset_flowering_bush';
    else if (code === 'FIRST_SWAP') assetId = 'asset_bird';
    
    if (assetId && !unlockedAssets.includes(assetId)) {
      unlockedAssets.push(assetId);
    }
  });

  // Save changes back to DB
  await db.ecosystemState.update({
    where: { userId },
    data: {
      healthScore: currentHealth,
      weatherState,
      unlockedAssets: JSON.stringify(unlockedAssets)
    }
  });

  await db.user.update({
    where: { id: userId },
    data: {
      ecoPoints: user.ecoPoints + pointsEarned,
      currentStreak,
      longestStreak,
      lastLogDate: isNewLog ? now.toISOString() : user.lastLogDate
    }
  });

  // Sync leaderboard entry
  await db.leaderboardEntry.upsert({
    where: { userId },
    update: { weeklyPoints: user.ecoPoints + pointsEarned },
    create: { userId, weeklyPoints: user.ecoPoints + pointsEarned, groupId: 'global' }
  });

  return {
    healthScore: currentHealth,
    weatherState,
    pointsEarned,
    achievementsUnlocked
  };
}
