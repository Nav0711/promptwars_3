import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../route';
import { db } from '@/lib/db';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  USER_SELECT: { id: true, email: true, name: true, ecoPoints: true, currentStreak: true, longestStreak: true, baselineFootprintKgCO2e: true, baselineProfile: true },
  db: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    ecosystemState: {
      findUnique: vi.fn(),
    },
    achievement: {
      findMany: vi.fn(),
    },
    userAchievement: {
      findMany: vi.fn(),
    }
  }
}));

describe('User API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('returns null if user not found', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
      
      const req = new NextRequest('http://localhost:3000/api/user?email=test@test.com');
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.user).toBeNull();
    });

    it('returns user data successfully', async () => {
      const mockUser = { id: 'u1', email: 'test@test.com' };
      const mockEcosystem = { healthScore: 100 };
      const mockAchievements = [{ achievement: { id: 'a1' } }];
      
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(mockUser as any);
      vi.mocked(db.ecosystemState.findUnique).mockResolvedValueOnce(mockEcosystem as any);
      vi.mocked(db.userAchievement.findMany).mockResolvedValueOnce(mockAchievements as any);
      
      const req = new NextRequest('http://localhost:3000/api/user?email=test@test.com');
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.user).toEqual(mockUser);
      expect(data.ecosystem).toEqual(mockEcosystem);
      expect(data.achievements).toEqual(mockAchievements);
    });

    it('handles internal errors', async () => {
      vi.mocked(db.user.findUnique).mockRejectedValueOnce(new Error('DB Error'));
      const req = new NextRequest('http://localhost:3000/api/user?email=test@test.com');
      const res = await GET(req);
      const data = await res.json();
      
      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST', () => {
    it('returns error if missing fields', async () => {
      const req = new NextRequest('http://localhost:3000/api/user', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' })
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('updates user successfully', async () => {
      const mockUser = { id: 'u1', email: 'test@test.com', baselineFootprintKgCO2e: 0 };
      const updatedUser = { ...mockUser, baselineFootprintKgCO2e: 100 };
      
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(mockUser as any);
      vi.mocked(db.user.update).mockResolvedValueOnce(updatedUser as any);
      
      const req = new NextRequest('http://localhost:3000/api/user', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', name: 'Test', baselineProfile: {}, baselineFootprintKgCO2e: 100 })
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.user).toEqual(updatedUser);
    });

    it('creates new user successfully', async () => {
      const newUser = { id: 'u1', email: 'test@test.com', name: 'Test' };
      const newEcosystem = { healthScore: 50 };
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(db.user.create).mockResolvedValueOnce(newUser as any);
      vi.mocked(db.ecosystemState.findUnique).mockResolvedValueOnce(newEcosystem as any);

      const req = new NextRequest('http://localhost:3000/api/user', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', name: 'Test', baselineProfile: {}, baselineFootprintKgCO2e: 100 })
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.user).toEqual(newUser);
      expect(data.ecosystem).toEqual(newEcosystem);
      expect(data.isNew).toBe(true);
    });

    it('handles internal errors on update', async () => {
      vi.mocked(db.user.findUnique).mockRejectedValueOnce(new Error('DB Error'));
      const req = new NextRequest('http://localhost:3000/api/user', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', name: 'Test', baselineProfile: {} })
      });
      const res = await POST(req);
      const data = await res.json();
      
      expect(res.status).toBe(500);
      expect(data.error).toBe('Internal Server Error');
    });
  });
});
