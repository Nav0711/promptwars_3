import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateEcosystemAndPoints } from '../ecosystem';
import { db } from '../db';

// Mock the db module
vi.mock('../db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    ecosystemState: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    achievement: {
      findUnique: vi.fn(),
    },
    userAchievement: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    leaderboardEntry: {
      upsert: vi.fn(),
    },
  },
}));

describe('updateEcosystemAndPoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    (db.user.findUnique as any).mockResolvedValue({
      id: 'user1',
      ecoPoints: 100,
      currentStreak: 2,
      longestStreak: 5,
      lastLogDate: new Date().toISOString(),
    });

    (db.ecosystemState.findUnique as any).mockResolvedValue({
      id: 'eco1',
      userId: 'user1',
      healthScore: 50,
      unlockedAssets: '[]',
    });

    (db.userAchievement.findMany as any).mockResolvedValue([]);
    (db.user.update as any).mockResolvedValue({});
    (db.ecosystemState.update as any).mockResolvedValue({});
    (db.leaderboardEntry.upsert as any).mockResolvedValue({});
  });

  it('should throw an error if user is not found', async () => {
    (db.user.findUnique as any).mockResolvedValue(null);
    await expect(updateEcosystemAndPoints('user1', {})).rejects.toThrow('User or ecosystem state not found');
  });

  it('should increase health score and award points for logging below average emissions', async () => {
    // Average transport is 5.0, so 2.0 is below average
    const result = await updateEcosystemAndPoints('user1', { transport: 2.0 });
    
    expect(result.healthScore).toBe(58); // 50 (base) + 5 (below avg) + 3 (bonus) = 58
    expect(result.pointsEarned).toBe(35); // 10 (base) + 25 (bonus)
    expect(db.ecosystemState.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ healthScore: 58 })
      })
    );
  });

  it('should decrease health score for logging above average emissions', async () => {
    // Average transport is 5.0, so 10.0 is above average
    const result = await updateEcosystemAndPoints('user1', { transport: 10.0 });
    
    expect(result.healthScore).toBe(42); // 50 (base) - 8 (above avg)
    expect(result.pointsEarned).toBe(10); // 10 (base)
  });

  it('should cap health score at 100', async () => {
    (db.ecosystemState.findUnique as any).mockResolvedValue({
      id: 'eco1',
      userId: 'user1',
      healthScore: 98,
      unlockedAssets: '[]',
    });
    
    const result = await updateEcosystemAndPoints('user1', { transport: 2.0 });
    expect(result.healthScore).toBe(100);
  });

  it('should cap health score at 0 for negative decay bounds', async () => {
    (db.ecosystemState.findUnique as any).mockResolvedValue({
      id: 'eco1',
      userId: 'user1',
      healthScore: 5,
      unlockedAssets: '[]',
    });
    
    const result = await updateEcosystemAndPoints('user1', { transport: 10.0 });
    expect(result.healthScore).toBe(0);
  });

  it('should decay health if last log date was 3 days ago', async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    (db.user.findUnique as any).mockResolvedValue({
      id: 'user1',
      ecoPoints: 100,
      currentStreak: 2,
      longestStreak: 5,
      lastLogDate: threeDaysAgo.toISOString(),
    });

    const result = await updateEcosystemAndPoints('user1', { transport: 2.0 });
    
    // Decay: 3 days -> diffDays = 3. Decay = (3 - 1) * 3 = 6
    // 50 (base) - 6 (decay) + 5 (below avg) + 3 (bonus) = 52
    expect(result.healthScore).toBe(52);
  });

  it('should break streak if last log date was >1 day ago', async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    (db.user.findUnique as any).mockResolvedValue({
      id: 'user1',
      ecoPoints: 100,
      currentStreak: 5,
      longestStreak: 5,
      lastLogDate: twoDaysAgo.toISOString(),
    });

    await updateEcosystemAndPoints('user1', { transport: 2.0 });
    
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ currentStreak: 1, longestStreak: 5 })
      })
    );
  });

  it('should unlock achievements and assets correctly', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    (db.user.findUnique as any).mockResolvedValue({
      id: 'user1',
      ecoPoints: 100,
      currentStreak: 6, // Becomes 7 after this log
      longestStreak: 6,
      lastLogDate: yesterday.toISOString(),
    });
    
    (db.achievement.findUnique as any).mockResolvedValue({ id: 'ach1', code: 'STREAK_7' });

    const result = await updateEcosystemAndPoints('user1', { transport: 2.0 });
    
    // FIRST_LOG and STREAK_7 should unlock
    expect(result.achievementsUnlocked).toContain('STREAK_7');
    
    expect(db.ecosystemState.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          unlockedAssets: expect.stringContaining('asset_squirrel')
        })
      })
    );
  });

  it('should set appropriate weather state based on health', async () => {
    const cases = [
      { health: 85, weather: 'clear' },
      { health: 65, weather: 'clear' },
      { health: 45, weather: 'cloudy' },
      { health: 25, weather: 'polluted' },
      { health: 10, weather: 'stormy' },
    ];

    for (const testCase of cases) {
      (db.ecosystemState.findUnique as any).mockResolvedValue({
        id: 'eco1',
        userId: 'user1',
        healthScore: testCase.health,
        unlockedAssets: '[]',
      });
      // no changes via new log
      const result = await updateEcosystemAndPoints('user1', {}, false);
      expect(result.weatherState).toBe(testCase.weather);
    }
  });
});
