'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Info, Loader2, Sparkles, Bot, TrendingUp } from 'lucide-react';

interface WeeklyChartProps {
  logs: any[];
}

interface DayInsight {
  insightText: string;
  encouragementText: string;
  source: 'gemini' | 'fallback';
}

export default function WeeklyChart({ logs }: WeeklyChartProps) {
  const [selectedDay, setSelectedDay] = useState<any | null>(null);
  const [dayInsight, setDayInsight] = useState<DayInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  const chartData = useMemo(() => {
    const dataMap: Record<string, { total: number; categories: Record<string, number>; rawLogs: any[] }> = {};
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const date = new Date(); date.setDate(now.getDate() - i);
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dataMap[label] = { total: 0, categories: {}, rawLogs: [] };
    }
    logs.forEach(log => {
      const label = new Date(log.activityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dataMap[label]) return;
      dataMap[label].total += log.totalCo2eKg || 0;
      dataMap[label].rawLogs.push(log);
      let parsed: any[] = [];
      try { parsed = typeof log.parsedActivities === 'string' ? JSON.parse(log.parsedActivities) : log.parsedActivities || []; } catch {}
      if (Array.isArray(parsed)) {
        parsed.forEach((act: any) => {
          const cat = act.category || 'other';
          dataMap[label].categories[cat] = (dataMap[label].categories[cat] || 0) + (act.co2eKg || 0);
        });
      }
    });
    return Object.entries(dataMap).map(([date, val]) => {
      let topCategory = 'None', topVal = 0;
      Object.entries(val.categories).forEach(([cat, v]) => { if (v > topVal) { topVal = v; topCategory = cat; } });
      return {
        date, co2e: parseFloat(val.total.toFixed(2)),
        topCategory, topVal: parseFloat(topVal.toFixed(2)),
        topPercent: val.total > 0 ? Math.round(topVal / val.total * 100) : 0,
        categories: val.categories
      };
    });
  }, [logs]);

  useEffect(() => {
    if (chartData.length > 0 && !selectedDay) {
      const activeDays = chartData.filter(d => d.co2e > 0);
      const defaultDay = activeDays.length > 0 ? activeDays[activeDays.length - 1] : chartData[chartData.length - 1];
      setSelectedDay(defaultDay);
      fetchInsight(defaultDay);
    }
  }, [chartData]);

  const fetchInsight = useCallback(async (day: any) => {
    setLoadingInsight(true);
    setDayInsight(null);
    try {
      const res = await fetch('/api/day-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalCo2eKg: day.co2e, topCategory: day.topCategory, topCategoryKg: day.topVal, topCategoryPercent: day.topPercent, date: day.date })
      });
      setDayInsight(await res.json());
    } catch {
      setDayInsight({ insightText: day.co2e === 0 ? 'No activity logged.' : `${day.topCategory} was your top source at ${day.topPercent}% of today's footprint.`, encouragementText: 'Every small swap counts — keep going!', source: 'fallback' });
    } finally {
      setLoadingInsight(false);
    }
  }, []);

  const handleBarClick = (state: any) => {
    if (state?.activePayload?.length > 0) {
      const day = state.activePayload[0].payload;
      setSelectedDay(day);
      fetchInsight(day);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-semibold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
            14-Day Trend
          </h2>
          <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>Tap a bar for an AI-narrated insight</p>
        </div>
        {selectedDay && (
          <div className="text-right">
            <p className="text-xs font-mono font-bold" style={{ color: 'var(--accent-blue)' }}>{selectedDay.date}</p>
            <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{selectedDay.co2e} kg CO2e</p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} onClick={handleBarClick} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(56,189,248,0.05)', radius: 4 }}
              content={({ active, payload }) => active && payload?.length ? (
                <div className="glass-panel p-2.5 rounded-xl text-xs" style={{ border: '1px solid var(--border-default)' }}>
                  <p className="font-mono font-bold" style={{ color: 'var(--text-muted)' }}>{payload[0].payload.date}</p>
                  <p className="font-bold mt-0.5" style={{ color: 'var(--accent-blue)' }}>{payload[0].value} kg CO2e</p>
                </div>
              ) : null}
            />
            <Bar dataKey="co2e" radius={[3, 3, 0, 0]} cursor="pointer">
              {chartData.map((entry, index) => (
                <Cell key={index}
                  fill={selectedDay?.date === entry.date ? 'var(--accent-blue)' : entry.co2e === 0 ? 'var(--bg-elevated)' : 'rgba(56,189,248,0.45)'}
                  opacity={selectedDay?.date === entry.date ? 1 : 0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insight panel */}
      <AnimatePresence mode="wait">
        {selectedDay && (
          <motion.div key={selectedDay.date} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
            className="rounded-xl p-3.5 space-y-2"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--text-muted)' }}>{selectedDay.date}</span>
              {dayInsight?.source === 'gemini' && (
                <div className="flex items-center gap-1 text-[9px] font-mono" style={{ color: 'var(--accent-blue)' }}>
                  <Bot className="w-2.5 h-2.5" /> AI insight
                </div>
              )}
            </div>
            {loadingInsight ? (
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--accent-blue)' }} />
                EcoBot is thinking...
              </div>
            ) : dayInsight ? (
              <div className="space-y-1.5">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{dayInsight.insightText}</p>
                <p className="text-xs leading-relaxed flex items-start gap-1.5" style={{ color: 'var(--accent-green)' }}>
                  <Sparkles className="w-3 h-3 shrink-0 mt-0.5" />
                  {dayInsight.encouragementText}
                </p>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
