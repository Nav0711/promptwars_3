import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { updateEcosystemAndPoints } from '@/lib/ecosystem';

vi.mock('@/lib/db', () => ({
  db: {
    carbonLog: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    ecosystemState: {
      findUnique: vi.fn(),
    },
    userAchievement: {
      findMany: vi.fn(),
    },
  },
  USER_SELECT: {},
}));

vi.mock('@/lib/ecosystem', () => ({
  updateEcosystemAndPoints: vi.fn(),
}));

describe('GET /api/user/log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if userId is missing', async () => {
    const req = new NextRequest('http://localhost/api/user/log');
    const response = await GET(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('userId is required');
  });

  it('should return logs for a valid userId', async () => {
    const mockLogs = [{ id: '1', totalCo2eKg: 5 }];
    (db.carbonLog.findMany as any).mockResolvedValue(mockLogs);

    const req = new NextRequest('http://localhost/api/user/log?userId=user-123');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockLogs);
    expect(db.carbonLog.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      orderBy: { activityDate: 'desc' }
    });
  });
});

describe('POST /api/user/log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if missing required fields', async () => {
    const req = new NextRequest('http://localhost/api/user/log', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-123' }), // missing parsedActivities
    });
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('should return 400 if parsedActivities is invalid JSON string', async () => {
    const req = new NextRequest('http://localhost/api/user/log', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-123', parsedActivities: 'invalid-json' }),
    });
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid parsedActivities JSON');
  });

  it('should log activity and update ecosystem', async () => {
    const mockActivities = [{ category: 'food', co2eKg: 2 }];
    (db.carbonLog.create as any).mockResolvedValue({ id: 'log-1' });
    (updateEcosystemAndPoints as any).mockResolvedValue({
      pointsEarned: 10,
      achievementsUnlocked: [],
      healthScore: 60,
      weatherState: 'clear'
    });
    (db.user.findUnique as any).mockResolvedValue({ id: 'user-123' });
    (db.ecosystemState.findUnique as any).mockResolvedValue({ healthScore: 60 });
    (db.userAchievement.findMany as any).mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/user/log', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-123', parsedActivities: mockActivities }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.log).toEqual({ id: 'log-1' });
    expect(updateEcosystemAndPoints).toHaveBeenCalledWith('user-123', { food: 2 }, true);
  });
});
