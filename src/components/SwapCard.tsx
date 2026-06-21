'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from './AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, CheckCircle2, Sparkles, XCircle, Loader2, Bot, RefreshCw, Leaf, Zap } from 'lucide-react';

export default function SwapCard() {
  const { user, swaps, acceptSwap, completeSwap } = useApp();
  const [currentSuggestion, setCurrentSuggestion] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSuggestion = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate-swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      if (res.ok) setCurrentSuggestion(await res.json());
    } catch (e) {
      console.error('Error fetching swap suggestion:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !currentSuggestion) fetchSuggestion();
  }, [user]);

  const activeSwap = swaps.find((s) => s.status === 'active');

  const handleAccept = async () => {
    if (!currentSuggestion) return;
    setLoading(true);
    await acceptSwap(currentSuggestion);
    setCurrentSuggestion(null);
    setLoading(false);
  };

  const handleComplete = async () => {
    if (!activeSwap) return;
    setLoading(true);
    await completeSwap(activeSwap.id);
    setLoading(false);
  };

  const CATEGORY_COLORS: Record<string, string> = {
    transport: '#60a5fa', food: '#fb923c', electricity: '#facc15',
    water: '#22d3ee', waste: '#f87171', shopping: '#c084fc'
  };

  const accentColor = CATEGORY_COLORS[currentSuggestion?.targetCategory || activeSwap?.targetCategory] || 'var(--accent-blue)';

  return (
    <article className="glass-panel rounded-2xl p-5 space-y-4 relative overflow-hidden"
      style={{ border: `1px solid rgba(56,189,248,0.15)` }}>

      {/* Decorative glow */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${accentColor}12, transparent 70%)` }} />

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-heading font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
            <ArrowRightLeft className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
            Carbon Swap
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>High-impact behavioral challenge</p>
        </div>
        {!activeSwap && !loading && (
          <button onClick={fetchSuggestion} aria-label="Refresh suggestion" className="p-1.5 rounded-lg transition-all ripple"
            style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
            title="Refresh suggestion">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="py-8 flex flex-col items-center gap-2.5">
            <div className="w-7 h-7 rounded-full animate-spin"
              style={{ border: '2px solid var(--border-default)', borderTopColor: 'var(--accent-blue)' }} />
            <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Finding your swap...</span>
          </motion.div>

        ) : activeSwap ? (
          <motion.div key="active-swap" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider"
              style={{ color: 'var(--accent-green)' }}>
              <Sparkles className="w-3 h-3" /> Swap in Progress
            </div>
            <div className="p-3.5 rounded-xl space-y-2.5"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
              <h3 className="font-heading font-bold text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>
                {activeSwap.swapTitle}
              </h3>
              <div className="text-[11px] leading-relaxed p-2.5 rounded-lg font-mono"
                style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>
                <span className="font-bold" style={{ color: 'var(--accent-blue)' }}>Tip: </span>
                {activeSwap.analogyText}
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {activeSwap.reasonText}
              </p>
            </div>
            <button onClick={handleComplete}
              aria-label="Mark swap as completed"
              className="w-full py-2.5 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-2 transition-all ripple cursor-pointer"
              style={{ background: 'var(--accent-green)', color: '#fff', boxShadow: '0 4px 16px rgba(34,197,94,0.25)' }}>
              <CheckCircle2 className="w-4 h-4" /> Completed! +50 pts
            </button>
          </motion.div>

        ) : currentSuggestion ? (
          <motion.div key="suggestion" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-3">
            {/* Category badge */}
            {currentSuggestion.targetCategory && (
              <span className={`badge badge-${currentSuggestion.targetCategory}`}>
                {currentSuggestion.targetCategory}
              </span>
            )}
            <h3 className="font-heading font-bold text-sm leading-snug" style={{ color: 'var(--text-primary)' }}>
              {currentSuggestion.swapTitle}
            </h3>
            <div className="text-[11px] p-2.5 rounded-lg font-mono leading-relaxed"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <span className="font-bold" style={{ color: 'var(--accent-blue)' }}>Tip: </span>
              {currentSuggestion.analogyText}
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {currentSuggestion.reasonText}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold"
              style={{ color: 'var(--accent-green)' }}>
              <Leaf className="w-3 h-3" />
              Saves ~{currentSuggestion.estimatedSavingsKgCO2eWeekly?.toFixed(1)} kg CO2e/week
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={fetchSuggestion}
                aria-label="Skip suggestion"
                className="btn-ghost text-xs py-2 px-3 flex-none">
                Skip
              </button>
              <button onClick={handleAccept}
                aria-label="Accept swap challenge"
                className="btn-primary flex-1 text-xs py-2"
                style={{ background: `linear-gradient(135deg, var(--accent-blue), #0ea5e9)` }}>
                <Zap className="w-3.5 h-3.5" /> Accept Challenge
              </button>
            </div>
          </motion.div>

        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="py-10 flex flex-col items-center gap-3 text-center">
            <ArrowRightLeft className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No swap loaded yet.</p>
            <button onClick={fetchSuggestion} aria-label="Get a new swap suggestion" className="btn-primary text-xs py-2 px-4">Get a Swap</button>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
