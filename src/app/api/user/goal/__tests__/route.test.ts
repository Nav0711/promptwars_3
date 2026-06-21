import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    goal: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('GET /api/user/goal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if userId is missing', async () => {
    const req = new NextRequest('http://localhost/api/user/goal');
    const response = await GET(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('userId is required');
  });

  it('should return goals for a valid userId', async () => {
    const mockGoals = [{ id: '1', targetValue: 5 }];
    (db.goal.findMany as any).mockResolvedValue(mockGoals);

    const req = new NextRequest('http://localhost/api/user/goal?userId=user-123');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockGoals);
    expect(db.goal.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' }
    });
  });
});

describe('POST /api/user/goal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if missing required fields', async () => {
    const req = new NextRequest('http://localhost/api/user/goal', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-123' }), // missing type and targetValue
    });
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields');
  });

  it('should create a goal successfully', async () => {
    const mockGoal = { id: 'goal-1', status: 'active' };
    (db.goal.create as any).mockResolvedValue(mockGoal);

    const req = new NextRequest('http://localhost/api/user/goal', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-123', type: 'category_specific', targetValue: 10, category: 'food' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockGoal);
    expect(db.goal.create).toHaveBeenCalled();
  });
});
