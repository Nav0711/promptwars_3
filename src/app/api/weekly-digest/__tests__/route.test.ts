import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { generateWeeklyDigestAI } from '@/lib/ai';

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    carbonLog: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/ai', () => ({
  generateWeeklyDigestAI: vi.fn(),
}));

describe('POST /api/weekly-digest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if userId is missing', async () => {
    const req = new NextRequest('http://localhost/api/weekly-digest', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('userId is required');
  });

  it('should return 404 if user is not found', async () => {
    (db.user.findUnique as any).mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/weekly-digest', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-123' }),
    });
    const response = await POST(req);
    expect(response.status).toBe(404);
  });

  it('should return AI digest if generateWeeklyDigestAI succeeds', async () => {
    (db.user.findUnique as any).mockResolvedValue({ id: 'user-123', name: 'Test User' });
    (db.carbonLog.findMany as any).mockResolvedValue([
      { activityDate: new Date().toISOString(), totalCo2eKg: 10, parsedActivities: [{ category: 'transport', co2eKg: 10 }] }
    ]);
    (generateWeeklyDigestAI as any).mockResolvedValue({
      summaryText: 'AI summary',
      badgeText: 'AI badge'
    });

    const req = new NextRequest('http://localhost/api/weekly-digest', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-123' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.source).toBe('gemini');
    expect(data.summaryText).toBe('AI summary');
  });

  it('should fallback to template if generateWeeklyDigestAI fails/returns null', async () => {
    (db.user.findUnique as any).mockResolvedValue({ id: 'user-123', name: 'Test User' });
    (db.carbonLog.findMany as any).mockResolvedValue([
      { activityDate: new Date().toISOString(), totalCo2eKg: 10, parsedActivities: [{ category: 'transport', co2eKg: 10 }] }
    ]);
    (generateWeeklyDigestAI as any).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/weekly-digest', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-123' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.source).toBe('fallback');
    expect(data.weeklyTotalKg).toBe(10);
  });
});
