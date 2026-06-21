import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AppProvider, useApp } from '../AppContext';
import { useSession } from 'next-auth/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: any) => <>{children}</>,
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn()
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/'
}));

// A test component to consume the context
const TestComponent = () => {
  const { user, ecosystem, loading, refreshAll, logActivity } = useApp();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <div data-testid="user-id">{user?.id}</div>
      <div data-testid="user-email">{user?.email}</div>
      <div data-testid="eco-score">{ecosystem?.healthScore}</div>
      <button onClick={() => refreshAll()}>Refresh</button>
      <button onClick={() => logActivity('test')}>Log Activity</button>
    </div>
  );
};

describe('AppContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders loading state initially', () => {
    vi.mocked(useSession).mockReturnValue({ data: null, status: 'loading' } as any);
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles unauthenticated state', () => {
    vi.mocked(useSession).mockReturnValue({ data: null, status: 'unauthenticated' } as any);
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getByTestId('user-id')).toBeEmptyDOMElement();
  });

  it('fetches user data when authenticated', async () => {
    vi.mocked(useSession).mockReturnValue({ 
      data: { user: { email: 'test@example.com' } }, 
      status: 'authenticated' 
    } as any);

    // Mock fetches
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/user?')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: { id: 'u1', email: 'test@example.com', baselineFootprintKgCO2e: 100 },
            ecosystem: { healthScore: 75 }
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('u1');
      expect(screen.getByTestId('eco-score')).toHaveTextContent('75');
    });
  });

  it('logActivity works', async () => {
    vi.mocked(useSession).mockReturnValue({ 
      data: { user: { email: 'test@example.com' } }, 
      status: 'authenticated' 
    } as any);

    // Mock fetches
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/user?')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: { id: 'u1', email: 'test@example.com', baselineFootprintKgCO2e: 100 },
            ecosystem: { healthScore: 75 }
          })
        });
      }
      if (url.includes('/api/parse-activity')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            activities: [{ action: 'test', category: 'overall' }]
          })
        });
      }
      if (url.includes('/api/user/log')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            update: {
              user: { id: 'u1', email: 'test@example.com', ecoPoints: 10 },
              ecosystem: { healthScore: 80 }
            }
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user-id')).toHaveTextContent('u1'));

    await userEvent.click(screen.getByText('Log Activity'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/parse-activity', expect.any(Object));
      expect(global.fetch).toHaveBeenCalledWith('/api/user/log', expect.any(Object));
    });
  });
});
