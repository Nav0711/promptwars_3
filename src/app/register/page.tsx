'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }

      // Automatically sign in the user
      const signInRes = await signIn('credentials', {
        redirect: false,
        email,
        password
      });

      if (signInRes?.ok) {
        router.push('/');
      } else {
        // Fallback
        router.push('/login?registered=true');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
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
          <h1 className="font-heading font-extrabold text-2xl" style={{ color: 'var(--text-primary)' }}>Join EcoLoop</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Create an account to track your footprint.</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold font-heading" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Navdeep"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none"
              style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
            />
          </div>
          
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
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-bold hover:underline" style={{ color: 'var(--accent-blue)' }}>
            Log in
          </Link>
        </div>

      </div>
    </div>
  );
}
