'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { useTheme } from '@/components/ThemeProvider';
import {
  ArrowLeft, User, Mail, Flame, Award, Leaf, Shield,
  Sun, Moon, Home, Car, Utensils, Zap, Droplets, Settings,
  Save, AlertTriangle, RefreshCw, CheckCircle2, Edit3,
  BarChart3, Calendar, Clock, Target
} from 'lucide-react';

const DIET_OPTIONS = [
  { value: 'omnivore', label: 'Omnivore', emoji: '🥩', desc: 'Includes meat regularly' },
  { value: 'flexitarian', label: 'Flexitarian', emoji: '🥦', desc: 'Mostly plant-based' },
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥗', desc: 'No meat' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱', desc: 'No animal products' }
];

const TRANSIT_OPTIONS = [
  { value: 'car', label: 'Car', emoji: '🚗' },
  { value: 'bus', label: 'Bus', emoji: '🚌' },
  { value: 'metro', label: 'Metro', emoji: '🚇' },
  { value: 'bike', label: 'Bike', emoji: '🚲' },
  { value: 'walk', label: 'Walk', emoji: '🚶' },
  { value: 'wfh', label: 'WFH', emoji: '🏠' }
];

const HOUSING_OPTIONS = [
  { value: 'apartment', label: 'Apartment', emoji: '🏢' },
  { value: 'house', label: 'House', emoji: '🏡' },
  { value: 'shared', label: 'Shared', emoji: '🏘️' }
];

export default function ProfilePage() {
  const { user, refreshAll } = useApp();
  const { theme, toggleTheme, isDark } = useTheme();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'baseline' | 'preferences' | 'danger'>('profile');

  const baseline = user?.baselineProfile || {};

  // Local editable state
  const [name, setName] = useState(user?.name || '');
  const [diet, setDiet] = useState(baseline.diet || 'omnivore');
  const [transit, setTransit] = useState(baseline.transitMode || 'car');
  const [housing, setHousing] = useState(baseline.housingType || 'apartment');
  const [householdSize, setHouseholdSize] = useState(baseline.householdSize || 2);
  const [weeklyKm, setWeeklyKm] = useState(baseline.weeklyKm || 50);
  const [electricityKwh, setElectricityKwh] = useState(baseline.electricityKwh || 200);
  const [meatMeals, setMeatMeals] = useState(baseline.meatMeals || 5);

  const handleSave = async () => {
    setSaving(true);
    // In a full implementation: PATCH /api/user with updated data
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Reset your profile? You\'ll need to complete onboarding again.')) {
      localStorage.clear();
      window.location.href = '/onboarding';
    }
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'baseline', label: 'Baseline Survey', icon: BarChart3 },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
  ];

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'EC';

  const statItems = [
    { label: 'Eco-Points', value: user?.ecoPoints || 0, icon: Award, color: 'var(--accent-blue)' },
    { label: 'Current Streak', value: `${user?.currentStreak || 0}d`, icon: Flame, color: 'var(--accent-amber)' },
    { label: 'Longest Streak', value: `${user?.longestStreak || 0}d`, icon: Target, color: 'var(--accent-green)' },
    { label: 'Baseline CO2e', value: `${(user?.baselineFootprintKgCO2e || 0).toFixed(0)}`, icon: Leaf, color: 'var(--accent-purple)', unit: 'kg/mo' }
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Top bar */}
      <header className="glass-panel border-b sticky top-0 z-30 px-6 py-4" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0 }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl transition-all ripple"
              style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--accent-blue)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-heading font-bold text-base" style={{ color: 'var(--text-primary)' }}>Profile Settings</h1>
              <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Manage your EcoLoop account</p>
            </div>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl transition-all ripple"
            style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
          >
            <motion.div animate={{ rotate: isDark ? 0 : 180 }} transition={{ duration: 0.4, type: 'spring' }}>
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </motion.div>
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* LEFT — Avatar + stats + section nav */}
          <div className="space-y-4">
            {/* Avatar card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-2xl p-6 text-center space-y-3"
            >
              {/* Avatar */}
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center font-heading font-extrabold text-3xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(34,197,94,0.15))',
                    color: 'var(--accent-blue)',
                    border: '2px solid var(--border-default)'
                  }}>
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--accent-green)', border: '2px solid var(--bg-base)' }}>
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              </div>

              <div>
                <h2 className="font-heading font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  {user?.name || 'Eco Warrior'}
                </h2>
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{user?.email || '—'}</p>
              </div>

              {/* Member since */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                <Calendar className="w-3 h-3" />
                <span>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}</span>
              </div>
            </motion.div>

            {/* Stats grid */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-panel rounded-2xl p-4 grid grid-cols-2 gap-3"
            >
              {statItems.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="text-center space-y-1">
                    <div className="w-7 h-7 rounded-lg mx-auto flex items-center justify-center"
                      style={{ background: `${s.color}1a`, color: s.color }}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <p className="font-heading font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {s.value}
                      {s.unit && <span className="text-[9px] font-mono ml-0.5" style={{ color: 'var(--text-muted)' }}>{s.unit}</span>}
                    </p>
                    <p className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                  </div>
                );
              })}
            </motion.div>

            {/* Section nav */}
            <motion.nav
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel rounded-2xl p-3 space-y-1"
            >
              {sections.map(s => {
                const Icon = s.icon;
                const isActive = activeSection === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id as any)}
                    className={`nav-item w-full text-left ${isActive ? 'active' : ''} ${s.id === 'danger' ? 'hover:text-red-400' : ''}`}
                    style={isActive && s.id === 'danger' ? { color: 'var(--accent-rose)', borderColor: 'rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.08)' } : {}}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {s.label}
                  </button>
                );
              })}
            </motion.nav>
          </div>

          {/* RIGHT — Section content */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">

              {/* Profile section */}
              {activeSection === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="glass-panel rounded-2xl p-6 space-y-6"
                >
                  <div>
                    <h3 className="font-heading font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <User className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
                      Personal Info
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Update your display name and view account details</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold font-heading mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        Display Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="input pl-9"
                          placeholder="Your display name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold font-heading mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <input
                          type="email"
                          value={user?.email || ''}
                          readOnly
                          className="input pl-9 cursor-not-allowed"
                          style={{ opacity: 0.6 }}
                        />
                      </div>
                      <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>Email cannot be changed after signup</p>
                    </div>

                    {/* Account stats */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {[
                        { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—', icon: Calendar },
                        { label: 'Last Logged', value: user?.lastLogDate ? new Date(user.lastLogDate).toLocaleDateString() : '—', icon: Clock }
                      ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <div key={i} className="p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <Icon className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                            </div>
                            <p className="text-xs font-heading font-semibold" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button onClick={handleSave} disabled={saving} className="btn-primary w-full" style={{ background: saving || saved ? (saved ? 'var(--accent-green)' : undefined) : undefined }}>
                    {saving ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : saved ? (
                      <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                    ) : (
                      <><Save className="w-4 h-4" /> Save Changes</>
                    )}
                  </button>
                </motion.div>
              )}

              {/* Baseline section */}
              {activeSection === 'baseline' && (
                <motion.div
                  key="baseline"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Diet */}
                  <div className="glass-panel rounded-2xl p-5 space-y-4">
                    <h3 className="font-heading font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Utensils className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} /> Diet Type
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {DIET_OPTIONS.map(d => (
                        <button
                          key={d.value}
                          onClick={() => setDiet(d.value)}
                          className="p-3 rounded-xl text-left transition-all cursor-pointer"
                          style={{
                            border: `1px solid ${diet === d.value ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                            background: diet === d.value ? 'var(--brand-glow-lg)' : 'var(--bg-elevated)',
                            transform: diet === d.value ? 'scale(1.02)' : 'scale(1)'
                          }}
                        >
                          <span className="text-xl">{d.emoji}</span>
                          <p className="text-xs font-heading font-semibold mt-1" style={{ color: diet === d.value ? 'var(--accent-blue)' : 'var(--text-primary)' }}>{d.label}</p>
                          <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{d.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transport */}
                  <div className="glass-panel rounded-2xl p-5 space-y-4">
                    <h3 className="font-heading font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Car className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} /> Primary Transport
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {TRANSIT_OPTIONS.map(t => (
                        <button
                          key={t.value}
                          onClick={() => setTransit(t.value)}
                          className="p-3 rounded-xl text-center transition-all cursor-pointer"
                          style={{
                            border: `1px solid ${transit === t.value ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                            background: transit === t.value ? 'var(--brand-glow-lg)' : 'var(--bg-elevated)',
                          }}
                        >
                          <span className="text-2xl">{t.emoji}</span>
                          <p className="text-[11px] font-heading font-semibold mt-1" style={{ color: transit === t.value ? 'var(--accent-blue)' : 'var(--text-primary)' }}>{t.label}</p>
                        </button>
                      ))}
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-xs font-heading font-semibold" style={{ color: 'var(--text-secondary)' }}>Weekly distance</label>
                        <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent-blue)' }}>{weeklyKm} km</span>
                      </div>
                      <input type="range" min="0" max="500" step="5" value={weeklyKm}
                        onChange={e => setWeeklyKm(+e.target.value)}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: 'var(--accent-blue)', background: 'var(--bg-elevated)' }}
                      />
                    </div>
                  </div>

                  {/* Housing */}
                  <div className="glass-panel rounded-2xl p-5 space-y-4">
                    <h3 className="font-heading font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                      <Home className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} /> Housing & Energy
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {HOUSING_OPTIONS.map(h => (
                        <button
                          key={h.value}
                          onClick={() => setHousing(h.value)}
                          className="p-3 rounded-xl text-center transition-all cursor-pointer"
                          style={{
                            border: `1px solid ${housing === h.value ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                            background: housing === h.value ? 'var(--brand-glow-lg)' : 'var(--bg-elevated)',
                          }}
                        >
                          <span className="text-2xl">{h.emoji}</span>
                          <p className="text-[11px] font-heading font-semibold mt-1" style={{ color: housing === h.value ? 'var(--accent-blue)' : 'var(--text-primary)' }}>{h.label}</p>
                        </button>
                      ))}
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <label className="text-xs font-heading font-semibold" style={{ color: 'var(--text-secondary)' }}>Monthly electricity</label>
                        <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent-blue)' }}>{electricityKwh} kWh</span>
                      </div>
                      <input type="range" min="0" max="1000" step="10" value={electricityKwh}
                        onChange={e => setElectricityKwh(+e.target.value)}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: 'var(--accent-blue)', background: 'var(--bg-elevated)' }}
                      />
                    </div>
                  </div>

                  <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
                    {saving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Update Baseline</>}
                  </button>
                </motion.div>
              )}

              {/* Preferences section */}
              {activeSection === 'preferences' && (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="glass-panel rounded-2xl p-6 space-y-6"
                >
                  <h3 className="font-heading font-bold text-base flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Settings className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} /> App Preferences
                  </h3>

                  {/* Theme */}
                  <div className="space-y-3">
                    <label className="text-xs font-heading font-semibold" style={{ color: 'var(--text-secondary)' }}>Theme</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { val: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Midnight grid · Light blue on black' },
                        { val: 'light', label: 'Light Mode', icon: Sun, desc: 'Bright grid · Sky blue on white' }
                      ].map(t => {
                        const Icon = t.icon;
                        const isActive = theme === t.val;
                        return (
                          <button
                            key={t.val}
                            onClick={toggleTheme}
                            className="p-4 rounded-xl text-left transition-all cursor-pointer"
                            style={{
                              border: `1px solid ${isActive ? 'var(--accent-blue)' : 'var(--border-subtle)'}`,
                              background: isActive ? 'var(--brand-glow-lg)' : 'var(--bg-elevated)',
                            }}
                          >
                            <Icon className="w-5 h-5 mb-2" style={{ color: isActive ? 'var(--accent-blue)' : 'var(--text-muted)' }} />
                            <p className="text-xs font-heading font-bold" style={{ color: isActive ? 'var(--accent-blue)' : 'var(--text-primary)' }}>{t.label}</p>
                            <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{t.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Notification preferences (UI only) */}
                  <div className="space-y-3">
                    <label className="text-xs font-heading font-semibold" style={{ color: 'var(--text-secondary)' }}>Notifications</label>
                    {[
                      { label: 'Weekly digest every Monday', defaultOn: true },
                      { label: '7-day swap check-in reminders', defaultOn: true },
                      { label: 'Daily logging streak warnings', defaultOn: false },
                    ].map((pref, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                        <span className="text-xs font-heading" style={{ color: 'var(--text-primary)' }}>{pref.label}</span>
                        <div className="w-9 h-5 rounded-full relative cursor-pointer" style={{
                          background: pref.defaultOn ? 'rgba(56,189,248,0.2)' : 'var(--bg-overlay)',
                          border: '1px solid var(--border-default)'
                        }}>
                          <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                            style={{ background: pref.defaultOn ? 'var(--accent-blue)' : 'var(--text-muted)', left: pref.defaultOn ? 'calc(100% - 1.1rem)' : '2px' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Danger zone */}
              {activeSection === 'danger' && (
                <motion.div
                  key="danger"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="glass-panel rounded-2xl p-6 space-y-4" style={{ border: '1px solid rgba(244,63,94,0.2)' }}>
                    <h3 className="font-heading font-bold text-base flex items-center gap-2" style={{ color: 'var(--accent-rose)' }}>
                      <AlertTriangle className="w-5 h-5" /> Danger Zone
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      These actions cannot be undone. Please be careful.
                    </p>

                    <div className="space-y-3">
                      <div className="p-4 rounded-xl" style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)' }}>
                        <h4 className="text-sm font-heading font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Reset Profile</h4>
                        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                          Clears all local session data and returns you to the onboarding screen. Your logs and points are preserved in the database.
                        </p>
                        <button
                          onClick={handleReset}
                          className="px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer ripple"
                          style={{ background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', border: '1px solid rgba(244,63,94,0.25)' }}
                        >
                          <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
                          Reset & Re-onboard
                        </button>
                      </div>

                      <div className="p-4 rounded-xl" style={{ background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.15)' }}>
                        <h4 className="text-sm font-heading font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Export My Data</h4>
                        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                          Download all your carbon logs as a JSON file for your records.
                        </p>
                        <button
                          onClick={() => {
                            const blob = new Blob([JSON.stringify({ user, logs: [] }, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a'); a.href = url; a.download = 'ecoloop-data.json'; a.click();
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer"
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
                        >
                          Export Data
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
