import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Sidebar from '../Sidebar';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { AppProvider } from '../AppContext';
import { ThemeProvider } from '../ThemeProvider';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'u1', email: 'test@example.com' } }, status: 'authenticated' }),
  SessionProvider: ({ children }: any) => <>{children}</>,
}));

// Mock next/link
vi.mock('next/link', () => {
  return {
    default: ({ children, href, ...rest }: any) => (
      <a href={href} {...rest}>{children}</a>
    ),
  };
});

// Mock framer-motion layout
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock AppContext fetch
const globalFetch = global.fetch;

describe('Sidebar', () => {
  const defaultProps = {
    activeTab: 'ecosystem',
    setActiveTab: vi.fn(),
    onOpenChat: vi.fn(),
  };

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ 
        user: { id: 'u1', name: 'Test User', ecoPoints: 100, currentStreak: 5 },
        ecosystem: {},
        achievements: []
      }),
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

  it('renders correctly with default active tab', async () => {
    renderWithProviders(<Sidebar {...defaultProps} />);
    
    expect(screen.getByText('EcoLoop')).toBeInTheDocument();
    expect(screen.getByText('Ecosystem')).toBeInTheDocument();
    expect(screen.getByText('Swaps')).toBeInTheDocument();
    expect(screen.getByText('Activity Logs')).toBeInTheDocument();
    expect(screen.getByText('Goals & Stats')).toBeInTheDocument();
    expect(screen.getByText('Achievements')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('calls setActiveTab when a navigation item is clicked', async () => {
    renderWithProviders(<Sidebar {...defaultProps} />);
    
    const swapsButton = screen.getByRole('button', { name: 'Swaps' });
    await userEvent.click(swapsButton);
    
    expect(defaultProps.setActiveTab).toHaveBeenCalledWith('swaps');
  });

  it('calls onOpenChat when Log Activity is clicked', async () => {
    renderWithProviders(<Sidebar {...defaultProps} />);
    
    const logButton = screen.getByRole('button', { name: 'Log Activity' });
    await userEvent.click(logButton);
    
    expect(defaultProps.onOpenChat).toHaveBeenCalled();
  });

  it('shows tooltip on hover', async () => {
    renderWithProviders(<Sidebar {...defaultProps} />);
    
    const swapsButton = screen.getByRole('button', { name: 'Swaps' });
    fireEvent.mouseEnter(swapsButton);
    
    await waitFor(() => {
      expect(screen.getByText('Carbon challenges')).toBeInTheDocument();
    });
    
    fireEvent.mouseLeave(swapsButton);
  });

  it('renders profile link and handles hover', async () => {
    renderWithProviders(<Sidebar {...defaultProps} />);
    
    const profileLink = screen.getByRole('link', { name: 'View Profile' });
    expect(profileLink).toBeInTheDocument();
    
    // Simulate hover styles
    fireEvent.mouseEnter(profileLink);
    expect(profileLink.style.background).toBe('var(--brand-glow)');
    
    fireEvent.mouseLeave(profileLink);
    expect(profileLink.style.background).toBe('transparent');
  });

  it('toggles theme correctly', async () => {
    renderWithProviders(<Sidebar {...defaultProps} />);
    
    const themeButton = screen.getByRole('button', { name: /Switch to (Dark|Light) Mode/ });
    
    // Hover over theme button
    fireEvent.mouseEnter(themeButton);
    expect(themeButton.style.background).toBe('var(--brand-glow)');
    
    fireEvent.mouseLeave(themeButton);
    expect(themeButton.style.background).toBe('transparent');
    
    // Click to toggle
    await userEvent.click(themeButton);
  });
});
