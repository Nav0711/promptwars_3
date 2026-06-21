import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';

vi.mock('@/lib/db', () => ({
  db: {
    leaderboardEntry: {
      findMany: vi.fn(),
    },
    isMock: false, // Set to false to avoid fs read/write in tests
  },
}));

vi.mock('fs', () => {
  const m = {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
  };
  return {
    ...m,
    default: m,
  };
});

describe('GET /api/leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return leaderboard entries successfully', async () => {
    const mockEntries = [
      { id: '1', userId: 'user-1', weeklyPoints: 500 },
      { id: '2', userId: 'user-2', weeklyPoints: 400 },
    ];
    (db.leaderboardEntry.findMany as any).mockResolvedValue(mockEntries);

    const req = new NextRequest('http://localhost/api/leaderboard');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockEntries);
    expect(db.leaderboardEntry.findMany).toHaveBeenCalledWith({
      orderBy: { weeklyPoints: 'desc' },
    });
  });

  it('should handle internal errors gracefully', async () => {
    (db.leaderboardEntry.findMany as any).mockRejectedValue(new Error('DB Error'));

    const req = new NextRequest('http://localhost/api/leaderboard');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });

  it('should seed mock competitors if db.isMock is true and file exists', async () => {
    db.isMock = true;
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockReturnValue(JSON.stringify({ users: [], ecosystemStates: [], leaderboardEntries: [] }));
    (fs.writeFileSync as any).mockImplementation(() => {});
    
    (db.leaderboardEntry.findMany as any).mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/leaderboard');
    await GET(req);

    expect(fs.readFileSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });
});
