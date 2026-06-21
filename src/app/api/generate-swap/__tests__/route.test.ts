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

// Mock the Vertex AI SDK
vi.mock('@google-cloud/vertexai', () => {
  const generateContentMock = vi.fn();
  
  return {
    VertexAI: class {
      getGenerativeModel() {
        return {
          generateContent: generateContentMock,
        };
      }
    },
    HarmCategory: {},
    HarmBlockThreshold: {},
    SchemaType: {},
    __generateContentMock: generateContentMock,
  };
});

describe('POST /api/generate-swap', () => {
  let generateContentMock: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Retrieve the mock from the mocked module
    const vertexAIModule = await import('@google-cloud/vertexai') as any;
    generateContentMock = vertexAIModule.__generateContentMock;

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

    (db.swapAction.findMany as any).mockResolvedValue([]);
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
    // Simulate DB failure
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

  it('should return a generated swap successfully using Vertex AI', async () => {
    const mockSwap = {
      swapTitle: 'Take the bus instead of driving',
      analogyText: 'Like saving 5 trees',
      reasonText: 'Buses are better.',
      estimatedSavingsKgCO2eWeekly: 5.0,
      targetCategory: 'transport'
    };

    generateContentMock.mockResolvedValue({
      response: {
        candidates: [{ content: { parts: [{ text: JSON.stringify(mockSwap) }] } }]
      }
    });

    const req = new NextRequest('http://localhost/api/generate-swap', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.swapTitle).toBe(mockSwap.swapTitle);
    expect(json.targetCategory).toBe(mockSwap.targetCategory);
  });

  it('should fallback to STATIC_SWAP_LIBRARY if Vertex AI times out/fails', async () => {
    // Simulate LLM Timeout
    generateContentMock.mockRejectedValue(new Error('Vertex AI Generation Timeout'));

    // The logs state transport is the highest category (10 kg)
    const req = new NextRequest('http://localhost/api/generate-swap', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200); // Should still succeed due to fallback

    const json = await res.json();
    // Verify that the static library fallback was used and matched the highest category
    expect(json.swapTitle).toBeTruthy();
    expect(json.targetCategory).toBe('transport'); // Falls back to transport matching
    expect(json.estimatedSavingsKgCO2eWeekly).toBe(4.5); // Static library transport savings
  });
});
