import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WeeklyChart from '../WeeklyChart';

vi.mock('recharts', async () => {
  const OriginalModule = await vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    BarChart: ({ children, onClick }: any) => <div data-testid="bar-chart" onClick={() => onClick?.({ activePayload: [{ payload: { date: 'Jan 1', co2e: 10, topCategory: 'food', topVal: 5, topPercent: 50 } }] })}>{children}</div>,
    Bar: () => <div data-testid="bar" />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    Tooltip: () => <div />,
    Cell: () => <div />,
  };
});

describe('WeeklyChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  const mockLogs = [
    {
      activityDate: new Date().toISOString(),
      totalCo2eKg: 10.5,
      parsedActivities: [{ category: 'food', co2eKg: 10.5 }]
    }
  ];

  it('renders correctly with logs', async () => {
    (global.fetch as any).mockResolvedValue({
      json: async () => ({
        insightText: 'Mock insight',
        encouragementText: 'Mock encouragement',
        source: 'gemini'
      })
    });

    render(<WeeklyChart logs={mockLogs} />);
    
    expect(screen.getByText('14-Day Trend')).toBeInTheDocument();
    
    // It should automatically fetch insight for the most recent day with logs
    await waitFor(() => {
      expect(screen.getByText('Mock insight')).toBeInTheDocument();
      expect(screen.getByText('Mock encouragement')).toBeInTheDocument();
    });
  });

  it('handles fetch insight error gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    render(<WeeklyChart logs={mockLogs} />);
    
    await waitFor(() => {
      expect(screen.getByText(/food was your top source/)).toBeInTheDocument(); // fallback template
    });
  });
});
