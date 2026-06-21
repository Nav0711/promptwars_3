import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ChatDrawer from '../ChatDrawer';
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import userEvent from '@testing-library/user-event';
import { AppProvider } from '../AppContext';
import { ThemeProvider } from '../ThemeProvider';

// Mock next/navigation and next-auth for AppProvider
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'u1', email: 'test@example.com' } }, status: 'authenticated' }),
  SessionProvider: ({ children }: any) => <>{children}</>,
}));

// Mock framer-motion layout
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

const globalFetch = global.fetch;

describe('ChatDrawer', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/parse-activity')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            activities: [{
              category: 'transport',
              activityType: 'driving',
              quantity: 40,
              unit: 'km',
              co2e: 10
            }],
            totalCo2eKg: 10,
            usedFallback: false,
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          user: { id: 'u1', name: 'Test User', ecoPoints: 100, currentStreak: 5 },
          ecosystem: {},
          achievements: []
        }),
      });
    });
  });

  afterAll(() => {
    global.fetch = globalFetch;
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <AppProvider>
        <ThemeProvider>
          {ui}
        </ThemeProvider>
      </AppProvider>
    );
  };

  it('renders correctly when open', () => {
    const onClose = vi.fn();
    renderWithProviders(<ChatDrawer isOpen={true} onClose={onClose} />);

    expect(screen.getByText('EcoBot Logger')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tell me about your day...')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    const onClose = vi.fn();
    renderWithProviders(<ChatDrawer isOpen={false} onClose={onClose} />);

    expect(screen.queryByText('EcoBot Logger')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    renderWithProviders(<ChatDrawer isOpen={true} onClose={onClose} />);

    const closeBtn = screen.getByLabelText('Close chat');
    await userEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('allows typing in the message input', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(<ChatDrawer isOpen={true} onClose={onClose} />);

    const input = screen.getByPlaceholderText('Tell me about your day...');
    await user.type(input, 'Drove 40km');

    expect(input).toHaveValue('Drove 40km');
  });
});
