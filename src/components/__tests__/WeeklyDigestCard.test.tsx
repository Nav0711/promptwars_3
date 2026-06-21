import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import WeeklyDigestCard from '../WeeklyDigestCard';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock fetch
const globalFetch = global.fetch;

describe('WeeklyDigestCard', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
  });

  afterAll(() => {
    global.fetch = globalFetch;
  });

  it('renders nothing if not forced and not Monday', () => {
    // Mock date to a Tuesday
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-10-24T12:00:00Z')); // 2023-10-24 is Tuesday
    
    const { container } = render(<WeeklyDigestCard userId="u1" forceShow={false} />);
    expect(container).toBeEmptyDOMElement();
    
    vi.useRealTimers();
  });

  it('renders loading state initially when forced to show', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<WeeklyDigestCard userId="u1" forceShow={true} />);
    expect(screen.getByText('EcoBot is writing your weekly summary...')).toBeInTheDocument();
  });

  it('renders digest content after fetching successfully', async () => {
    const mockDigest = {
      summaryText: 'Great week!',
      badgeText: 'Top 10%',
      weeklyTotalKg: 15.5,
      reductionPercent: 25,
      bestCategory: 'transport',
      categoryTotals: { transport: 10, food: 5.5 },
      source: 'gemini'
    };

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockDigest,
    });

    render(<WeeklyDigestCard userId="u1" forceShow={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Great week!')).toBeInTheDocument();
    });
    expect(screen.getByText(/15\.5\s*kg/i)).toBeInTheDocument();
    expect(screen.getByText(/-25%/i)).toBeInTheDocument();
    expect(screen.getByText('Top 10%')).toBeInTheDocument();
  });

  it('can be dismissed', async () => {
    const mockDigest = {
      summaryText: 'Great week!',
      badgeText: null,
      weeklyTotalKg: 15.5,
      reductionPercent: null,
      bestCategory: null,
      categoryTotals: {},
      source: 'fallback'
    };

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockDigest,
    });

    const { container } = render(<WeeklyDigestCard userId="u1" forceShow={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Great week!')).toBeInTheDocument();
    });

    // Find and click the close button (the only button in the header)
    const closeButton = container.querySelector('button');
    expect(closeButton).toBeInTheDocument();
    await userEvent.click(closeButton!);

    // Should be removed from DOM
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });
});
