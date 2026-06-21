import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { db } from '@/lib/db';

// Mock Prisma DB
vi.mock('@/lib/db', () => ({
  db: {
    user: { findUnique: vi.fn() },
    carbonLog: { findMany: vi.fn() },
    swapAction: { findMany: vi.fn() },
  }
}));

// Mock the AI functions from @/lib/ai
vi.mock('@/lib/ai', () => ({
  generateSwapAI: vi.fn(),
  embedText: vi.fn(),
  cosineSimilarity: vi.fn(),
}));

import { generateSwapAI, embedText, cosineSimilarity } from '@/lib/ai';

describe('POST /api/generate-swap', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default DB mocks
    (db.user.findUnique as any).mockResolvedValue({
      id: 'user1',
      baselineProfile: '{}',
    });

    (db.carbonLog.findMany as any).mockResolvedValue([
      {
        parsedActivities: JSON.stringify([
          { category: 'transport', co2eKg: 10 }
        ])
      }
    ]);

    // Default: no abandoned swaps
    (db.swapAction.findMany as any).mockResolvedValue([]);

    // Default: embedText returns null (dedup skipped)
    (embedText as any).mockResolvedValue(null);
  });

  it('should return 400 if userId is missing', async () => {
    const req = new NextRequest('http://localhost/api/generate-swap', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe('userId is required');
  });

  it('should return 404 if user is not found', async () => {
    (db.user.findUnique as any).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/generate-swap', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('should return 500 on database read error', async () => {
    (db.carbonLog.findMany as any).mockRejectedValue(new Error('DB Connection Failed'));

    const req = new NextRequest('http://localhost/api/generate-swap', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe('Internal server error');
    expect(json.details).toBe('DB Connection Failed');
  });

  it('should return a generated swap successfully', async () => {
    const mockSwap = {
      swapTitle: 'Take the bus instead of driving',
      analogyText: 'Like saving 5 trees',
      reasonText: 'Buses are better.',
      estimatedSavingsKgCO2eWeekly: 5.0,
      targetCategory: 'transport'
    };

    (generateSwapAI as any).mockResolvedValue(mockSwap);

    const req = new NextRequest('http://localhost/api/generate-swap', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.swapTitle).toBe(mockSwap.swapTitle);
    expect(json.targetCategory).toBe(mockSwap.targetCategory);
    expect(generateSwapAI).toHaveBeenCalledTimes(1);
  });

  it('should fallback to STATIC_SWAP_LIBRARY if AI returns null', async () => {
    // AI returns null → triggers fallback
    (generateSwapAI as any).mockResolvedValue(null);

    // The logs state transport is the highest category (10 kg)
    const req = new NextRequest('http://localhost/api/generate-swap', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200); // Should still succeed due to fallback

    const json = await res.json();
    expect(json.swapTitle).toBeTruthy();
    expect(json.targetCategory).toBe('transport'); // Falls back to transport matching
    expect(json.estimatedSavingsKgCO2eWeekly).toBe(4.5); // Static library transport savings
  });

  it('should skip deduplication when embedText returns null', async () => {
    const mockSwap = {
      swapTitle: 'Take the bus instead of driving',
      analogyText: 'Like saving 5 trees',
      reasonText: 'Buses are better.',
      estimatedSavingsKgCO2eWeekly: 5.0,
      targetCategory: 'transport'
    };

    // Provide an abandoned swap
    (db.swapAction.findMany as any).mockResolvedValue([
      { targetCategory: 'transport', embeddingVector: JSON.stringify([0.9, 0.1]) }
    ]);

    (generateSwapAI as any).mockResolvedValue(mockSwap);
    // embedText returns null → dedup skipped
    (embedText as any).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/generate-swap', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.swapTitle).toBe(mockSwap.swapTitle);
    // cosineSimilarity should NOT be called because embedText returned null
    expect(cosineSimilarity).not.toHaveBeenCalled();
  });

  it('should retry and return second swap when first is a duplicate', async () => {
    const mockSwap1 = {
      swapTitle: 'Take the bus instead of driving',
      analogyText: 'Like saving 5 trees',
      reasonText: 'Buses are better.',
      estimatedSavingsKgCO2eWeekly: 5.0,
      targetCategory: 'transport'
    };

    const mockSwap2 = {
      swapTitle: 'Carpool with a colleague',
      analogyText: 'Like saving 4 trees',
      reasonText: 'Carpooling is good.',
      estimatedSavingsKgCO2eWeekly: 4.0,
      targetCategory: 'transport'
    };

    // Provide an abandoned swap with an embedding vector
    (db.swapAction.findMany as any).mockResolvedValue([
      { targetCategory: 'transport', embeddingVector: JSON.stringify([0.9, 0.1]) }
    ]);

    (generateSwapAI as any)
      .mockResolvedValueOnce(mockSwap1)
      .mockResolvedValueOnce(mockSwap2);

    // embedText returns actual vectors so dedup runs
    (embedText as any)
      .mockResolvedValueOnce([0.95, 0.05])  // First candidate embedding
      .mockResolvedValueOnce([0.1, 0.9])    // Second candidate embedding (for isDuplicate)
      .mockResolvedValueOnce([0.1, 0.9]);   // Final embedding for storing

    // First call: very similar to abandoned swap → duplicate
    // Second call: not similar → not a duplicate
    (cosineSimilarity as any)
      .mockReturnValueOnce(0.99)  // > 0.85 → duplicate
      .mockReturnValueOnce(0.1);  // < 0.85 → not a duplicate

    const req = new NextRequest('http://localhost/api/generate-swap', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    // The route should have returned mockSwap2 (non-duplicate)
    expect(json.swapTitle).toBe(mockSwap2.swapTitle);
    expect(generateSwapAI).toHaveBeenCalledTimes(2);
    // embedText called: 1 (first isDuplicate check) + 1 (second isDuplicate check) + 1 (final store) = 3
    expect(embedText).toHaveBeenCalledTimes(3);
  });
});
