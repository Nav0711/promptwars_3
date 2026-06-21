'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRightLeft, Loader2, Trophy } from 'lucide-react';

interface SwapCheckInProps {
  swap: { id: string; swapTitle: string; analogyText: string; targetCategory: string; acceptedAt: string; };
  userId: string;
  onComplete: (result: 'completed' | 'abandoned') => void;
}

const categoryEmoji: Record<string, string> = {
  food: '', transport: '', electricity: '', water: '', waste: '', shopping: ''
};

export default function SwapCheckIn({ swap, userId, onComplete }: SwapCheckInProps) {
  const [loading, setLoading] = useState(false);
  const [resolved, setResolved] = useState(false);

  const daysSince = Math.floor((Date.now() - new Date(swap.acceptedAt).getTime()) / (1000 * 60 * 60 * 24));

  const handleCheckIn = async (result: 'completed' | 'abandoned') => {
    setLoading(true);
    try {
      await fetch('/api/swap/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ swapId: swap.id, userId, result })
      });
      setResolved(true);
      setTimeout(() => onComplete(result), 1400);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {!resolved ? (
        <motion.div
          key="checkin"
          initial={{ opacity: 0, y: -14, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ type: 'spring', damping: 20, stiffness: 220 }}
          className="relative rounded-2xl overflow-hidden p-5 space-y-4"
          style={{ background: 'var(--glass-bg)', border: '1px solid rgba(245,158,11,0.2)', backdropFilter: 'blur(16px)' }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.05), transparent 60%)' }} />

          <div className="relative flex items-start gap-3">
            <div className="p-2 rounded-xl shrink-0" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <ArrowRightLeft className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-semibold text-sm" style={{ color: 'var(--accent-amber)' }}>7-Day Check-In</h3>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--accent-amber)' }}>
                  Day {daysSince}
                </span>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>How did your swap go this week?</p>
            </div>
          </div>

          <div className="relative rounded-xl p-3.5 space-y-1.5"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <span className="text-base">{categoryEmoji[swap.targetCategory] || ''}</span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Active Swap
              </span>
            </div>
            <p className="text-sm font-heading font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{swap.swapTitle}</p>
            <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>{swap.analogyText}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-2">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--accent-blue)' }} />
            </div>
          ) : (
            <div className="relative flex gap-2.5">
              <button onClick={() => handleCheckIn('abandoned')}
                className="flex-1 py-2.5 px-3 rounded-xl text-xs font-heading font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                <XCircle className="w-3.5 h-3.5" style={{ color: 'var(--accent-rose)' }} />
                Didn't manage it
              </button>
              <button onClick={() => handleCheckIn('completed')}
                className="flex-[1.5] py-2.5 px-3 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                style={{ background: 'var(--accent-green)', color: '#fff', boxShadow: '0 4px 16px rgba(34,197,94,0.25)' }}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed! +100 pts
              </button>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div key="resolved" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-panel rounded-2xl p-5 flex items-center justify-center gap-3">
          <Trophy className="w-5 h-5" style={{ color: 'var(--accent-amber)' }} />
          <span className="text-sm font-heading font-semibold" style={{ color: 'var(--text-primary)' }}>
            Logged! New challenge coming soon.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
