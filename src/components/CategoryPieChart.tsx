'use client';
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip } from 'recharts';

interface CategoryPieChartProps {
  data: { name: string; value: number; color: string }[];
}

export default React.memo(function CategoryPieChart({ data }: CategoryPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
          {data.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
        </Pie>
        <ChartTooltip content={({ active, payload }: any) => active && payload?.length ? (
          <div className="glass-panel p-2.5 rounded-xl text-xs" style={{ border: '1px solid var(--border-default)' }}>
            <p style={{ color: 'var(--text-primary)' }}>{payload[0].name}: <strong>{payload[0].value} kg</strong></p>
          </div>
        ) : null} />
      </PieChart>
    </ResponsiveContainer>
  );
});
