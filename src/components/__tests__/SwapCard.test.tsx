import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SwapCard from '../SwapCard';
import { useApp } from '../AppContext';

vi.mock('../AppContext', () => ({
  useApp: vi.fn(),
}));

describe('SwapCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders loading state initially if fetching', async () => {
    (useApp as any).mockReturnValue({
      user: { id: 'user-1' },
      swaps: [],
      acceptSwap: vi.fn(),
      completeSwap: vi.fn(),
    });

    let resolveFetch: any;
    (global.fetch as any).mockImplementation(() => new Promise(res => {
      resolveFetch = res;
    }));

    render(<SwapCard />);
    
    expect(screen.getByText('Finding your swap...')).toBeInTheDocument();
    
    // Resolve the promise to clean up
    resolveFetch({ ok: true, json: async () => ({}) });
  });

  it('renders current active swap', () => {
    (useApp as any).mockReturnValue({
      user: { id: 'user-1' },
      swaps: [{ id: 'swap-1', status: 'active', swapTitle: 'Test Active Swap' }],
      acceptSwap: vi.fn(),
      completeSwap: vi.fn(),
    });

    render(<SwapCard />);
    
    expect(screen.getByText('Swap in Progress')).toBeInTheDocument();
    expect(screen.getByText('Test Active Swap')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mark swap as completed/i })).toBeInTheDocument();
  });

  it('calls completeSwap when completed button is clicked', async () => {
    const mockCompleteSwap = vi.fn();
    (useApp as any).mockReturnValue({
      user: { id: 'user-1' },
      swaps: [{ id: 'swap-1', status: 'active', swapTitle: 'Test Active Swap' }],
      acceptSwap: vi.fn(),
      completeSwap: mockCompleteSwap,
    });

    render(<SwapCard />);
    
    const completeBtn = screen.getByRole('button', { name: /Mark swap as completed/i });
    fireEvent.click(completeBtn);

    expect(mockCompleteSwap).toHaveBeenCalledWith('swap-1');
  });

  it('renders new suggestion and allows accepting', async () => {
    const mockAcceptSwap = vi.fn();
    (useApp as any).mockReturnValue({
      user: { id: 'user-1' },
      swaps: [],
      acceptSwap: mockAcceptSwap,
      completeSwap: vi.fn(),
    });

    const mockSuggestion = {
      swapTitle: 'New Swap Suggestion',
      targetCategory: 'food'
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockSuggestion,
    });

    render(<SwapCard />);
    
    await waitFor(() => {
      expect(screen.getByText('New Swap Suggestion')).toBeInTheDocument();
    });

    const acceptBtn = screen.getByRole('button', { name: /Accept swap challenge/i });
    expect(acceptBtn).toBeInTheDocument();
    
    fireEvent.click(acceptBtn);
    expect(mockAcceptSwap).toHaveBeenCalledWith(mockSuggestion);
  });
});
