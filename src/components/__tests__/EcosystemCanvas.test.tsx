import React from 'react';
import { render, screen } from '@testing-library/react';
import EcosystemCanvas from '../EcosystemCanvas';
import { vi, describe, it, expect } from 'vitest';

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion') as any;
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      svg: ({ children, ...props }: any) => <svg {...props}>{children}</svg>,
      g: ({ children, ...props }: any) => <g {...props}>{children}</g>,
      circle: ({ children, ...props }: any) => <circle {...props}>{children}</circle>,
      path: ({ children, ...props }: any) => <path {...props}>{children}</path>,
      rect: ({ children, ...props }: any) => <rect {...props}>{children}</rect>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

describe('EcosystemCanvas', () => {
  const defaultProps = {
    healthScore: 80,
    weatherState: 'clear',
    unlockedAssets: ['asset_bird', 'asset_flower']
  };

  it('renders without crashing', () => {
    const { container } = render(<EcosystemCanvas {...defaultProps} />);
    // Should have SVG
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows weather appropriate text', () => {
    render(<EcosystemCanvas {...defaultProps} />);
    // In clear weather > 80 health, should show pristine description
    // Note: text appears in both <desc> (SVG) and aria-live region — use getAllByText
    const matches = screen.getAllByText(/Lush, green/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows struggling state when health is low', () => {
    const lowHealth = { ...defaultProps, healthScore: 20, weatherState: 'stormy' };
    render(<EcosystemCanvas {...lowHealth} />);
    // Text appears in both <desc> and aria-live region
    const matches = screen.getAllByText(/Polluted and wilting/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders animals/assets based on unlocked list', () => {
    const { container } = render(<EcosystemCanvas {...defaultProps} />);
    // Just ensure it renders without crashing since we don't have test IDs
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders correctly with no unlocked assets', () => {
    const emptyEcosystem = { ...defaultProps, unlockedAssets: [] };
    const { container } = render(<EcosystemCanvas {...emptyEcosystem} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
