import React from 'react';
import { render, screen } from '@testing-library/react';
import CategoryPieChart from '../CategoryPieChart';
import { describe, it, expect, vi } from 'vitest';

// We must mock recharts because it uses ResizeObserver and complex DOM elements
// that sometimes fail in jsdom without full mocking.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data }: any) => (
    <div data-testid="pie">
      {data.map((item: any, idx: number) => (
        <span key={idx} data-testid={`pie-slice-${item.name}`}>
          {item.name}: {item.value}
        </span>
      ))}
    </div>
  ),
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />
}));

describe('CategoryPieChart', () => {
  it('renders the chart with provided data', () => {
    const data = [
      { name: 'Transport', value: 45, color: '#ff0000' },
      { name: 'Food', value: 30, color: '#00ff00' },
    ];

    render(<CategoryPieChart data={data} />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toBeInTheDocument();
    expect(screen.getByText('Transport: 45')).toBeInTheDocument();
    expect(screen.getByText('Food: 30')).toBeInTheDocument();
  });

  it('renders correctly when data is empty', () => {
    render(<CategoryPieChart data={[]} />);
    expect(screen.getByTestId('pie')).toBeEmptyDOMElement();
  });
});
