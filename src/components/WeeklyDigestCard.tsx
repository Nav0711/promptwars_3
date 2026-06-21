'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, TrendingDown, TrendingUp, Bot, Loader2, Award } from 'lucide-react';

interface WeeklyDigestCardProps {
  userId: string;
  forceShow?: boolean;
}

interface DigestData {
  summaryText: string;
  badgeText: string | null;
  weeklyTotalKg: number;
  reductionPercent: number | null;
  bestCategory: string | null;
  categoryTotals: Record<string, number>;
  source: 'gemini' | 'fallback';
}

const categoryEmoji: Record<string, string> = {
  transport: '', food: '', electricity: '', water: '', waste: '', shopping: ''
};

export default function WeeklyDigestCard({ userId, forceShow = false }: WeeklyDigestCardProps) {
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const isMonday = new Date().getDay() === 1;
  const shouldShow = forceShow || isMonday;

  useEffect(() => {
    if (!shouldShow || !userId) return;
    const key = `digest-dismissed-${new Date().toDateString()}`;
    if (localStorage.getItem(key)) { setDismissed(true); return; }
    setLoading(true);
    fetch('/api/weekly-digest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    }).then(r => r.json()).then(data => {
      setDigest(data);
      if (data.reductionPercent && data.reductionPercent > 0) setTimeout(() => setConfetti(true), 500);
    }).catch(console.error).finally(() => setLoading(false));
  }, [userId, shouldShow]);

  const handleDismiss = () => {
    localStorage.setItem(`digest-dismissed-${new Date().toDateString()}`, '1');
    setDismissed(true);
  };

  if (!shouldShow || dismissed || (!loading && !digest)) return null;

  return (
    <AnimatePresence>
      {(loading || digest) && (
        <motion.section
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="relative rounded-2xl overflow-hidden"
          style={{ background: 'var(--glass-bg)', border: '1px solid rgba(56,189,248,0.2)', backdropFilter: 'blur(16px)' }}
        >
          {/* gradient shimmer */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.06) 0%, transparent 60%, rgba(34,197,94,0.04) 100%)' }} />

          {/* confetti */}
          {confetti && ['', '', '', '', '', ''].map((e, i) => (
            <motion.span key={i} className="absolute text-base pointer-events-none"
              style={{ left: `${8 + i * 16}%`, top: '-8%' }}
              animate={{ y: ['0%', '120%'], rotate: [0, 360], opacity: [1, 0] }}
              transition={{ duration: 1.4 + i * 0.15, delay: i * 0.08, ease: 'easeIn' }}>
              {e}
            </motion.span>
          ))}

          <div className="relative p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl" style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>
                  <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Weekly EcoDigest</h3>
                  <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <button onClick={handleDismiss} aria-label="Dismiss Weekly EcoDigest" className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2.5 py-4">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--accent-blue)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>EcoBot is writing your weekly summary...</span>
              </div>
            ) : digest && (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{digest.summaryText}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="px-3 py-2 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                    <p className="text-[9px] font-mono uppercase" style={{ color: 'var(--text-muted)' }}>This Week</p>
                    <p className="text-sm font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{digest.weeklyTotalKg} kg</p>
                  </div>
                  {digest.reductionPercent !== null && (
                    <div className="px-3 py-2 rounded-xl" style={{
                      background: digest.reductionPercent > 0 ? 'rgba(34,197,94,0.08)' : 'rgba(244,63,94,0.08)',
                      border: `1px solid ${digest.reductionPercent > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(244,63,94,0.2)'}`
                    }}>
                      <p className="text-[9px] font-mono uppercase" style={{ color: 'var(--text-muted)' }}>vs Last Week</p>
                      <div className="flex items-center gap-1">
                        {digest.reductionPercent > 0
                          ? <TrendingDown className="w-3 h-3" style={{ color: 'var(--accent-green)' }} />
                          : <TrendingUp className="w-3 h-3" style={{ color: 'var(--accent-rose)' }} />}
                        <p className="text-sm font-mono font-bold"
                          style={{ color: digest.reductionPercent > 0 ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
                          {digest.reductionPercent > 0 ? '-' : '+'}{Math.abs(digest.reductionPercent)}%
                        </p>
                      </div>
                    </div>
                  )}
                  {digest.bestCategory && (
                    <div className="px-3 py-2 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                      <p className="text-[9px] font-mono uppercase" style={{ color: 'var(--text-muted)' }}>Best Category</p>
                      <p className="text-sm font-bold capitalize" style={{ color: 'var(--text-primary)' }}>
                        {categoryEmoji[digest.bestCategory]} {digest.bestCategory}
                      </p>
                    </div>
                  )}
                </div>
                {digest.badgeText && (
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.35, type: 'spring' }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <Award className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} />
                    <span className="text-xs font-heading font-semibold" style={{ color: 'var(--accent-amber)' }}>{digest.badgeText}</span>
                  </motion.div>
                )}
                {digest.source === 'gemini' && (
                  <div className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    <Bot className="w-2.5 h-2.5" /> Summary by Gemini 2.0
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
