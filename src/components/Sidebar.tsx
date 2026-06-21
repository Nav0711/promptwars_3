'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from './AppContext';
import { useTheme } from './ThemeProvider';
import {
  Leaf, Home, ArrowRightLeft, BarChart3, Trophy,
  ScrollText, User, Sun, Moon, MessageSquarePlus,
  ChevronRight, Zap, Settings
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onOpenChat: () => void;
}

const navItems = [
  { id: 'ecosystem', label: 'Ecosystem', icon: Home, hint: 'Your living world' },
  { id: 'swaps',     label: 'Swaps',     icon: ArrowRightLeft, hint: 'Carbon challenges' },
  { id: 'logs',      label: 'Activity Logs', icon: ScrollText, hint: 'Full log history' },
  { id: 'goals',     label: 'Goals & Stats', icon: BarChart3, hint: 'Track progress' },
  { id: 'social',    label: 'Achievements',  icon: Trophy, hint: 'Badges & leaderboard' },
];

export default function Sidebar({ activeTab, setActiveTab, onOpenChat }: SidebarProps) {
  const { user } = useApp();
  const { theme, toggleTheme, isDark } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'EC';

  return (
    <aside className="hidden md:flex flex-col w-64 glass-panel rounded-2xl shrink-0 h-[calc(100vh-3rem)] sticky top-6 overflow-hidden">
      {/* Top gradient accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent-blue)] to-transparent opacity-60" />

      <div className="flex flex-col h-full p-5 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)' }}>
              <Leaf className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full status-dot online" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>
              EcoLoop
            </h1>
            <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>v3.0 · AI-Powered</p>
          </div>
        </div>

        <div className="divider" />

        {/* Navigation */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`nav-item w-full text-left ripple ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--accent-blue)' }}
                  />
                )}

                {/* Tooltip on hover (non-active items) */}
                {!isActive && hoveredItem === item.id && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[10px] font-mono"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {item.hint}
                  </motion.span>
                )}
              </button>
            );
          })}
        </nav>

        {/* AI Logger CTA */}
        <button
          onClick={onOpenChat}
          className="btn-primary w-full ripple group"
          style={{ background: 'linear-gradient(135deg, var(--accent-blue), #0ea5e9)' }}
        >
          <MessageSquarePlus className="w-4 h-4 transition-transform group-hover:rotate-12" />
          <span>Log Activity</span>
          <Zap className="w-3.5 h-3.5 ml-auto opacity-70" />
        </button>

        <div className="divider" />

        {/* Bottom: Profile + Theme toggle */}
        <div className="flex flex-col gap-2">
          {/* Profile link */}
          <Link
            href="/profile"
            className="flex items-center gap-2.5 p-2.5 rounded-xl transition-all group"
            style={{ border: '1px solid var(--border-subtle)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
              (e.currentTarget as HTMLElement).style.background = 'var(--brand-glow)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-heading font-bold text-xs shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(34,197,94,0.15))', color: 'var(--accent-blue)', border: '1px solid var(--border-default)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold font-heading truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.name || 'Eco Warrior'}
              </p>
              <p className="text-[10px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                {user?.ecoPoints || 0} pts · {user?.currentStreak || 0} day streak
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--text-muted)' }} />
          </Link>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2.5 p-2.5 rounded-xl transition-all ripple w-full text-left"
            style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
              (e.currentTarget as HTMLElement).style.color = 'var(--accent-blue)';
              (e.currentTarget as HTMLElement).style.background = 'var(--brand-glow)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <motion.div
              animate={{ rotate: isDark ? 0 : 180 }}
              transition={{ duration: 0.4, type: 'spring' }}
            >
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </motion.div>
            <span className="text-xs font-semibold font-heading">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            {/* Toggle track */}
            <div className="ml-auto w-9 h-5 rounded-full relative transition-all" style={{
              background: isDark ? 'rgba(56,189,248,0.15)' : 'rgba(14,165,233,0.2)',
              border: '1px solid var(--border-default)'
            }}>
              <motion.div
                animate={{ x: isDark ? 2 : 18 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-0.5 w-4 h-4 rounded-full"
                style={{ background: 'var(--accent-blue)' }}
              />
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}
