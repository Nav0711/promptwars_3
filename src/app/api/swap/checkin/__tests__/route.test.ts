import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    swapAction: {
      update: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
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
  },
}));

describe('POST /api/swap/checkin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if missing required fields', async () => {
    const req = new NextRequest('http://localhost/api/swap/checkin', {
      method: 'POST',
      body: JSON.stringify({ swapId: 'swap-1', userId: 'user-1' }), // missing result
    });
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('swapId, userId, and result are required');
  });

  it('should return 400 if result is invalid', async () => {
    const req = new NextRequest('http://localhost/api/swap/checkin', {
      method: 'POST',
      body: JSON.stringify({ swapId: 'swap-1', userId: 'user-1', result: 'invalid' }),
    });
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('result must be "completed" or "abandoned"');
  });

  it('should process an abandoned swap correctly', async () => {
    (db.swapAction.update as any).mockResolvedValue({});

    const req = new NextRequest('http://localhost/api/swap/checkin', {
      method: 'POST',
      body: JSON.stringify({ swapId: 'swap-1', userId: 'user-1', result: 'abandoned' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('abandoned');
    expect(data.pointsEarned).toBe(0);
    expect(db.swapAction.update).toHaveBeenCalled();
  });

  it('should process a completed swap and award points', async () => {
    (db.swapAction.update as any).mockResolvedValue({});
    (db.user.findUnique as any).mockResolvedValue({ id: 'user-1', ecoPoints: 100 });
    (db.user.update as any).mockResolvedValue({});
    (db.swapAction.findMany as any).mockResolvedValue([{ status: 'completed' }]); // First swap
    (db.achievement.findUnique as any).mockResolvedValue({ id: 'ach-1', title: 'First Swap' });
    (db.userAchievement.findMany as any).mockResolvedValue([]);
    (db.userAchievement.create as any).mockResolvedValue({});

    const req = new NextRequest('http://localhost/api/swap/checkin', {
      method: 'POST',
      body: JSON.stringify({ swapId: 'swap-1', userId: 'user-1', result: 'completed' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('completed');
    expect(data.pointsEarned).toBe(100);
    expect(data.achievementsUnlocked).toContain('First Swap');
    expect(db.swapAction.update).toHaveBeenCalled();
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { ecoPoints: 200 }
    });
  });
});
