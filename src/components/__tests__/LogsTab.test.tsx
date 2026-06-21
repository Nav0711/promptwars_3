import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LogsTab from '../LogsTab';

describe('LogsTab', () => {
  const mockLogs = [
    {
      id: 'log-1',
      activityDate: new Date().toISOString(),
      rawInputText: 'Ate a burger and drove 5 miles',
      totalCo2eKg: 15.5,
      parsedActivities: [
        { category: 'food', description: 'Beef burger', co2eKg: 10 },
        { category: 'transport', description: 'Drove car', co2eKg: 5.5 }
      ]
    },
    {
      id: 'log-2',
      activityDate: new Date(Date.now() - 86400000).toISOString(), // yesterday
      rawInputText: 'Took a long shower',
      totalCo2eKg: 2,
      parsedActivities: [
        { category: 'water', description: 'Long shower', co2eKg: 2 }
      ]
    }
  ];

  it('renders correctly and shows stats', () => {
    render(<LogsTab logs={mockLogs} />);
    
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
    expect(screen.getByText('2 total entries · All your carbon footprint records')).toBeInTheDocument();
    
    // Stats
    expect(screen.getAllByText('17.5 kg').length).toBeGreaterThan(0); // Total CO2e
    expect(screen.getAllByText(/food/i).length).toBeGreaterThan(0); // Top category
  });

  it('filters logs by search query', async () => {
    render(<LogsTab logs={mockLogs} />);
    
    const searchInput = screen.getByPlaceholderText(/Search activities, categories/i);
    fireEvent.change(searchInput, { target: { value: 'burger' } });

    // Should only show log-1
    await waitFor(() => {
      expect(screen.getByText(/Ate a burger/)).toBeInTheDocument();
      expect(screen.queryByText(/Took a long shower/)).not.toBeInTheDocument();
    });
  });

  it('filters logs by category', async () => {
    render(<LogsTab logs={mockLogs} />);
    
    const waterFilterBtn = screen.getByRole('button', { name: /Filter by water/i });
    fireEvent.click(waterFilterBtn);

    // Should only show log-2
    await waitFor(() => {
      expect(screen.queryByText(/Ate a burger/)).not.toBeInTheDocument();
      expect(screen.getByText(/Took a long shower/)).toBeInTheDocument();
    });
  });

  it('sorts logs when toggle is clicked', () => {
    render(<LogsTab logs={mockLogs} />);
    
    // By default, newest first. So log-1 should be before log-2.
    // Let's click the sort toggle to sort oldest first
    const sortBtn = screen.getByRole('button', { name: /Sort oldest first/i });
    fireEvent.click(sortBtn);

    // After sorting oldest first, the text of the button changes
    expect(screen.getByText('Oldest')).toBeInTheDocument();
  });

  it('shows empty state if no logs match', () => {
    render(<LogsTab logs={mockLogs} />);
    
    const searchInput = screen.getByPlaceholderText(/Search activities, categories/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent stuff' } });

    expect(screen.getByText('No logs match your filters')).toBeInTheDocument();
  });

  it('expands a log entry when clicked', () => {
    render(<LogsTab logs={mockLogs} />);
    
    // Find the log entry button (e.g. "Ate a burger and drove 5 miles")
    const logBtn = screen.getByText('Ate a burger and drove 5 miles');
    fireEvent.click(logBtn);
    
    // It should reveal the parsed activities
    expect(screen.getByText('Beef burger')).toBeInTheDocument();
    expect(screen.getByText('Drove car')).toBeInTheDocument();
  });

  it('renders load more button if there are many logs', () => {
    const manyLogs = Array.from({ length: 25 }, (_, i) => ({
      id: `log-${i}`,
      activityDate: new Date().toISOString(),
      rawInputText: `Test Log ${i}`,
      totalCo2eKg: 10,
      parsedActivities: []
    }));
    
    render(<LogsTab logs={manyLogs} />);
    
    const loadMoreBtn = screen.getByRole('button', { name: /Load more/i });
    expect(loadMoreBtn).toBeInTheDocument();
    
    fireEvent.click(loadMoreBtn);
    // Should now show more
  });
});
