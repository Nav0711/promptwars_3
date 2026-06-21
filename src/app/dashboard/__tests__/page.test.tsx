import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '../page';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { AppProvider } from '@/components/AppContext';

vi.mock('next/dynamic', () => ({
  default: (cb: any) => {
    const Component = React.lazy(cb);
    return (props: any) => (
      <React.Suspense fallback={<div data-testid="suspense-fallback" />}>
        <Component {...props} />
      </React.Suspense>
    );
  }
}));

// Mock ResizeObserver
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock components
vi.mock('@/components/EcosystemCanvas', () => ({ default: () => <div data-testid="ecosystem" /> }));
vi.mock('@/components/WeeklyChart', () => ({ default: () => <div data-testid="weekly-chart" /> }));
vi.mock('@/components/SwapCard', () => ({ default: () => <div data-testid="swap-card" /> }));
vi.mock('@/components/ChatDrawer', () => ({ default: () => <div data-testid="chat-drawer" /> }));
vi.mock('@/components/WeeklyDigestCard', () => ({ default: () => <div data-testid="weekly-digest" /> }));
vi.mock('@/components/SwapCheckIn', () => ({ default: () => <div data-testid="swap-check-in" /> }));
vi.mock('@/components/LogsTab', () => ({ default: () => <div data-testid="logs-tab" /> }));
vi.mock('@/components/CategoryPieChart', () => ({ default: () => <div data-testid="pie-chart" /> }));
vi.mock('@/components/Sidebar', () => ({ default: ({ setActiveTab }: any) => 
  <div data-testid="sidebar">
    <button onClick={() => setActiveTab('ecosystem')}>Overview</button>
    <button onClick={() => setActiveTab('logs')}>Logs</button>
    <button onClick={() => setActiveTab('swaps')}>Swaps</button>
  </div> 
}));

// Mock useApp context
const mockUseApp = vi.fn();
vi.mock('@/components/AppContext', () => ({
  useApp: () => mockUseApp(),
  AppProvider: ({ children }: any) => <>{children}</>
}));

describe('Dashboard Page', () => {
  const defaultAppContext = {
    user: { id: 'u1', name: 'Test User', ecoPoints: 100, currentStreak: 5 },
    ecosystem: { healthScore: 80, weatherState: 'clear' },
    logs: [],
    swaps: [],
    goals: [],
    loading: false,
    logActivity: vi.fn(),
    refreshAll: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseApp.mockReturnValue(defaultAppContext);
  });

  it('renders loading state', () => {
    mockUseApp.mockReturnValue({ ...defaultAppContext, loading: true });
    render(<DashboardPage />);
    expect(screen.getByText(/Loading your ecosystem.../i)).toBeInTheDocument();
  });

  it('renders overview tab by default', async () => {
    render(<DashboardPage />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('ecosystem')).toBeInTheDocument();
      expect(screen.getByTestId('weekly-chart')).toBeInTheDocument();
    });
  });

  it('switches to logs tab', async () => {
    render(<DashboardPage />);
    await userEvent.click(screen.getAllByText('Logs')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('logs-tab')).toBeInTheDocument();
    });
  });

  it('switches to swaps tab', async () => {
    render(<DashboardPage />);
    await userEvent.click(screen.getAllByText('Swaps')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('swap-card')).toBeInTheDocument();
    });
  });
});
