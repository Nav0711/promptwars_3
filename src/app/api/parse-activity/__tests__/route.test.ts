import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { VertexAI } from '@google-cloud/vertexai';

// Mock the Vertex AI SDK
vi.mock('@google-cloud/vertexai', () => {
  const sendMessageMock = vi.fn();
  
  return {
    VertexAI: class {
      getGenerativeModel() {
        return {
          startChat: vi.fn().mockReturnValue({
            sendMessage: sendMessageMock,
          }),
        };
      }
    },
    HarmCategory: {},
    HarmBlockThreshold: {},
    SchemaType: {},
    // Expose the mock so we can change its implementation per test
    __sendMessageMock: sendMessageMock,
  };
});

describe('POST /api/parse-activity', () => {
  let sendMessageMock: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Retrieve the mock from the mocked module
    const vertexAIModule = await import('@google-cloud/vertexai') as any;
    sendMessageMock = vertexAIModule.__sendMessageMock;
  });

  it('should return 400 if rawText is missing', async () => {
    const req = new NextRequest('http://localhost/api/parse-activity', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    
    const json = await res.json();
    expect(json.error).toBe('rawText is required');
  });

  it('should return parsed activities using Vertex AI successfully', async () => {
    // Setup the mock to return a successful LLM response (in Markdown block to test the cleanup logic)
    const mockLLMResponse = `\`\`\`json
{
  "activities": [
    {
      "category": "food",
      "subcategory": "beef",
      "description": "Beef burger",
      "quantity": 1,
      "unit": "meal",
      "confidence": 0.95
    }
  ],
  "clarificationNeeded": false,
  "clarificationQuestion": null
}
\`\`\``;

    sendMessageMock.mockResolvedValue({
      response: {
        candidates: [{ content: { parts: [{ text: mockLLMResponse }] } }]
      }
    });

    const req = new NextRequest('http://localhost/api/parse-activity', {
      method: 'POST',
      body: JSON.stringify({ rawText: 'I ate a beef burger' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.usedFallback).toBe(false);
    expect(json.activities).toHaveLength(1);
    expect(json.activities[0].category).toBe('food');
    // Verify that co2e calculation was applied
    expect(json.activities[0].co2eKg).toBeGreaterThan(0);
    expect(json.totalCo2eKg).toBeGreaterThan(0);
  });

  it('should fallback to rule-based parser if Vertex AI throws/times out', async () => {
    // Simulate LLM timeout/error
    sendMessageMock.mockRejectedValue(new Error('Vertex AI Timeout'));

    const req = new NextRequest('http://localhost/api/parse-activity', {
      method: 'POST',
      body: JSON.stringify({ rawText: 'I drove 15 km' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200); // Route should still succeed using fallback

    const json = await res.json();
    // Validate fallback behavior
    expect(json.usedFallback).toBe(true);
    expect(json.activities).toHaveLength(1);
    expect(json.activities[0].category).toBe('transport');
    expect(json.activities[0].quantity).toBe(15);
    expect(json.activities[0].unit).toBe('km');
  });

  it('should return clarification details if fallback fails to parse', async () => {
    sendMessageMock.mockRejectedValue(new Error('LLM Failure'));

    const req = new NextRequest('http://localhost/api/parse-activity', {
      method: 'POST',
      body: JSON.stringify({ rawText: 'hello world' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.usedFallback).toBe(true);
    expect(json.clarificationNeeded).toBe(true);
    expect(json.activities).toHaveLength(0);
    expect(json.clarificationQuestion).toBeTruthy();
  });
});
