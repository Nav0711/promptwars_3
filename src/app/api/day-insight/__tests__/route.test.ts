import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { generateDayInsightAI } from '@/lib/ai';

vi.mock('@/lib/ai', () => ({
  generateDayInsightAI: vi.fn(),
}));

describe('POST /api/day-insight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if totalCo2eKg is missing', async () => {
    const req = new NextRequest('http://localhost/api/day-insight', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('totalCo2eKg is required');
  });

  it('should return AI insight if generateDayInsightAI succeeds', async () => {
    (generateDayInsightAI as any).mockResolvedValue({
      insightText: 'AI insight',
      encouragementText: 'AI encouragement'
    });

    const req = new NextRequest('http://localhost/api/day-insight', {
      method: 'POST',
      body: JSON.stringify({ totalCo2eKg: 10, topCategory: 'food' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      insightText: 'AI insight',
      encouragementText: 'AI encouragement',
      source: 'gemini'
    });
  });

  it('should fallback to template if generateDayInsightAI fails/returns null', async () => {
    (generateDayInsightAI as any).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/day-insight', {
      method: 'POST',
      body: JSON.stringify({ totalCo2eKg: 10, topCategory: 'food', topCategoryKg: 8 }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.source).toBe('fallback');
    expect(data.insightText).toContain('food');
    expect(data.insightText).toContain('80%');
  });

  it('should handle internal errors gracefully', async () => {
    (generateDayInsightAI as any).mockRejectedValue(new Error('AI Error'));

    const req = new NextRequest('http://localhost/api/day-insight', {
      method: 'POST',
      body: JSON.stringify({ totalCo2eKg: 10 }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});
