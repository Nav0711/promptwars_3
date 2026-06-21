import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SwapCheckIn from '../SwapCheckIn';

describe('SwapCheckIn', () => {
  const mockSwap = {
    id: 'swap-1',
    swapTitle: 'Take the bus',
    analogyText: 'Save 10kg',
    targetCategory: 'transport',
    acceptedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders correctly with swap details', () => {
    render(<SwapCheckIn swap={mockSwap} userId="user-1" onComplete={vi.fn()} />);
    
    expect(screen.getByText('7-Day Check-In')).toBeInTheDocument();
    expect(screen.getByText('Take the bus')).toBeInTheDocument();
    expect(screen.getByText('Save 10kg')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mark swap as completed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Abandon swap/i })).toBeInTheDocument();
  });

  it('handles completed checkin successfully', async () => {
    const mockOnComplete = vi.fn();
    (global.fetch as any).mockResolvedValue({ ok: true });

    render(<SwapCheckIn swap={mockSwap} userId="user-1" onComplete={mockOnComplete} />);
    
    const completeBtn = screen.getByRole('button', { name: /Mark swap as completed/i });
    fireEvent.click(completeBtn);

    expect(global.fetch).toHaveBeenCalledWith('/api/swap/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swapId: 'swap-1', userId: 'user-1', result: 'completed' })
    });

    // It should transition to resolved state
    await waitFor(() => {
      expect(screen.getByText('Logged! New challenge coming soon.')).toBeInTheDocument();
    });

    // The timeout takes 1400ms, let's use vitest fake timers or just wait longer.
    // Given the component tests run without fake timers currently, we can mock setTimeout.
  });

  it('handles abandoned checkin successfully', async () => {
    const mockOnComplete = vi.fn();
    (global.fetch as any).mockResolvedValue({ ok: true });

    render(<SwapCheckIn swap={mockSwap} userId="user-1" onComplete={mockOnComplete} />);
    
    const abandonBtn = screen.getByRole('button', { name: /Abandon swap/i });
    fireEvent.click(abandonBtn);

    expect(global.fetch).toHaveBeenCalledWith('/api/swap/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swapId: 'swap-1', userId: 'user-1', result: 'abandoned' })
    });

    await waitFor(() => {
      expect(screen.getByText('Logged! New challenge coming soon.')).toBeInTheDocument();
    });
  });

  it('handles fetch error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    render(<SwapCheckIn swap={mockSwap} userId="user-1" onComplete={vi.fn()} />);
    
    const completeBtn = screen.getByRole('button', { name: /Mark swap as completed/i });
    fireEvent.click(completeBtn);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    });
    consoleSpy.mockRestore();
  });
});
