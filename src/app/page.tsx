'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/AppContext';
import { Leaf, Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, loading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user && user.baselineFootprintKgCO2e > 0) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/20">
          <Leaf className="w-10 h-10 animate-bounce" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-slate-200">EcoLoop</h1>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Synchronizing Eco-Ecosystem...</span>
        </div>
      </div>
    </div>
  );
}
