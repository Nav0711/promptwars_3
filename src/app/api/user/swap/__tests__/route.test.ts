import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    swapAction: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    goal: {
      create: vi.fn(),
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
    ecosystemState: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    leaderboardEntry: {
      upsert: vi.fn(),
    },
  },
}));

describe('GET /api/user/swap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if userId is missing', async () => {
    const req = new NextRequest('http://localhost/api/user/swap');
    const response = await GET(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('userId is required');
  });

  it('should return swaps for a valid userId', async () => {
    const mockSwaps = [{ id: '1', swapTitle: 'Test Swap' }];
    (db.swapAction.findMany as any).mockResolvedValue(mockSwaps);

    const req = new NextRequest('http://localhost/api/user/swap?userId=user-123');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockSwaps);
    expect(db.swapAction.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' }
    });
  });
});

describe('POST /api/user/swap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if missing required fields', async () => {
    const req = new NextRequest('http://localhost/api/user/swap', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-123' }), // missing action
    });
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('userId and action are required');
  });

  it('should return 404 if user not found', async () => {
    (db.user.findUnique as any).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/user/swap', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-123', action: 'accept' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(404);
  });

  it('should accept a swap and create a corresponding goal', async () => {
    (db.user.findUnique as any).mockResolvedValue({ id: 'user-123' });
    (db.swapAction.create as any).mockResolvedValue({ id: 'swap-1', swapTitle: 'car' });
    (db.goal.create as any).mockResolvedValue({});

    const req = new NextRequest('http://localhost/api/user/swap', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-123', action: 'accept', swapTitle: 'Take bus instead of car' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.swap).toBeDefined();
    expect(db.swapAction.create).toHaveBeenCalled();
    expect(db.goal.create).toHaveBeenCalled();
  });

  it('should complete a swap and award points', async () => {
    (db.user.findUnique as any).mockResolvedValue({ id: 'user-123', ecoPoints: 100 });
    (db.swapAction.update as any).mockResolvedValue({ id: 'swap-1', status: 'completed' });
    (db.achievement.findUnique as any).mockResolvedValue(null);
    (db.userAchievement.findMany as any).mockResolvedValue([]);
    (db.user.update as any).mockResolvedValue({ ecoPoints: 200 });
    (db.ecosystemState.findUnique as any).mockResolvedValue({ healthScore: 50, weatherState: 'clear' });

    const req = new NextRequest('http://localhost/api/user/swap', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-123', action: 'complete', swapId: 'swap-1' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.swap.status).toBe('completed');
    expect(db.swapAction.update).toHaveBeenCalledWith({
      where: { id: 'swap-1' },
      data: { status: 'completed' }
    });
    expect(db.user.update).toHaveBeenCalled();
  });

  it('should abandon a swap', async () => {
    (db.user.findUnique as any).mockResolvedValue({ id: 'user-123' });
    (db.swapAction.update as any).mockResolvedValue({ id: 'swap-1', status: 'abandoned' });

    const req = new NextRequest('http://localhost/api/user/swap', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-123', action: 'abandon', swapId: 'swap-1' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.swap.status).toBe('abandoned');
  });
});
