'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScrollText, ChevronDown, ChevronUp, Search, Filter,
  Calendar, Leaf, TrendingUp, TrendingDown, Trash2, AlertCircle
} from 'lucide-react';

interface LogsTabProps {
  logs: any[];
}

const CATEGORY_ICONS: Record<string, string> = {
  transport: '', food: '', electricity: '',
  water: '', waste: '', shopping: ''
};

const CATEGORIES = ['all', 'transport', 'food', 'electricity', 'water', 'waste', 'shopping'];

export default function LogsTab({ logs }: LogsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  // Process logs with parsed activities
  const processedLogs = useMemo(() => {
    return logs.map(log => {
      let activities: any[] = [];
      try {
        activities = typeof log.parsedActivities === 'string'
          ? JSON.parse(log.parsedActivities)
          : log.parsedActivities || [];
      } catch { activities = []; }

      const topCategory = activities.reduce((top: any, act: any) => {
        return (!top || act.co2eKg > top.co2eKg) ? act : top;
      }, null)?.category || 'unknown';

      return { ...log, activities, topCategory };
    });
  }, [logs]);

  // Filter & search
  const filtered = useMemo(() => {
    let result = processedLogs;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.rawInputText?.toLowerCase().includes(q) ||
        l.activities?.some((a: any) => a.description?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q))
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter(l => l.activities?.some((a: any) => a.category === categoryFilter));
    }
    result = [...result].sort((a, b) => {
      const da = new Date(a.activityDate).getTime();
      const db = new Date(b.activityDate).getTime();
      return sortOrder === 'desc' ? db - da : da - db;
    });
    return result;
  }, [processedLogs, search, categoryFilter, sortOrder]);

  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMore = paginated.length < filtered.length;

  // Summary stats
  const stats = useMemo(() => {
    const total = processedLogs.reduce((s, l) => s + (l.totalCo2eKg || 0), 0);
    const thisWeek = processedLogs.filter(l => {
      const d = new Date(l.activityDate);
      return Date.now() - d.getTime() < 7 * 24 * 3600 * 1000;
    }).reduce((s, l) => s + (l.totalCo2eKg || 0), 0);

    const categoryCounts: Record<string, number> = {};
    processedLogs.forEach(l => {
      l.activities?.forEach((a: any) => {
        categoryCounts[a.category] = (categoryCounts[a.category] || 0) + (a.co2eKg || 0);
      });
    });
    const topCat = Object.entries(categoryCounts).sort(([,a],[,b]) => b - a)[0];

    return { total, thisWeek, topCat, count: processedLogs.length };
  }, [processedLogs]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <ScrollText className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} />
            Activity Log
          </h2>
          <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
            {stats.count} total entries · All your carbon footprint records
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total CO2e', value: `${stats.total.toFixed(1)} kg`, sub: 'all time', icon: '', trend: null },
          { label: 'This Week', value: `${stats.thisWeek.toFixed(1)} kg`, sub: '7 days', icon: '', trend: null },
          { label: 'Top Category', value: stats.topCat ? `${CATEGORY_ICONS[stats.topCat[0]] || ''} ${stats.topCat[0]}` : '—', sub: stats.topCat ? `${stats.topCat[1].toFixed(1)} kg` : 'no data', icon: null, trend: null }
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="stat-card"
          >
            <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="font-heading font-bold text-base capitalize" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
            <p className="text-[10px] mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search activities, categories..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9"
          />
        </div>

        {/* Sort toggle */}
        <button
          onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
          className="btn-ghost flex items-center gap-2 shrink-0"
          style={{ padding: '0.625rem 1rem' }}
        >
          {sortOrder === 'desc' ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
          <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
        </button>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3 h-3 shrink-0" style={{ color: 'var(--text-muted)' }} />
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setCategoryFilter(cat); setPage(1); }}
            className="px-3 py-1 rounded-full text-[11px] font-semibold font-heading transition-all cursor-pointer"
            style={{
              background: categoryFilter === cat ? 'var(--accent-blue)' : 'var(--bg-elevated)',
              color: categoryFilter === cat ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${categoryFilter === cat ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
              transform: categoryFilter === cat ? 'scale(1.05)' : 'scale(1)'
            }}
          >
            {cat === 'all' ? 'All' : `${CATEGORY_ICONS[cat] || ''} ${cat}`}
          </button>
        ))}
      </div>

      {/* Log list */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center gap-3 text-center"
        >
          <AlertCircle className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
          <p className="font-heading font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {search || categoryFilter !== 'all' ? 'No logs match your filters' : 'No activity logs yet'}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {search ? 'Try a different search term' : 'Open the AI Logger to add your first activity!'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {paginated.map((log, idx) => {
              const isExpanded = expandedId === log.id;
              const dateStr = formatDate(log.activityDate);
              return (
                <motion.div
                  key={log.id || idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  className="log-item"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  <div className="flex items-center gap-3">
                    {/* Category icon */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                      {CATEGORY_ICONS[log.topCategory] || ''}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-semibold text-sm truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>
                          {log.rawInputText
                            ? log.rawInputText.length > 55
                              ? log.rawInputText.slice(0, 55) + '…'
                              : log.rawInputText
                            : `${log.activities?.length || 0} activit${log.activities?.length === 1 ? 'y' : 'ies'}`
                          }
                        </span>
                        {log.activities?.slice(0, 2).map((a: any, i: number) => (
                          <span key={i} className={`badge badge-${a.category}`}>
                            {a.category}
                          </span>
                        ))}
                        {log.activities?.length > 2 && (
                          <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                            +{log.activities.length - 2} more
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] font-mono flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Calendar className="w-2.5 h-2.5" /> {dateStr}
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                          {log.activities?.length || 0} activities
                        </span>
                      </div>
                    </div>

                    {/* CO2e */}
                    <div className="text-right shrink-0">
                      <p className="font-heading font-bold text-sm" style={{
                        color: (log.totalCo2eKg || 0) > 10 ? 'var(--accent-rose)' : (log.totalCo2eKg || 0) > 5 ? 'var(--accent-amber)' : 'var(--accent-green)'
                      }}>
                        {(log.totalCo2eKg || 0).toFixed(2)} kg
                      </p>
                      <p className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>CO2e</p>
                    </div>

                    {/* Expand chevron */}
                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                    </motion.div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                          {log.activities?.length > 0 ? (
                            log.activities.map((act: any, i: number) => (
                              <div key={i} className="flex items-center gap-3 py-1.5 px-3 rounded-lg"
                                style={{ background: 'var(--bg-elevated)' }}>
                                <span className="text-base">{CATEGORY_ICONS[act.category] || ''}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                                    {act.description}
                                  </p>
                                  <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                                    {act.quantity} {act.unit} · <span className={`badge badge-${act.category}`}>{act.category}</span>
                                  </p>
                                </div>
                                <span className="font-mono font-bold text-xs" style={{ color: 'var(--accent-blue)' }}>
                                  {act.co2eKg} kg
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>No activity details</p>
                          )}

                          {/* Log footer */}
                          <div className="flex items-center justify-between pt-1 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                            <span>Logged at {new Date(log.loggedAt || log.activityDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="font-bold" style={{ color: 'var(--accent-blue)' }}>
                              Total: {(log.totalCo2eKg || 0).toFixed(3)} kg CO2e
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Load more */}
          {hasMore && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setPage(p => p + 1)}
              className="w-full py-3 rounded-xl text-sm font-semibold font-heading transition-all"
              style={{
                border: '1px dashed var(--border-default)',
                color: 'var(--text-secondary)',
                background: 'transparent'
              }}
              whileHover={{ borderStyle: 'solid', background: 'var(--brand-glow)' }}
            >
              Load more ({filtered.length - paginated.length} remaining)
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}
