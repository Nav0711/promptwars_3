import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    leaderboardEntry: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    isMock: false,
  },
}));

describe('GET /api/group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if groupId is missing', async () => {
    const req = new NextRequest('http://localhost/api/group');
    const response = await GET(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('groupId is required');
  });

  it('should return group members successfully', async () => {
    const mockEntries = [
      { id: '1', userId: 'user-1', groupId: 'GROUP_A', weeklyPoints: 500 },
      { id: '2', userId: 'user-2', groupId: 'GROUP_B', weeklyPoints: 400 },
    ];
    (db.leaderboardEntry.findMany as any).mockResolvedValue(mockEntries);

    const req = new NextRequest('http://localhost/api/group?groupId=GROUP_A');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.groupId).toBe('GROUP_A');
    expect(data.members).toHaveLength(1);
    expect(data.members[0].groupId).toBe('GROUP_A');
  });
});

describe('POST /api/group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if userId is missing', async () => {
    const req = new NextRequest('http://localhost/api/group', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('userId is required');
  });

  it('should return 400 if action is join but inviteCode is missing', async () => {
    const req = new NextRequest('http://localhost/api/group?action=join', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-1' }),
    });
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('inviteCode is required to join a group');
  });

  it('should join a group successfully', async () => {
    (db.user.findUnique as any).mockResolvedValue({ id: 'user-1', ecoPoints: 100 });
    (db.leaderboardEntry.upsert as any).mockResolvedValue({});

    const req = new NextRequest('http://localhost/api/group?action=join', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-1', inviteCode: 'GROUP_XYZ' }),
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.groupId).toBe('GROUP_XYZ');
    expect(db.leaderboardEntry.upsert).toHaveBeenCalled();
  });

  it('should create a new group successfully', async () => {
    (db.user.findUnique as any).mockResolvedValue({ id: 'user-1', ecoPoints: 100 });
    (db.leaderboardEntry.upsert as any).mockResolvedValue({});

    const req = new NextRequest('http://localhost/api/group', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-1' }),
    });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.inviteCode).toBeDefined();
    expect(db.leaderboardEntry.upsert).toHaveBeenCalled();
  });

  it('should return 404 if user not found when creating', async () => {
    (db.user.findUnique as any).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/group', {
      method: 'POST',
      body: JSON.stringify({ userId: 'invalid-user' }),
    });
    const response = await POST(req);
    
    expect(response.status).toBe(404);
  });
});
