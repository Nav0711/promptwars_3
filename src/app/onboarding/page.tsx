'use client';

import React, { useState } from 'react';
import { useApp } from '@/components/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Compass, Coffee, Zap, User as UserIcon, ArrowRight, ArrowLeft, Leaf } from 'lucide-react';

export default function Onboarding() {
  const { completeOnboarding, loading } = useApp();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Survey Form States
  const [housing, setHousing] = useState<'apartment' | 'house'>('apartment');
  const [heating, setHeating] = useState<'electric' | 'gas' | 'none'>('electric');
  const [householdSize, setHouseholdSize] = useState(2);

  const [transitMode, setTransitMode] = useState<'car' | 'bus' | 'metro' | 'none'>('car');
  const [transitDistance, setTransitDistance] = useState(50);

  const [diet, setDiet] = useState<'omnivore' | 'vegetarian' | 'vegan' | 'flexitarian'>('omnivore');
  const [meatMeals, setMeatMeals] = useState(7);

  const [electricity, setElectricity] = useState(250); // kWh
  const [water, setWater] = useState(3000); // liters

  // Calculated Results
  const [calculatedFootprint, setCalculatedFootprint] = useState<number | null>(null);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const computeBaseline = () => {
    // 1. Housing (monthly)
    const baseHousing = housing === 'apartment' ? 100 : 250;
    const heatingAdd = heating === 'electric' ? 150 : heating === 'gas' ? 200 : 0;
    const housingScore = (baseHousing + heatingAdd) / householdSize;

    // 2. Transit (monthly - 4.33 weeks per month)
    let transitScore = 0;
    if (transitMode === 'car') {
      transitScore = transitDistance * 0.192 * 4.33;
    } else if (transitMode === 'bus') {
      transitScore = transitDistance * 0.105 * 4.33;
    } else if (transitMode === 'metro') {
      transitScore = transitDistance * 0.041 * 4.33;
    }

    // 3. Diet (monthly)
    let dietScore = 0;
    if (diet === 'vegan') {
      dietScore = 0.59 * 21 * 4.33;
    } else if (diet === 'vegetarian') {
      dietScore = 0.84 * 21 * 4.33;
    } else if (diet === 'omnivore') {
      dietScore = ((7 * 6.61) + (14 * 1.57)) * 4.33; // high beef/chicken avg
    } else {
      // flexitarian
      const vegetarianMeals = Math.max(0, 21 - meatMeals);
      dietScore = ((meatMeals * 1.57) + (vegetarianMeals * 0.84)) * 4.33;
    }

    // 4. Utilities (monthly)
    const electricityScore = electricity * 0.45;
    const waterScore = (water / 100) * 0.34;

    const total = housingScore + transitScore + dietScore + electricityScore + waterScore;
    setCalculatedFootprint(Math.round(total));
    setStep(5); // Jump to reveal step
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || calculatedFootprint === null) return;
    
    const profile = {
      housing,
      heating,
      householdSize,
      transitMode,
      transitDistance,
      diet,
      meatMeals,
      electricity,
      water
    };

    await completeOnboarding(name, email, profile, calculatedFootprint);
  };

  // Percent Progress
  const progressPercent = Math.min(100, Math.round(((step - 1) / 4) * 100));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative" style={{ background: 'var(--bg-base)' }}>
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-30" style={{ background: 'radial-gradient(circle at top, var(--brand-glow-lg) 0%, transparent 70%)' }} />

      <div className="w-full max-w-md glass-panel-heavy rounded-2xl shadow-2xl p-6 md:p-8 relative overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
        
        {/* Onboarding Steps 1-4 Header */}
        {step < 5 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Leaf className="w-5 h-5 animate-pulse" style={{ color: 'var(--accent-blue)' }} />
                <span className="font-heading font-semibold text-base" style={{ color: 'var(--accent-blue)' }}>EcoLoop Onboarding</span>
              </div>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Step {step} of 4</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <div 
                className="h-full rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-green))' }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: HOUSING */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: 'var(--brand-glow)', border: '1px solid var(--border-default)', color: 'var(--accent-blue)' }}>
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Housing Profile</h1>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Let&apos;s start with where you live.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold font-heading block" style={{ color: 'var(--text-secondary)' }}>Home Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setHousing('apartment')}
                    className="p-4 rounded-xl border text-center font-heading text-xs font-bold transition-all cursor-pointer"
                    style={{
                      borderColor: housing === 'apartment' ? 'var(--accent-blue)' : 'var(--border-subtle)',
                      background: housing === 'apartment' ? 'var(--brand-glow-lg)' : 'var(--bg-elevated)',
                      color: housing === 'apartment' ? 'var(--accent-blue)' : 'var(--text-muted)',
                      boxShadow: housing === 'apartment' ? '0 4px 12px var(--brand-glow)' : 'none'
                    }}
                  >
                    Apartment
                  </button>
                  <button
                    type="button"
                    onClick={() => setHousing('house')}
                    className="p-4 rounded-xl border text-center font-heading text-xs font-bold transition-all cursor-pointer"
                    style={{
                      borderColor: housing === 'house' ? 'var(--accent-blue)' : 'var(--border-subtle)',
                      background: housing === 'house' ? 'var(--brand-glow-lg)' : 'var(--bg-elevated)',
                      color: housing === 'house' ? 'var(--accent-blue)' : 'var(--text-muted)',
                      boxShadow: housing === 'house' ? '0 4px 12px var(--brand-glow)' : 'none'
                    }}
                  >
                    House
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold font-heading block" style={{ color: 'var(--text-secondary)' }}>Heating Source</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['electric', 'gas', 'none'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setHeating(mode)}
                      className="py-3 px-1 rounded-xl border text-center text-xs font-heading capitalize transition-all cursor-pointer"
                      style={{
                        borderColor: heating === mode ? 'var(--accent-blue)' : 'var(--border-subtle)',
                        background: heating === mode ? 'var(--brand-glow-lg)' : 'var(--bg-elevated)',
                        color: heating === mode ? 'var(--accent-blue)' : 'var(--text-muted)'
                      }}
                    >
                      {mode === 'none' ? 'No Heat' : mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold font-heading" style={{ color: 'var(--text-secondary)' }}>Household Size</label>
                  <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent-blue)' }}>{householdSize} {householdSize === 1 ? 'person' : 'people'}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={householdSize}
                  onChange={(e) => setHouseholdSize(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: 'var(--accent-blue)', background: 'var(--bg-elevated)' }}
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary flex items-center gap-2"
                  style={{ background: 'var(--accent-blue)' }}
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: TRANSIT */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: 'var(--brand-glow)', border: '1px solid var(--border-default)', color: 'var(--accent-blue)' }}>
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Transit Habits</h1>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>How do you commute on a weekly basis?</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold font-heading block" style={{ color: 'var(--text-secondary)' }}>Primary Commute Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['car', 'bus', 'metro', 'none'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTransitMode(mode)}
                      className="p-3.5 rounded-xl border text-center font-heading text-xs font-bold capitalize transition-all cursor-pointer"
                      style={{
                        borderColor: transitMode === mode ? 'var(--accent-blue)' : 'var(--border-subtle)',
                        background: transitMode === mode ? 'var(--brand-glow-lg)' : 'var(--bg-elevated)',
                        color: transitMode === mode ? 'var(--accent-blue)' : 'var(--text-muted)',
                        boxShadow: transitMode === mode ? '0 4px 12px var(--brand-glow)' : 'none'
                      }}
                    >
                      {mode === 'none' ? 'Walk/Cycle' : mode}
                    </button>
                  ))}
                </div>
              </div>

              {transitMode !== 'none' && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold font-heading" style={{ color: 'var(--text-secondary)' }}>Weekly Commute Distance</label>
                    <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent-blue)' }}>{transitDistance} km</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="500"
                    step="5"
                    value={transitDistance}
                    onChange={(e) => setTransitDistance(parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: 'var(--accent-blue)', background: 'var(--bg-elevated)' }}
                  />
                  <p className="text-[10px] mt-1.5 font-mono" style={{ color: 'var(--text-muted)' }}>Estimating your typical travel back and forth each week.</p>
                </div>
              )}

              <div className="pt-4 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-ghost flex items-center gap-2 flex-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary flex items-center gap-2 flex-1"
                  style={{ background: 'var(--accent-blue)' }}
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: DIET */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: 'var(--brand-glow)', border: '1px solid var(--border-default)', color: 'var(--accent-blue)' }}>
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Dietary Profile</h1>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>What does your typical weekly plate look like?</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold font-heading block" style={{ color: 'var(--text-secondary)' }}>Diet Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['omnivore', 'flexitarian', 'vegetarian', 'vegan'] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setDiet(item)}
                      className="p-3.5 rounded-xl border text-center font-heading text-xs font-bold capitalize transition-all cursor-pointer"
                      style={{
                        borderColor: diet === item ? 'var(--accent-blue)' : 'var(--border-subtle)',
                        background: diet === item ? 'var(--brand-glow-lg)' : 'var(--bg-elevated)',
                        color: diet === item ? 'var(--accent-blue)' : 'var(--text-muted)',
                        boxShadow: diet === item ? '0 4px 12px var(--brand-glow)' : 'none'
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {diet === 'flexitarian' && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold font-heading" style={{ color: 'var(--text-secondary)' }}>Meat Meals per Week</label>
                    <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent-blue)' }}>{meatMeals} meals</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={meatMeals}
                    onChange={(e) => setMeatMeals(parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: 'var(--accent-blue)', background: 'var(--bg-elevated)' }}
                  />
                  <p className="text-[10px] mt-1.5 font-mono" style={{ color: 'var(--text-muted)' }}>Meals containing beef, chicken, pork, or fish.</p>
                </div>
              )}

              <div className="pt-4 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-ghost flex items-center gap-2 flex-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary flex items-center gap-2 flex-1"
                  style={{ background: 'var(--accent-blue)' }}
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: UTILITIES */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: 'var(--brand-glow)', border: '1px solid var(--border-default)', color: 'var(--accent-blue)' }}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="font-heading font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Utilities Usage</h1>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Estimate your monthly home consumption.</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold font-heading" style={{ color: 'var(--text-secondary)' }}>Electricity Usage</label>
                  <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent-blue)' }}>{electricity} kWh/mo</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="25"
                  value={electricity}
                  onChange={(e) => setElectricity(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: 'var(--accent-blue)', background: 'var(--bg-elevated)' }}
                />
                <p className="text-[10px] mt-1.5 font-mono" style={{ color: 'var(--text-muted)' }}>Average apartment uses 200-300, house uses 500-800 kWh.</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold font-heading" style={{ color: 'var(--text-secondary)' }}>Water Consumption</label>
                  <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent-blue)' }}>{water.toLocaleString()} Liters/mo</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="20000"
                  step="500"
                  value={water}
                  onChange={(e) => setWater(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ accentColor: 'var(--accent-blue)', background: 'var(--bg-elevated)' }}
                />
                <p className="text-[10px] mt-1.5 font-mono" style={{ color: 'var(--text-muted)' }}>Typical per-person monthly water usage is around 3,000 liters.</p>
              </div>

              <div className="pt-4 flex justify-between gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-ghost flex items-center gap-2 flex-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={computeBaseline}
                  className="btn-primary flex items-center gap-2 flex-1 text-white"
                  style={{ background: 'var(--accent-green)', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)' }}
                >
                  Calculate Baseline <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: REVEAL SCREEN */}
          {step === 5 && (
            <motion.form
              key="step5"
              onSubmit={handleFinish}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-full mb-1" style={{ background: 'var(--brand-glow)', border: '1px solid var(--border-default)' }}>
                  <Leaf className="w-8 h-8 animate-bounce" style={{ color: 'var(--accent-green)' }} />
                </div>
                <h1 className="font-heading font-extrabold text-2xl" style={{ color: 'var(--text-primary)' }}>Baseline Revealed!</h1>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Here is your starting carbon footprint.</p>
              </div>

              {/* Monthly footprint badge */}
              <div className="border rounded-2xl p-6 text-center shadow-inner relative overflow-hidden" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-default)' }}>
                <div className="absolute inset-0 pointer-events-none bg-radial-gradient from-emerald-500/5 to-transparent" />
                <span className="text-xs uppercase tracking-widest font-mono font-bold" style={{ color: 'var(--text-muted)' }}>My Monthly Baseline</span>
                <div className="text-5xl font-heading font-extrabold mt-2" style={{ color: 'var(--accent-blue)' }}>
                  {calculatedFootprint} <span className="text-lg font-medium" style={{ color: 'var(--text-muted)' }}>kg CO2e</span>
                </div>
                
                {/* Peer comparison analogy */}
                <div className="mt-4 pt-4 border-t text-xs space-y-2 text-left leading-relaxed" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full block shrink-0" style={{ background: 'var(--accent-amber)' }} />
                    <span style={{ color: 'var(--text-muted)' }}>
                      Equivalent to driving a gasoline car <strong style={{ color: 'var(--text-primary)' }}>{Math.round((calculatedFootprint || 0) / 0.192).toLocaleString()} km</strong>.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full block shrink-0" style={{ background: 'var(--accent-green)' }} />
                    <span style={{ color: 'var(--text-muted)' }}>
                      Requires <strong style={{ color: 'var(--text-primary)' }}>{Math.round((calculatedFootprint || 0) / 1.8)}</strong> tree seedlings growing for 10 years to offset.
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <h2 className="text-sm font-bold font-heading flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <UserIcon className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} /> Complete your EcoLoop Profile
                </h2>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono block mb-1" style={{ color: 'var(--text-muted)' }}>Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Navdeep"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-mono block mb-1" style={{ color: 'var(--text-muted)' }}>Your Email</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. navdeep@ecoloop.org"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="btn-ghost flex-1 py-3"
                >
                  Edit Answers
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-2 py-3 flex items-center justify-center gap-2 text-white"
                  style={{ background: 'var(--accent-blue)' }}
                >
                  {loading ? 'Entering Loop...' : 'Enter the Loop!'} <Leaf className="w-4 h-4" />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
