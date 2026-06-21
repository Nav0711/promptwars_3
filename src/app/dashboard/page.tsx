'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/components/AppContext';
import Sidebar from '@/components/Sidebar';
import { useTheme } from '@/components/ThemeProvider';
import dynamic from 'next/dynamic';

const EcosystemCanvas = dynamic(() => import('@/components/EcosystemCanvas'), { ssr: false, loading: () => <div className="animate-pulse bg-slate-800/20 w-full h-full rounded-2xl" /> });
const WeeklyChart = dynamic(() => import('@/components/WeeklyChart'), { ssr: false, loading: () => <div className="animate-pulse bg-slate-800/20 w-full h-[200px] rounded-2xl" /> });
const SwapCard = dynamic(() => import('@/components/SwapCard'), { ssr: false });
const ChatDrawer = dynamic(() => import('@/components/ChatDrawer'), { ssr: false });
const WeeklyDigestCard = dynamic(() => import('@/components/WeeklyDigestCard'), { ssr: false });
const SwapCheckIn = dynamic(() => import('@/components/SwapCheckIn'), { ssr: false });
const LogsTab = dynamic(() => import('@/components/LogsTab'), { ssr: false });
const CategoryPieChart = dynamic(() => import('@/components/CategoryPieChart'), { ssr: false });

import {
  Home as HomeIcon, ArrowRightLeft, BarChart3, Trophy,
  MessageSquarePlus, Leaf, Award, Users, Target, Link2,
  Copy, CheckCheck, Info, Flame, Sun, Moon, ScrollText,
  TrendingDown, TrendingUp, Zap, RotateCcw
} from 'lucide-react';

type Tab = 'ecosystem' | 'swaps' | 'logs' | 'goals' | 'social';

const MOBILE_TABS = [
  { id: 'ecosystem', label: 'Home',       icon: HomeIcon },
  { id: 'swaps',     label: 'Swaps',      icon: ArrowRightLeft },
  { id: 'logs',      label: 'Logs',       icon: ScrollText },
  { id: 'goals',     label: 'Goals',      icon: BarChart3 },
  { id: 'social',    label: 'Social',     icon: Trophy },
];

export default function Dashboard() {
  const { user, ecosystem, logs, goals, swaps, achievements, addGoal, loading } = useApp();
  const { isDark, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<Tab>('ecosystem');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [groupLeaderboard, setGroupLeaderboard] = useState<any[]>([]);
  const [userGroupId, setUserGroupId] = useState<string | null>(null);
  const [groupInviteInput, setGroupInviteInput] = useState('');
  const [groupActionLoading, setGroupActionLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [goalLoading, setGoalLoading] = useState(false);
  const [goalType] = useState('weekly_reduction');
  const [goalCategory, setGoalCategory] = useState('overall');
  const [goalReduction, setGoalReduction] = useState(10);
  const [socialSubTab, setSocialSubTab] = useState<'global' | 'group'>('global');

  const handleReset = useCallback(() => {
    if (confirm('Reset your profile and start onboarding again?')) {
      localStorage.clear();
      window.location.href = '/onboarding';
    }
  }, []);

  // Fetch group leaderboard automatically if user has a groupId
  useEffect(() => {
    if (!user || !user.groupId) return;
    setUserGroupId(user.groupId);
    fetch(`/api/group?groupId=${user.groupId}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: any) => {
        if (d && d.members) setGroupLeaderboard(d.members);
      })
      .catch(() => {});
  }, [user, user?.groupId]);

  // Check for swaps needing 7-day check-in
  const pendingCheckIn = useMemo(() => {
    if (!swaps) return null;
    return swaps.find((s: any) => {
      if (s.status !== 'active') return false;
      const daysSince = Math.floor((Date.now() - new Date(s.acceptedAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysSince >= 7;
    }) || null;
  }, [swaps]);

  // Fetch leaderboard
  useEffect(() => {
    if (!user) return;
    fetch('/api/leaderboard').then(r => r.ok ? r.json() : []).then(setLeaderboard).catch(() => {});
  }, [user, user?.ecoPoints]);

  // Today's emissions
  const todayEmissions = useMemo(() => {
    const today = new Date().toDateString();
    return logs.filter(l => new Date(l.activityDate).toDateString() === today)
      .reduce((acc, cur) => acc + (cur.totalCo2eKg || 0), 0);
  }, [logs]);

  // Category data for pie chart
  const categoryData = useMemo(() => {
    const totals: Record<string, number> = { transport: 0, food: 0, electricity: 0, water: 0, waste: 0, shopping: 0 };
    logs.forEach(log => {
      let parsed: any[] = [];
      try { parsed = typeof log.parsedActivities === 'string' ? JSON.parse(log.parsedActivities) : log.parsedActivities || []; } catch { parsed = []; }
      if (Array.isArray(parsed)) {
        parsed.forEach((act: any) => { const cat = act.category?.toLowerCase(); if (cat in totals) totals[cat] += act.co2eKg || 0; });
      }
    });
    const COLORS: Record<string, string> = {
      transport: '#60a5fa', food: '#fb923c', electricity: '#facc15',
      water: '#22d3ee', waste: '#f87171', shopping: '#c084fc'
    };
    return Object.entries(totals).filter(([, val]) => val > 0).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: parseFloat(value.toFixed(1)),
      color: COLORS[name] || '#38bdf8'
    }));
  }, [logs]);

  const userRank = useMemo(() => {
    if (!user || leaderboard.length === 0) return '-';
    return leaderboard.find(e => e.userId === user.id)?.rank || '-';
  }, [user, leaderboard]);

  const handleCreateGoal = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setGoalLoading(true);
    const targetValue = Math.round(user.baselineFootprintKgCO2e * (1 - goalReduction / 100) / 4);
    await addGoal({ type: goalType, targetValue, category: goalCategory === 'overall' ? null : goalCategory, startDate: new Date().toISOString(), endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() });
    setGoalLoading(false);
  }, [user, goalType, goalCategory, goalReduction, addGoal]);

  const initials = useMemo(() => user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'EC', [user?.name]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg-base)' }}>
        <div className="w-10 h-10 rounded-2xl animate-spin" style={{ border: '3px solid var(--border-subtle)', borderTopColor: 'var(--accent-blue)' }} />
        <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Loading your ecosystem...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row gap-4 md:gap-6 p-4 md:p-6" style={{ background: 'var(--bg-base)' }}>

      {/* ── Desktop Sidebar ── */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onOpenChat={() => setIsChatOpen(true)} />

      {/* ── Main content ── */}
      <main id="main-content" className="flex-1 flex flex-col gap-5 min-w-0 pb-20 md:pb-0">
        {/* Fix 4: Visually-hidden h1 for screen reader navigation */}
        <h1 className="sr-only">EcoLoop Dashboard</h1>

        {/* Top bar (mobile: logo + controls; desktop: greeting bar) */}
        <header className="glass-panel rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid var(--border-default)' }}>
              <Leaf className="w-3.5 h-3.5" style={{ color: 'var(--accent-blue)' }} />
            </div>
            <span className="font-heading font-bold text-sm" style={{ color: 'var(--text-primary)' }}>EcoLoop</span>
          </div>

          {/* Greeting (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-2 h-2 rounded-full status-dot online" />
            <p className="text-sm font-heading" style={{ color: 'var(--text-secondary)' }}>
              Hey, <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{user?.name || 'Eco Warrior'}</span>
            </p>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Streak pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Flame className="w-3.5 h-3.5" />
              {user?.currentStreak || 0}d
            </div>
            {/* Points pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(56,189,248,0.1)', color: 'var(--accent-blue)', border: '1px solid var(--border-default)' }}>
              <Award className="w-3.5 h-3.5" />
              {user?.ecoPoints || 0} pts
            </div>
            {/* Mobile theme toggle — Fix 2: aria-label */}
            <button
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl md:hidden ripple transition-all"
              style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
            >
              <motion.div animate={{ rotate: isDark ? 0 : 180 }} transition={{ type: 'spring' }}>
                {isDark ? <Moon className="w-4 h-4" aria-hidden="true" /> : <Sun className="w-4 h-4" aria-hidden="true" />}
              </motion.div>
            </button>
            {/* Developer Reset Button */}
            <button
              onClick={handleReset}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold hover:text-red-400 hover:border-red-400/30 transition-all ripple cursor-pointer"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}
              title="Reset onboarding data"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
            {/* Mobile Log CTA — Fix 2: descriptive aria-label */}
            <button
              onClick={() => setIsChatOpen(true)}
              aria-label="Open EcoBot Logger to log an activity"
              className="flex md:hidden items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-heading font-bold ripple"
              style={{ background: 'var(--accent-blue)', color: '#fff' }}
            >
              <Zap className="w-3.5 h-3.5" aria-hidden="true" /> Log
            </button>
          </div>
        </header>

        {/* ── ECOSYSTEM TAB ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'ecosystem' && (
            <motion.div key="ecosystem" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-5">
              
              {/* Quick Metrics KPI Section */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: "Today's CO2e",
                    value: `${todayEmissions.toFixed(1)} kg`,
                    desc: "CO2e logged today",
                    color: todayEmissions > 10 ? 'var(--accent-rose)' : todayEmissions > 5 ? 'var(--accent-amber)' : 'var(--accent-green)',
                    icon: Leaf
                  },
                  {
                    label: "Weekly Goal Target",
                    value: goals.find(g => g.status === 'active')?.targetValue ? `${goals.find(g => g.status === 'active')?.targetValue} kg` : 'None',
                    desc: "Weekly reduction budget",
                    color: 'var(--accent-blue)',
                    icon: Target
                  },
                  {
                    label: "Current Streak",
                    value: `${user?.currentStreak || 0} Days`,
                    desc: "Daily logging streak",
                    color: 'var(--accent-amber)',
                    icon: Flame
                  },
                  {
                    label: "Global Rank",
                    value: `#${userRank}`,
                    desc: "Rank on leaderboard",
                    color: 'var(--accent-purple)',
                    icon: Trophy
                  }
                ].map((kpi, idx) => {
                  const Icon = kpi.icon;
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="stat-card flex items-center justify-between p-4"
                    >
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{kpi.label}</p>
                        <h3 className="text-xl font-heading font-extrabold" style={{ color: kpi.color }}>{kpi.value}</h3>
                        <p className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>{kpi.desc}</p>
                      </div>
                      <div className="p-2.5 rounded-xl" style={{ background: `${kpi.color}10`, border: `1px solid ${kpi.color}20` }}>
                        <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column (col-span-8) */}
                <div className="lg:col-span-8 space-y-5">
                  {/* AI Digest */}
                  {user && <WeeklyDigestCard userId={user.id} />}
                  {/* 7-day check-in */}
                  {pendingCheckIn && user && (
                    <SwapCheckIn swap={pendingCheckIn} userId={user.id} onComplete={() => typeof window !== 'undefined' && window.location.reload()} />
                  )}
                  {/* Ecosystem canvas */}
                  <div className="glass-panel rounded-2xl overflow-hidden relative" style={{ height: 380 }}>
                    <EcosystemCanvas healthScore={ecosystem?.healthScore || 50} weatherState={ecosystem?.weatherState || 'cloudy'} unlockedAssets={ecosystem?.unlockedAssets || []} />
                  </div>
                  {/* Weekly chart */}
                  <WeeklyChart logs={logs} />
                </div>
                {/* Right Column (col-span-4) */}
                <div className="lg:col-span-4 space-y-5">
                  <SwapCard />
                  {/* Quick tips */}
                  <div className="glass-panel rounded-2xl p-5 space-y-3">
                    <h3 className="font-heading font-semibold text-xs uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <Info className="w-3.5 h-3.5" /> Ecosystem Tips
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      Your virtual island reflects your habits. Low-carbon logs heal the soil, clear the sky, and attract wildlife.
                    </p>
                    <div className="divider" />
                    <div className="text-[11px] font-mono space-y-1.5" style={{ color: 'var(--text-muted)' }}>
                      <p>Car ≈ 0.192 kg CO2e/km</p>
                      <p>Beef meal ≈ 6.61 kg CO2e</p>
                      <p>AC ≈ 1.5 kWh/hour</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── SWAPS TAB ── */}
          {activeTab === 'swaps' && (
            <motion.div key="swaps" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <div className="space-y-5">
                <div>
                  <h2 className="font-heading font-bold text-xl flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <ArrowRightLeft className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} /> Carbon Swaps Engine
                  </h2>
                  <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>Gemini-powered recommendations grounded in real CO2e data</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-1"><SwapCard /></div>
                  <div className="md:col-span-2 glass-panel rounded-2xl p-6 space-y-4">
                    <h3 className="font-heading font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Swap History</h3>
                    {swaps.length === 0 ? (
                      <div className="flex flex-col items-center py-12 gap-3">
                        <ArrowRightLeft className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                        <p className="text-sm font-heading" style={{ color: 'var(--text-secondary)' }}>No swaps accepted yet</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Accept a challenge from the Swaps card to get started!</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {swaps.map((s: any, i: number) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                            className="p-4 rounded-xl flex items-center justify-between" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <h4 className="text-xs font-heading font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{s.swapTitle}</h4>
                              <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Accepted {new Date(s.acceptedAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ml-3 shrink-0 ${s.status === 'completed' ? 'text-green-400 bg-green-950/30 border border-green-900/30' : s.status === 'active' ? 'text-amber-400 bg-amber-950/30 border border-amber-900/30' : 'text-slate-400 bg-slate-900/30 border border-slate-800/30'}`}>
                              {s.status}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── LOGS TAB ── */}
          {activeTab === 'logs' && (
            <motion.div key="logs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <LogsTab logs={logs} />
            </motion.div>
          )}

          {/* ── GOALS TAB ── */}
          {activeTab === 'goals' && (
            <motion.div key="goals" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <div className="space-y-5">
                <div>
                  <h2 className="font-heading font-bold text-xl flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <BarChart3 className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} /> Goals & Stats
                  </h2>
                  <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>Set reduction targets and track your category breakdown</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-1 space-y-5">
                    {/* Create goal */}
                    <div className="glass-panel rounded-2xl p-5 space-y-4">
                      <h3 className="font-heading font-semibold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                        <Target className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} /> New Goal
                      </h3>
                      <form onSubmit={handleCreateGoal} className="space-y-4 text-xs">
                        <div>
                          <label className="block mb-1.5 font-heading font-semibold" style={{ color: 'var(--text-secondary)' }}>Category</label>
                          <select value={goalCategory} onChange={e => setGoalCategory(e.target.value)} className="input">
                            {['overall','transport','food','electricity','water','waste','shopping'].map(c => (
                              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1.5">
                            <label className="font-heading font-semibold" style={{ color: 'var(--text-secondary)' }}>Target reduction</label>
                            <span className="font-mono font-bold" style={{ color: 'var(--accent-blue)' }}>{goalReduction}%</span>
                          </div>
                          <input type="range" min="5" max="50" step="5" value={goalReduction} onChange={e => setGoalReduction(parseInt(e.target.value))}
                            className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ accentColor: 'var(--accent-blue)', background: 'var(--bg-elevated)' }} />
                        </div>
                        <button type="submit" disabled={goalLoading} className="btn-primary w-full">
                          {goalLoading ? 'Activating…' : 'Activate Goal'}
                        </button>
                      </form>
                    </div>
                    {/* Goals list */}
                    <div className="glass-panel rounded-2xl p-5 space-y-3">
                      <h3 className="font-heading font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Active Goals</h3>
                      {goals.length === 0 ? <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No goals set yet.</p> : (
                        <div className="space-y-2">
                          {goals.map((g: any, i: number) => (
                            <div key={i} className="p-3 rounded-xl space-y-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-heading font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{g.category || 'Overall'}</span>
                                <span className="font-mono" style={{ color: 'var(--accent-blue)' }}>{g.targetValue} kg target</span>
                              </div>
                              <div className="progress-bar"><div className="progress-bar-fill" style={{ width: '60%' }} /></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Pie chart */}
                  <div className="md:col-span-2 glass-panel rounded-2xl p-6 space-y-4">
                    <h3 className="font-heading font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Footprint Breakdown</h3>
                    {categoryData.length === 0 ? (
                      <div className="flex flex-col items-center py-12 gap-3">
                        <BarChart3 className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                        <p className="text-sm font-heading" style={{ color: 'var(--text-secondary)' }}>No data logged yet</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Start logging activities to see your breakdown</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
                        <div style={{ height: 240 }}>
                          <CategoryPieChart data={categoryData} />
                        </div>
                        <div className="space-y-2">
                          {categoryData.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                              </div>
                              <span className="font-mono font-bold" style={{ color: 'var(--text-secondary)' }}>{item.value.toFixed(1)} kg</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── SOCIAL / ACHIEVEMENTS TAB ── */}
          {activeTab === 'social' && (
            <motion.div key="social" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <div className="space-y-5">
                <div>
                  <h2 className="font-heading font-bold text-xl flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Trophy className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} /> Achievements & Social
                  </h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Badges */}
                  <div className="lg:col-span-2 glass-panel rounded-2xl p-6 space-y-4">
                    <h3 className="font-heading font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Badge Showcase</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {achievements.map((ua: any, i: number) => (
                        <motion.div key={i} whileHover={{ scale: 1.03, y: -2 }} className="p-4 rounded-xl text-center flex flex-col items-center gap-2 cursor-pointer"
                          style={{ border: '1px solid rgba(56,189,248,0.25)', background: 'rgba(56,189,248,0.06)' }}>
                          <div className="w-12 h-12 rounded-full flex items-center justify-center font-heading font-bold text-lg"
                            style={{ background: 'rgba(56,189,248,0.12)', color: 'var(--accent-blue)', border: '1px solid var(--border-default)' }}>
                            {ua.achievement.title.substring(0, 1)}
                          </div>
                          <div>
                            <h4 className="text-xs font-heading font-bold" style={{ color: 'var(--text-primary)' }}>{ua.achievement.title}</h4>
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{ua.achievement.description}</p>
                          </div>
                        </motion.div>
                      ))}
                      {/* Locked badges */}
                      {['STREAK_7','STREAK_30','FIRST_SWAP','FOREST_BLOOM','VEGAN_WEEK'].map(code => {
                        if (achievements.some((ua: any) => ua.achievement?.code === code)) return null;
                        const titles: Record<string, { t: string; d: string }> = {
                          STREAK_7: { t: 'One Week Wonder', d: '7-day logging streak' },
                          STREAK_30: { t: 'Habit Formed', d: '30-day logging streak' },
                          FIRST_SWAP: { t: 'Swap Starter', d: 'Complete first swap' },
                          FOREST_BLOOM: { t: 'Thriving Ecosystem', d: 'Reach health 80+' },
                          VEGAN_WEEK: { t: 'Plant-Powered', d: '7 vegan meals logged' }
                        };
                        const det = titles[code] || { t: code, d: '' };
                        return (
                          <div key={code} className="p-4 rounded-xl text-center flex flex-col items-center gap-2 opacity-35 grayscale select-none"
                            style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center font-heading font-bold text-xl" style={{ background: 'var(--bg-overlay)', color: 'var(--text-muted)' }}>?</div>
                            <div>
                              <h4 className="text-xs font-heading font-bold" style={{ color: 'var(--text-muted)' }}>{det.t}</h4>
                              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{det.d}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Leaderboard + Groups */}
                  <div className="glass-panel rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                      <button
                        onClick={() => setSocialSubTab('global')}
                        className="flex-1 py-1.5 px-3 rounded-lg text-xs font-heading font-bold transition-all text-center cursor-pointer"
                        style={{
                          background: socialSubTab === 'global' ? 'var(--brand-glow-lg)' : 'transparent',
                          color: socialSubTab === 'global' ? 'var(--accent-blue)' : 'var(--text-muted)'
                        }}
                      >
                        Global Board
                      </button>
                      <button
                        onClick={() => setSocialSubTab('group')}
                        className="flex-1 py-1.5 px-3 rounded-lg text-xs font-heading font-bold transition-all text-center cursor-pointer"
                        style={{
                          background: socialSubTab === 'group' ? 'var(--brand-glow-lg)' : 'transparent',
                          color: socialSubTab === 'group' ? 'var(--accent-blue)' : 'var(--text-muted)'
                        }}
                      >
                        Friend Group
                      </button>
                    </div>

                    {socialSubTab === 'global' ? (
                      <div className="space-y-1.5 pt-1">
                        {leaderboard.length === 0 ? (
                          <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No rankings available.</p>
                        ) : (
                          leaderboard.slice(0, 8).map((item: any, idx: number) => {
                            const isSelf = user && item.userId === user.id;
                            return (
                              <motion.div key={idx} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                                className="p-2.5 rounded-xl flex items-center justify-between"
                                style={{ border: `1px solid ${isSelf ? 'rgba(56,189,248,0.3)' : 'var(--border-subtle)'}`, background: isSelf ? 'rgba(56,189,248,0.08)' : 'transparent' }}>
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full font-mono text-[10px] font-bold flex items-center justify-center"
                                    style={{ background: idx === 0 ? 'rgba(245,158,11,0.2)' : idx === 1 ? 'rgba(148,163,184,0.2)' : idx === 2 ? 'rgba(180,83,9,0.2)' : 'var(--bg-elevated)', color: idx < 3 ? ['var(--accent-amber)','#94a3b8','#b45309'][idx] : 'var(--text-muted)' }}>
                                    {item.rank}
                                  </span>
                                  <span className="text-xs font-heading truncate max-w-[100px]" style={{ color: isSelf ? 'var(--accent-blue)' : 'var(--text-primary)', fontWeight: isSelf ? 700 : 400 }}>
                                    {item.user?.name || '—'}
                                  </span>
                                </div>
                                <span className="font-mono text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{item.weeklyPoints} pts</span>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 pt-1">
                        {userGroupId ? (
                          <>
                            <div className="flex items-center gap-2 p-2.5 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
                              <span className="text-xs flex-1" style={{ color: 'var(--text-muted)' }}>Group Code:</span>
                              <span className="font-mono font-bold tracking-widest text-sm" style={{ color: 'var(--accent-blue)' }}>{userGroupId}</span>
                              {/* Fix 2: aria-label on copy button; Fix 6: aria-live for copy confirmation */}
                              <button
                                onClick={() => { navigator.clipboard.writeText(userGroupId); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }}
                                aria-label={copiedCode ? 'Group code copied!' : 'Copy group invite code'}
                                className="p-1 rounded-lg transition-colors cursor-pointer"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {copiedCode ? <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" style={{ color: 'var(--accent-green)' }} /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                              </button>
                            </div>
                            {groupLeaderboard.length === 0 ? (
                              <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>No other members yet.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {groupLeaderboard.map((item: any, idx: number) => {
                                  const isSelf = user && item.userId === user.id;
                                  return (
                                    <div key={idx} className="p-2 rounded-xl flex items-center justify-between" style={{ background: isSelf ? 'rgba(56,189,248,0.08)' : 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                                      <span className="text-xs font-heading" style={{ color: isSelf ? 'var(--accent-blue)' : 'var(--text-primary)', fontWeight: isSelf ? 700 : 400 }}>{item.user?.name || '—'}</span>
                                      <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>{item.weeklyPoints} pts</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <input type="text" placeholder="Invite code" value={groupInviteInput} onChange={e => setGroupInviteInput(e.target.value.toUpperCase())} maxLength={6} className="input flex-1 font-mono uppercase tracking-widest text-xs" />
                              <button onClick={async () => {
                                if (!user) return; setGroupActionLoading(true);
                                try {
                                  const res = await fetch('/api/group?action=join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, inviteCode: groupInviteInput }) });
                                  const d = await res.json();
                                  if (d.success) { setUserGroupId(d.groupId); const gr = await fetch(`/api/group?groupId=${d.groupId}`); setGroupLeaderboard((await gr.json()).members || []); }
                                } catch {}
                                setGroupActionLoading(false);
                              }} disabled={!groupInviteInput || groupActionLoading} className="btn-ghost px-3 py-2 text-xs shrink-0 font-bold">Join</button>
                            </div>
                            <button onClick={async () => {
                              if (!user) return; setGroupActionLoading(true);
                              try {
                                const res = await fetch('/api/group', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) });
                                const d = await res.json();
                                if (d.success) setUserGroupId(d.inviteCode);
                              } catch {}
                              setGroupActionLoading(false);
                            }} disabled={groupActionLoading} className="w-full py-2.5 rounded-xl text-xs font-heading font-semibold transition-all cursor-pointer"
                              style={{ border: '1px dashed var(--border-default)', color: 'var(--text-secondary)', background: 'transparent' }}>
                              + Create a Friend Group
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav aria-label="Main navigation" className="fixed bottom-0 inset-x-0 md:hidden z-40 glass-panel-heavy" style={{ borderRadius: '16px 16px 0 0', padding: '8px 8px 4px' }}>
        <div className="flex items-center justify-around">
          {MOBILE_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            // Fix 2: aria-label + aria-current on mobile tab buttons
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all cursor-pointer relative"
                style={{ color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)', background: isActive ? 'var(--brand-glow)' : 'transparent' }}
              >
                {isActive && <motion.div layoutId="mobile-tab-bg" className="absolute inset-0 rounded-xl" style={{ background: 'var(--brand-glow)' }} />}
                <Icon className="w-5 h-5 relative z-10" aria-hidden="true" />
                <span className="text-[9px] font-heading font-semibold relative z-10" aria-hidden="true">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Floating chat button (mobile) ── */}
      <motion.button
        onClick={() => setIsChatOpen(true)}
        aria-label="Open AI Logger"
        className="fixed bottom-20 right-4 md:hidden w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-50 ripple"
        style={{ background: 'var(--accent-blue)', color: '#fff', boxShadow: '0 4px 20px rgba(56,189,248,0.4)' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.93 }}
      >
        <MessageSquarePlus className="w-5 h-5" />
      </motion.button>

      {/* ── Chat drawer ── */}
      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
