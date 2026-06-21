'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Leaf, Loader2 } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setErrorMsg('Account created! Please log in.');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg('');

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.ok) {
      router.push('/');
    } else {
      setLoading(false);
      setErrorMsg('Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative" style={{ background: 'var(--bg-base)' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-30" style={{ background: 'radial-gradient(circle at top, var(--brand-glow-lg) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md p-8 relative overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex p-3 rounded-full mb-2" style={{ background: 'var(--brand-glow)', border: '1px solid var(--border-default)' }}>
            <Leaf className="w-8 h-8" style={{ color: 'var(--accent-blue)' }} />
          </div>
          <h1 className="font-heading font-extrabold text-2xl" style={{ color: 'var(--text-primary)' }}>Welcome back to EcoLoop</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Enter your details to enter the loop.</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: searchParams.get('registered') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: searchParams.get('registered') ? '#22c55e' : '#ef4444', border: searchParams.get('registered') ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold font-heading" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. navdeep@ecoloop.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold font-heading" style={{ color: 'var(--text-secondary)' }}>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-white font-bold transition-all hover:opacity-90"
              style={{ background: 'var(--accent-blue)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : (
                'Log In'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link href="/register" className="font-bold hover:underline" style={{ color: 'var(--accent-blue)' }}>
            Sign up
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginForm />
    </Suspense>
  );
}
