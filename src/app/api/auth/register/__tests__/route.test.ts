import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}));

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if required fields are missing', async () => {
    const req = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name, email, and password are required');
  });

  it('should return 409 if user already exists', async () => {
    (db.user.findUnique as any).mockResolvedValue({ id: 'existing-id' });

    const req = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: 'password123' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('User with this email already exists');
  });

  it('should successfully create a new user and return 201', async () => {
    (db.user.findUnique as any).mockResolvedValue(null);
    (bcrypt.hash as any).mockResolvedValue('hashed-password-123');
    (db.user.create as any).mockResolvedValue({
      id: 'new-user-id',
      name: 'Test User',
      email: 'test@example.com',
    });

    const req = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: 'password123' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.user).toEqual({
      id: 'new-user-id',
      name: 'Test User',
      email: 'test@example.com',
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(db.user.create).toHaveBeenCalled();
  });

  it('should return 500 on internal server error', async () => {
    (db.user.findUnique as any).mockRejectedValue(new Error('Database error'));

    const req = new NextRequest('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: 'password123' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal Server Error');
  });
});
