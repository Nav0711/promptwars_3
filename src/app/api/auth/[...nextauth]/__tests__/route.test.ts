import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authOptions } from '../route';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}));

describe('NextAuth Configuration', () => {
  let authorize: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Extract the authorize function from the CredentialsProvider
    authorize = authOptions.providers[0].options.authorize;
  });

  it('should return null if missing credentials', async () => {
    const result = await authorize({}, null);
    expect(result).toBeNull();
  });

  it('should return null if user is not found', async () => {
    (db.user.findUnique as any).mockResolvedValue(null);
    const result = await authorize({ email: 'test@example.com', password: 'password123' }, null);
    expect(result).toBeNull();
  });

  it('should return null if user has no password', async () => {
    (db.user.findUnique as any).mockResolvedValue({ id: '1', email: 'test@example.com' }); // no password
    const result = await authorize({ email: 'test@example.com', password: 'password123' }, null);
    expect(result).toBeNull();
  });

  it('should return null if password does not match', async () => {
    (db.user.findUnique as any).mockResolvedValue({ id: '1', email: 'test@example.com', password: 'hashed' });
    (bcrypt.compare as any).mockResolvedValue(false);
    const result = await authorize({ email: 'test@example.com', password: 'wrong' }, null);
    expect(result).toBeNull();
  });

  it('should return user object if password matches', async () => {
    (db.user.findUnique as any).mockResolvedValue({ id: '1', name: 'Test User', email: 'test@example.com', password: 'hashed' });
    (bcrypt.compare as any).mockResolvedValue(true);
    
    const result = await authorize({ email: 'test@example.com', password: 'password123' }, null);
    expect(result).toEqual({
      id: '1',
      name: 'Test User',
      email: 'test@example.com'
    });
  });

  it('should handle internal errors gracefully', async () => {
    (db.user.findUnique as any).mockRejectedValue(new Error('DB Error'));
    const result = await authorize({ email: 'test@example.com', password: 'password123' }, null);
    expect(result).toBeNull();
  });
});
