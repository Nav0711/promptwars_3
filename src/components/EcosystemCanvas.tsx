'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';

interface EcosystemCanvasProps {
  healthScore: number;
  weatherState: string;
  unlockedAssets?: string[];
}

export default React.memo(function EcosystemCanvas({
  healthScore = 75,
  weatherState = 'clear',
  unlockedAssets = []
}: EcosystemCanvasProps) {
  const { isDark } = useTheme();

  const assets = useMemo(() => {
    if (Array.isArray(unlockedAssets)) return unlockedAssets;
    try {
      if (typeof unlockedAssets === 'string') return JSON.parse(unlockedAssets);
    } catch { return []; }
    return [];
  }, [unlockedAssets]);

  // ── Ecosystem Tiers (from PRD) ──────────────────────────────────────────
  // Tier 5: 70-100 (Clear, Lush, 2-3 fauna)
  // Tier 4: 50-69  (Clear, Healthy, 1 fauna)
  // Tier 3: 30-49  (Cloudy, Neutral, no fauna)
  // Tier 2: 15-29  (Polluted, Wilting, smog)
  // Tier 1: 0-14   (Stormy, Dead trees, rain)
  const tier = healthScore >= 70 ? 5 : healthScore >= 50 ? 4 : healthScore >= 30 ? 3 : healthScore >= 15 ? 2 : 1;
  
  const showBird = (assets.includes('asset_bird') || assets.length === 0) && tier >= 4;
  const showFireflies = tier === 5;
  const showButterfly = tier === 5;
  
  const visualWeather = tier >= 4 ? 'CLEAR' : tier === 3 ? 'CLOUDY' : tier === 2 ? 'POLLUTED' : 'STORMY';

  // Color theming based on ecosystem tier + dark/light
  const p = useMemo(() => {
    const isT1 = tier === 1; // Stormy
    const isT2 = tier === 2; // Polluted
    const isT3 = tier === 3; // Cloudy
    const isT4 = tier === 4; // Clear (Healthy)
    const isT5 = tier === 5; // Clear (Lush)

    const skyTop    = isDark ? (isT1 ? '#0f172a' : isT2 ? '#1c1917' : isT3 ? '#1e1b4b' : '#0f172a') : (isT1 ? '#475569' : isT2 ? '#78716c' : isT3 ? '#7dd3fc' : '#38bdf8');
    const skyMid    = isDark ? (isT1 ? '#1e293b' : isT2 ? '#292524' : isT3 ? '#312e81' : '#1e1b4b') : (isT1 ? '#64748b' : isT2 ? '#a8a29e' : isT3 ? '#bae6fd' : '#7dd3fc');
    const skyBot    = isDark ? (isT1 ? '#334155' : isT2 ? '#44403c' : isT3 ? '#4338ca' : '#0f172a') : (isT1 ? '#94a3b8' : isT2 ? '#d6d3d1' : isT3 ? '#e0f2fe' : '#bae6fd');

    // Grass + ground
    const grassTop  = isT1 ? '#4b5563' : isT2 ? '#78350f' : isT3 ? '#4d7c2a' : isT4 ? '#3a8f2e' : '#22c55e';
    const grassMid  = isT1 ? '#374151' : isT2 ? '#a16207' : isT3 ? '#5b9136' : isT4 ? '#4caf35' : '#4ade80';
    const grassLight= isT1 ? '#6b7280' : isT2 ? '#ca8a04' : isT3 ? '#7db74a' : isT4 ? '#6dcd52' : '#86efac';
    const dirtTop   = isT1 ? '#1f130c' : isT2 ? '#291507' : isT3 ? '#4a3017' : '#5c3d1e';
    const dirtMid   = isT1 ? '#2c1a0f' : isT2 ? '#3b1f0b' : isT3 ? '#63401e' : '#7a4e2e';
    const dirtLight = isT1 ? '#3c2314' : isT2 ? '#4d270e' : isT3 ? '#7e5227' : '#9c6a3e';

    // Foliage
    const leafDark   = isT1 ? '#374151' : isT2 ? '#451a03' : isT3 ? '#234a17' : isT4 ? '#1a5c10' : '#14532d';
    const leafMid    = isT1 ? '#4b5563' : isT2 ? '#78350f' : isT3 ? '#346b23' : isT4 ? '#278c18' : '#16a34a';
    const leafLight  = isT1 ? '#6b7280' : isT2 ? '#b45309' : isT3 ? '#499133' : isT4 ? '#3db82a' : '#22c55e';
    const leafBright = isT1 ? '#9ca3af' : isT2 ? '#d97706' : isT3 ? '#62b545' : isT4 ? '#5dd64a' : '#4ade80';

    // Trunk
    const trunkDark  = isT1 ? '#1c1918' : isT2 ? '#291507' : '#3b2008';
    const trunkMid   = isT1 ? '#2b2725' : isT2 ? '#3b1f0b' : '#6b4020';
    const trunkLight = isT1 ? '#423d3a' : isT2 ? '#4d270e' : '#9c6535';
    const trunkHi    = isT1 ? '#59524f' : isT2 ? '#5c3014' : '#c8894a';

    return {
      skyTop, skyMid, skyBot,
      grassTop, grassMid, grassLight,
      dirtTop, dirtMid, dirtLight,
      leafDark, leafMid, leafLight, leafBright,
      trunkDark, trunkMid, trunkLight, trunkHi,
      // Water / pond
      waterDark:  isT1 ? '#1e293b' : isT2 ? '#064e3b' : isT3 ? '#1e3a8a' : '#1a4a8a',
      waterMid:   isT1 ? '#334155' : isT2 ? '#065f46' : isT3 ? '#2563eb' : '#2563a8',
      waterLight: isT1 ? '#475569' : isT2 ? '#059669' : isT3 ? '#3b82f6' : '#3b82c4',
      waterShine: isT1 ? '#64748b' : isT2 ? '#34d399' : isT3 ? '#93c5fd' : '#7fc8f0',
      // Rocks
      rockDark: '#374151', rockMid: '#4b5563', rockLight: '#6b7280', rockHi: '#9ca3af',
      // Brick rubble
      brickDark: '#7f1d1d', brickMid: '#991b1b', brickLight: '#b91c1c',
      // Cloud
      cloud: isDark ? (isT1 ? '#334155' : '#e2e8f0') : (isT1 ? '#64748b' : '#ffffff'),
      cloudShade: isDark ? (isT1 ? '#1e293b' : '#94a3b8') : (isT1 ? '#475569' : '#d1d9e0'),
      // Sun rays
      sunCore: '#fef08a', sunMid: '#fcd34d', sunOuter: '#f59e0b', sunRay: '#fbbf24',
      // Moon
      moonFill: '#e2e8f0', moonShade: '#94a3b8',
      // Star
      star: '#ffffff',
      // Bird
      birdBody: '#2563eb', birdWing: '#60a5fa', birdBelly: '#eff6ff', birdBeak: '#fbbf24', birdEye: '#000000',
      // Apple / Pear / Blossom
      appleRed: '#dc2626', appleHi: '#f87171', appleDark: '#7f1d1d', appleStem: '#78350f',
      pearYellow: '#ca8a04', pearHi: '#fde047', pearDark: '#713f12',
      blossomPink: '#f472b6', blossomLight: '#fbcfe8',
      // Shadow
      shadow: 'rgba(0,0,0,0.4)',
      // Firefly
      firefly: isDark ? '#fef08a' : 'transparent',
      // Butterfly
      bflyWing: '#a855f7', bflyBody: '#000000',
      // HUD
      hudBorder: tier >= 4 ? '#22c55e' : tier === 3 ? '#eab308' : tier === 2 ? '#f97316' : '#ef4444',
      hudGlow: tier >= 4 ? '#166534' : tier === 3 ? '#a16207' : tier === 2 ? '#c2410c' : '#7f1d1d',
    };
  }, [tier, isDark]);

  // Random stable seeds
  const stars = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    id: i, x: 2 + (i * 47) % 156, y: 2 + (i * 31) % 52, size: i % 3 === 0 ? 1 : 0.5, delay: (i * 0.37) % 3
  })), []);
  const fireflies = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
    id: i, x: 30 + (i * 17) % 100, y: 50 + (i * 13) % 40, delay: i * 0.4
  })), []);

  // ── Procedural leaf cloud around canopy apex ──────────────────────────────
  // Dense, gapless canopy built from overlapping blobs
  const canopyBlobs = useMemo(() => {
    const blobs: {x:number,y:number,w:number,h:number,color:string,h_th:number}[] = [];
    const CX = 80, CY = 40;
    const seed = [
      // ── Core centre (visible immediately) ──
      {dx:  0,dy:  0, w:24, h:18, h_th:  5},
      {dx: -6,dy: -4, w:22, h:16, h_th:  5},
      {dx:  6,dy: -4, w:22, h:16, h_th:  5},
      {dx:  0,dy: -8, w:20, h:14, h_th:  5},
      {dx:  0,dy:  6, w:20, h:12, h_th:  5},
      // ── Mid ring (fills around the core) ──
      {dx:-16,dy: -2, w:22, h:16, h_th:  5},
      {dx: 16,dy: -2, w:22, h:16, h_th:  5},
      {dx:-10,dy:-14, w:20, h:16, h_th:  5},
      {dx: 10,dy:-14, w:20, h:16, h_th:  5},
      {dx:-18,dy:-10, w:18, h:14, h_th: 10},
      {dx: 18,dy:-10, w:18, h:14, h_th: 10},
      {dx:-12,dy:  6, w:18, h:12, h_th: 10},
      {dx: 12,dy:  6, w:18, h:12, h_th: 10},
      {dx:  0,dy:-18, w:18, h:14, h_th: 10},
      // ── Outer ring (grows with health) ──
      {dx:-24,dy: -2, w:18, h:14, h_th: 15},
      {dx: 24,dy: -2, w:18, h:14, h_th: 15},
      {dx:-20,dy:-16, w:16, h:14, h_th: 20},
      {dx: 20,dy:-16, w:16, h:14, h_th: 20},
      {dx:-26,dy:-10, w:14, h:12, h_th: 25},
      {dx: 26,dy:-10, w:14, h:12, h_th: 25},
      {dx: -8,dy:-24, w:18, h:12, h_th: 25},
      {dx:  8,dy:-24, w:18, h:12, h_th: 25},
      {dx:  0,dy:-28, w:16, h:12, h_th: 30},
      {dx:-16,dy: 10, w:16, h:10, h_th: 30},
      {dx: 16,dy: 10, w:16, h:10, h_th: 30},
      {dx:  0,dy: 14, w:18, h:10, h_th: 30},
      // ── Crown tips (high health luxury) ──
      {dx:-30,dy: -4, w:12, h:12, h_th: 40},
      {dx: 30,dy: -4, w:12, h:12, h_th: 40},
      {dx:-28,dy:-18, w:12, h:10, h_th: 45},
      {dx: 28,dy:-18, w:12, h:10, h_th: 45},
      {dx:  0,dy:-34, w:14, h:10, h_th: 45},
      {dx:-14,dy:-30, w:14, h:10, h_th: 50},
      {dx: 14,dy:-30, w:14, h:10, h_th: 50},
      {dx:-34,dy:-14, w:10, h:10, h_th: 55},
      {dx: 34,dy:-14, w:10, h:10, h_th: 55},
      {dx:  0,dy:-38, w:12, h: 8, h_th: 60},
      {dx:-10,dy:-36, w:12, h: 8, h_th: 65},
      {dx: 10,dy:-36, w:12, h: 8, h_th: 65},
      // ── Very top apex (flourishing) ──
      {dx: -4,dy:-42, w:10, h: 8, h_th: 75},
      {dx:  4,dy:-42, w:10, h: 8, h_th: 75},
      {dx:  0,dy:-46, w: 8, h: 6, h_th: 85},
      {dx:-36,dy: -6, w: 8, h: 8, h_th: 80},
      {dx: 36,dy: -6, w: 8, h: 8, h_th: 80},
      {dx:-22,dy: 12, w:12, h: 8, h_th: 70},
      {dx: 22,dy: 12, w:12, h: 8, h_th: 70},
      // ── Gap-filler patches (centre seams) ──
      {dx: -4,dy: -2, w:10, h:10, h_th:  5},
      {dx:  4,dy: -2, w:10, h:10, h_th:  5},
      {dx: -8,dy: -8, w:12, h:10, h_th:  5},
      {dx:  8,dy: -8, w:12, h:10, h_th:  5},
      {dx:  0,dy:-12, w:14, h:10, h_th:  5},
    ];
    const colorCycle = [p.leafMid, p.leafLight, p.leafDark, p.leafBright, p.leafLight, p.leafMid, p.leafMid, p.leafLight];
    seed.forEach((s, i) => {
      blobs.push({
        x: CX + s.dx - s.w/2,
        y: CY + s.dy - s.h/2,
        w: s.w, h: s.h,
        color: colorCycle[i % colorCycle.length],
        h_th: s.h_th
      });
    });
    return blobs;
  }, [p]);

  // Fruits & blossoms sprinkled throughout canopy
  const fruits = useMemo(() => {
    if (healthScore < 55) return [];
    return [
      {x: 56, y: 48, type: 'apple'  },
      {x: 92, y: 44, type: 'pear'   },
      {x: 70, y: 36, type: 'apple'  },
      {x: 85, y: 30, type: 'blossom'},
      {x: 60, y: 58, type: 'pear'   },
      {x:100, y: 52, type: 'blossom'},
      {x: 50, y: 55, type: 'apple'  },
      {x: 76, y: 22, type: 'apple'  },
      {x: 64, y: 28, type: 'blossom'},
      {x: 96, y: 36, type: 'pear'   },
      {x: 54, y: 38, type: 'apple'  },
      {x:104, y: 42, type: 'blossom'},
      {x: 80, y: 16, type: 'pear'   },
      {x: 68, y: 54, type: 'apple'  },
      {x: 88, y: 56, type: 'pear'   },
    ];
  }, [healthScore]);

  const leafRippleBlocks = useMemo(() => {
    // Dithered edge blocks around entire canopy perimeter
    return [
      // Bottom edge
      {x:50,y:54},{x:54,y:56},{x:58,y:58},{x:62,y:60},{x:66,y:62},{x:74,y:62},{x:82,y:62},{x:86,y:60},{x:90,y:58},{x:94,y:56},{x:98,y:54},{x:102,y:52},{x:106,y:50},
      // Left edge
      {x:44,y:48},{x:42,y:44},{x:42,y:40},{x:44,y:36},{x:46,y:32},{x:48,y:28},{x:50,y:24},
      // Right edge
      {x:112,y:48},{x:114,y:44},{x:114,y:40},{x:112,y:36},{x:110,y:32},{x:108,y:28},{x:106,y:24},
      // Top edge
      {x:54,y:20},{x:58,y:16},{x:62,y:14},{x:66,y:12},{x:70,y:10},{x:74,y: 8},{x:78,y: 6},{x:82,y: 6},{x:86,y: 8},{x:90,y:10},{x:94,y:12},{x:98,y:14},{x:102,y:16},
      // Scattered inner detail specks
      {x:60,y:40},{x:70,y:30},{x:90,y:30},{x:100,y:40},{x:76,y:48},{x:84,y:48},{x:68,y:20},{x:92,y:20},
    ];
  }, []);

  // ── Blocky Trunk Data ─────────────────────────────────────────────────────
  const trunkSegments = useMemo(() => {
    // Generate pseudo-random branch variations based on healthScore
    const rand = (healthScore * 17) % 100;
    
    // Core trunk & roots
    const base = [
      {x:68,y:60,w:8,h:8},{x:76,y:60,w:8,h:8},{x:84,y:60,w:8,h:8},
      {x:68,y:68,w:8,h:8},{x:76,y:68,w:8,h:8},{x:84,y:68,w:8,h:8},
      {x:68,y:76,w:8,h:8},{x:76,y:76,w:8,h:8},{x:84,y:76,w:8,h:8},
      {x:68,y:84,w:8,h:8},{x:76,y:84,w:8,h:8},{x:84,y:84,w:8,h:8},
      {x:72,y:92,w:8,h:8},{x:80,y:92,w:8,h:4},
      // Root flare
      {x:60,y:88,w:8,h:8},{x:68,y:88,w:8,h:8},{x:84,y:88,w:8,h:8},{x:92,y:88,w:8,h:8},
      {x:56,y:92,w:8,h:8},{x:64,y:92,w:8,h:8},{x:88,y:92,w:8,h:8},{x:96,y:92,w:8,h:8},
      {x:52,y:96,w:8,h:4},{x:100,y:96,w:8,h:4},
      // Upward branch stubs
      {x:64,y:56,w:8,h:8},{x:88,y:56,w:8,h:8},
      {x:72,y:52,w:8,h:8},{x:80,y:52,w:8,h:8},
      // Bark knots
      {x:72,y:72,w:4,h:4},{x:82,y:80,w:4,h:4},
    ];

    const leftBranchArm = [
      {x:52,y:68,w:16,h:6}, // Base left branch
      {x:44,y:64,w:12,h:6}, // Mid left branch
      {x:36,y:60,w:10,h:6}, // Outer left branch
    ];
    
    const rightBranchArm = [
      {x:92,y:68,w:16,h:6},  // Base right branch
      {x:104,y:64,w:12,h:6}, // Mid right branch
      {x:114,y:60,w:10,h:6}, // Outer right branch
    ];

    // Calculate visible branch segments pseudo-randomly based on healthScore
    // making the branches visibly grow and shrink (up to 3 segments max per side)
    const leftVisible = Math.max(0, Math.min(3, Math.floor((healthScore + (rand % 20)) / 25)));
    const rightVisible = Math.max(0, Math.min(3, Math.floor((healthScore + ((rand + 30) % 20)) / 25)));

    return [
      ...base,
      ...leftBranchArm.slice(0, leftVisible),
      ...rightBranchArm.slice(0, rightVisible)
    ];
  }, [healthScore]);

  // Grass ground blocks (16-bit detailed)
  const groundGrassBlocks = useMemo(() => {
    const blocks = [];
    for (let bx = 0; bx < 160; bx += 8) {
      blocks.push({x: bx, gType: Math.floor(bx/8) % 3});
    }
    return blocks;
  }, []);

  // Rain drops for Tier 1 (Stormy)
  const raindrops = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i, x: Math.random() * 200 - 20, delay: Math.random() * 2, duration: 0.5 + Math.random() * 0.5
  })), []);

  // Smog particles for Tier 2 (Polluted)
  const smogParticles = useMemo(() => Array.from({ length: 25 }).map((_, i) => ({
    id: i, x: Math.random() * 160, y: Math.random() * 100, delay: Math.random() * 5, scale: 0.5 + Math.random() * 1.5
  })), []);

  return (
    <figure
      className="w-full h-full min-h-[300px] relative overflow-hidden rounded-2xl transition-all duration-300"
      style={{ border: '2px solid var(--border-default)', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)' }}
    >
      <figcaption className="sr-only">Ecosystem Canvas showing your current environment health: {weatherState}</figcaption>
      {/* Scanline CRT effect */}
      <div
        className="absolute inset-0 pointer-events-none z-20 opacity-20 mix-blend-overlay"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.8) 50%)',
          backgroundSize: '100% 4px'
        }}
        aria-hidden="true"
      />
      {/* CRT vignette */}
      <div className="absolute inset-0 pointer-events-none z-20 rounded-2xl" style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.7)' }} aria-hidden="true" />

      {/*
        Fix 6: aria-live polite region — announces health score tier changes
        to screen readers without interrupting current speech.
        Visually hidden via position:absolute / overflow:hidden technique.
      */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: '1px', height: '1px',
          padding: 0, margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
          zIndex: 0
        }}
      >
        {tier === 5 ? `Ecosystem is thriving (Health: ${healthScore}/100). Lush, green with fireflies.` :
         tier === 4 ? `Ecosystem is healthy (Health: ${healthScore}/100). Clear skies with wildlife.` :
         tier === 3 ? `Ecosystem is recovering (Health: ${healthScore}/100). Partly cloudy.` :
         tier === 2 ? `Ecosystem is stressed (Health: ${healthScore}/100). Polluted with smog.` :
         `Ecosystem is critical (Health: ${healthScore}/100). Stormy with dead trees.`}
      </div>


      {/* ── MAIN SVG SCENE ────────────────────────────────────────────── */}
      <svg
        viewBox="0 0 160 120"
        className="w-full h-full"
        style={{ shapeRendering: 'crispEdges', imageRendering: 'pixelated' }}
        role="img"
        aria-labelledby="eco-title eco-desc"
      >
        <title id="eco-title">Ecosystem Visualizer</title>
        <desc id="eco-desc">
          A {weatherState.toLowerCase()} ecosystem with a health score of {healthScore}.
          {tier === 5 ? ' Lush, green with fireflies and butterflies.' :
           tier === 4 ? ' Healthy and clear with a bird flying.' :
           tier === 3 ? ' Cloudy and neutral.' :
           tier === 2 ? ' Polluted and wilting with smog.' :
           ' Stormy with rain and dead trees.'}
        </desc>
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={p.skyTop} />
            <stop offset="50%"  stopColor={p.skyMid} />
            <stop offset="100%" stopColor={p.skyBot} />
          </linearGradient>
          <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={p.dirtTop} />
            <stop offset="40%"  stopColor={p.dirtMid} />
            <stop offset="100%" stopColor={p.dirtMid} />
          </linearGradient>
          <filter id="px-shadow" x="-10%" y="-10%" width="130%" height="140%">
            <feDropShadow dx="2" dy="2" stdDeviation="0" floodColor="#000" floodOpacity="0.6" />
          </filter>
        </defs>

        <g aria-hidden="true">
          {/* ── Sky ─────────────────────────────────────────────────────── */}
          <rect x="0" y="0" width="160" height="120" fill="url(#skyGrad)" />

        {/* Stars (dark mode only) */}
        {isDark && stars.map(s => (
          <motion.rect
            key={`s${s.id}`} x={s.x} y={s.y} width={s.size} height={s.size} fill={p.star}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ repeat: Infinity, duration: 1.5 + s.delay, delay: s.delay }}
          />
        ))}

        {/* ── Sun ─────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {!isDark && tier >= 3 && (
            <motion.g key="sun" initial={{ opacity: 0, y: 8 }} animate={{ opacity: tier === 3 ? 0.3 : 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
              {/* Rays */}
              {[0,45,90,135,180,225,270,315].map((angle, i) => {
                const rad = (angle * Math.PI) / 180;
                const x1 = 134 + Math.cos(rad) * 9;
                const y1 = 12 + Math.sin(rad) * 9;
                const x2 = 134 + Math.cos(rad) * 14;
                const y2 = 12 + Math.sin(rad) * 14;
                return (
                  <motion.line
                    key={`ray${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={p.sunRay} strokeWidth={i % 2 === 0 ? 2 : 1}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 3, delay: i * 0.2 }}
                  />
                );
              })}
              {/* Sun core pixelated blocks */}
              <rect x="127" y="5"  width="14" height="14" fill={p.sunOuter} />
              <rect x="129" y="7"  width="10" height="10" fill={p.sunMid}   />
              <rect x="131" y="9"  width="6"  height="6"  fill={p.sunCore}  />
              {/* Dithering */}
              <rect x="128" y="6"  width="1"  height="1"  fill={p.sunMid}   opacity="0.6" />
              <rect x="140" y="6"  width="1"  height="1"  fill={p.sunMid}   opacity="0.6" />
              <rect x="128" y="18" width="1"  height="1"  fill={p.sunMid}   opacity="0.6" />
              <rect x="140" y="18" width="1"  height="1"  fill={p.sunMid}   opacity="0.6" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ── Moon ─────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {isDark && tier >= 3 && (
            <motion.g key="moon" initial={{ opacity: 0 }} animate={{ opacity: tier === 3 ? 0.4 : 1 }} exit={{ opacity: 0 }} transform="translate(128, 8)">
              <rect x="4"  y="0"  width="8"  height="4"  fill={p.moonFill}  />
              <rect x="2"  y="4"  width="8"  height="4"  fill={p.moonFill}  />
              <rect x="0"  y="8"  width="8"  height="8"  fill={p.moonFill}  />
              <rect x="2"  y="16" width="8"  height="4"  fill={p.moonFill}  />
              <rect x="4"  y="20" width="8"  height="4"  fill={p.moonFill}  />
              <rect x="8"  y="4"  width="4"  height="4"  fill={p.moonShade} opacity="0.5" />
              <rect x="8"  y="12" width="4"  height="8"  fill={p.moonShade} opacity="0.5" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ── Clouds ───────────────────────────────────────────────────── */}
        <motion.g animate={{ x: [-70, 180] }} transition={{ repeat: Infinity, duration: 55, ease: 'linear' }} opacity={isDark ? (tier === 3 ? 0.5 : tier === 1 ? 0.7 : 0.25) : (tier === 3 ? 0.95 : tier === 1 ? 0.8 : 0.9)}>
          <rect x="0"  y="14" width="30" height="6" fill={p.cloud}      />
          <rect x="4"  y="10" width="22" height="4" fill={p.cloud}      />
          <rect x="8"  y="8"  width="14" height="4" fill={p.cloud}      />
          <rect x="4"  y="20" width="22" height="4" fill={p.cloudShade} />
          <rect x="0"  y="20" width="4"  height="2" fill={p.cloudShade} opacity="0.5" />
        </motion.g>
        <motion.g animate={{ x: [180, -70] }} transition={{ repeat: Infinity, duration: 80, ease: 'linear' }} opacity={isDark ? (tier <= 3 ? 0.4 : 0.15) : (tier <= 3 ? 0.8 : 0.6)}>
          <rect x="0"  y="28" width="24" height="6" fill={p.cloud}      />
          <rect x="4"  y="24" width="16" height="4" fill={p.cloud}      />
          <rect x="4"  y="34" width="20" height="4" fill={p.cloudShade} />
        </motion.g>

        {/* ── Tier 1: Stormy Rain ──────────────────────────────────── */}
        {tier === 1 && raindrops.map(r => (
          <motion.line
            key={`rain${r.id}`}
            x1={r.x} y1="-10" x2={r.x - 10} y2="130"
            stroke={isDark ? '#64748b' : '#94a3b8'} strokeWidth="1" opacity="0.6"
            initial={{ y: -140, x: 20 }}
            animate={{ y: 0, x: 0 }}
            transition={{ repeat: Infinity, duration: r.duration, delay: r.delay, ease: 'linear' }}
          />
        ))}

        {/* ── Tier 2: Polluted Smog ────────────────────────────────── */}
        {tier <= 2 && (
          <>
            {/* Base haze */}
            <rect x="0" y="60" width="160" height="40" fill={isDark ? '#44403c' : '#a8a29e'} opacity="0.3" />
            <rect x="0" y="80" width="160" height="20" fill={isDark ? '#292524' : '#78716c'} opacity="0.4" />
            
            {/* Drifting smog particles */}
            {tier === 2 && smogParticles.map(sp => (
              <motion.rect
                key={`smog${sp.id}`} x={sp.x} y={sp.y} width={sp.scale * 4} height={sp.scale * 2}
                fill={isDark ? '#57534e' : '#d6d3d1'} opacity="0.6"
                animate={{ x: [sp.x, sp.x + 20, sp.x], y: [sp.y, sp.y - 10, sp.y], opacity: [0, 0.6, 0] }}
                transition={{ repeat: Infinity, duration: 10 + sp.delay, delay: sp.delay, ease: 'easeInOut' }}
              />
            ))}
          </>
        )}

        {/* ── Background hill silhouettes ──────────────────────────── */}
        <rect x="0"   y="88" width="50"  height="20" fill={tier <= 2 ? (isDark ? '#1c1918' : '#3f3b38') : '#2d5a1e'} />
        <rect x="30"  y="83" width="40"  height="25" fill={tier <= 2 ? (isDark ? '#292524' : '#4f4a47') : '#366b23'} />
        <rect x="110" y="85" width="50"  height="20" fill={tier <= 2 ? (isDark ? '#1c1918' : '#3f3b38') : '#2d5a1e'} />
        <rect x="120" y="80" width="40"  height="28" fill={tier <= 2 ? (isDark ? '#292524' : '#4f4a47') : '#366b23'} />

        {/* ── POND (left ecosystem) ────────────────────────────────── */}
        <motion.g animate={{ opacity: tier <= 2 ? 0.6 : 1 }} transition={{ duration: 1 }}>
          {/* Pond water */}
          <rect x="8"  y="98"  width="28" height="10" fill={p.waterMid}   />
          <rect x="10" y="99"  width="24" height="6"  fill={p.waterDark}  />
          <rect x="12" y="100" width="20" height="4"  fill={p.waterMid}   />
          {/* Shimmer */}
          <motion.rect x="14" y="101" width="4" height="1" fill={p.waterShine}
            animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }} />
          <motion.rect x="24" y="102" width="4" height="1" fill={p.waterShine}
            animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2.4, delay: 0.6 }} />
          {/* Pond edge blocks */}
          <rect x="8"   y="97"  width="4"  height="4" fill={p.dirtLight}  />
          <rect x="32"  y="97"  width="4"  height="4" fill={p.dirtLight}  />
          <rect x="9"   y="107" width="26" height="2" fill={p.dirtMid}    />
        </motion.g>

        {/* ── ROCK FORMATION (right ecosystem) ──────────────────── */}
        <g>
          <rect x="118" y="95"  width="12" height="8"  fill={p.rockDark}  />
          <rect x="120" y="93"  width="10" height="6"  fill={p.rockMid}   />
          <rect x="122" y="91"  width="6"  height="4"  fill={p.rockLight} />
          <rect x="122" y="91"  width="2"  height="2"  fill={p.rockHi}    />
          <rect x="128" y="97"  width="8"  height="6"  fill={p.rockMid}   />
          <rect x="130" y="96"  width="6"  height="4"  fill={p.rockLight} />
          <rect x="130" y="96"  width="2"  height="2"  fill={p.rockHi}    />
        </g>

        {/* ── Brick rubble (right side) ─────────────────────────── */}
        {healthScore < 60 && (
          <g>
            <rect x="112" y="102" width="8" height="4" fill={p.brickMid}   />
            <rect x="118" y="100" width="6" height="4" fill={p.brickLight} />
            <rect x="112" y="102" width="4" height="2" fill={p.brickDark}  />
          </g>
        )}

        {/* ── GROUND LAYER ─────────────────────────────────────────── */}
        {/* Dirt blocks layered */}
        <rect x="0" y="104" width="160" height="16" fill="url(#groundGrad)" />
        {/* Dirt block texture lines */}
        {groundGrassBlocks.map((blk, i) => (
          <g key={`d${i}`}>
            <rect x={blk.x}   y={104} width={7}  height={7}  fill={i%2===0 ? p.dirtLight : p.dirtMid}  />
            <rect x={blk.x+1} y={108} width={2}  height={2}  fill={p.dirtTop}                          opacity="0.5" />
            <rect x={blk.x+4} y={106} width={2}  height={2}  fill={p.dirtLight}                        opacity="0.5" />
          </g>
        ))}
        {/* Grass blocks */}
        {groundGrassBlocks.map((blk, i) => (
          <g key={`g${i}`}>
            <rect x={blk.x}   y={97}  width={8}  height={7}  fill={[p.grassTop, p.grassMid, p.grassLight][blk.gType]} />
            <rect x={blk.x}   y={97}  width={8}  height={2}  fill={p.grassLight} opacity="0.5" />
            <rect x={blk.x}   y={102} width={8}  height={2}  fill={p.grassTop}   opacity="0.6" />
            <rect x={blk.x+1} y={98}  width={1}  height={5}  fill={p.grassLight} opacity="0.3" />
          </g>
        ))}
        {/* Grass tufts */}
        {healthScore >= 20 && [12, 28, 44, 108, 124, 140].map((gx, i) => (
          <motion.g key={`tuft${i}`}
            animate={{ skewX: [-3, 3, -3] }}
            transition={{ repeat: Infinity, duration: 2.5 + i*0.3, ease: "easeInOut" }}
            style={{ originX: `${gx + 2}px`, originY: '96px' }}
          >
            <rect x={gx}   y={94} width={2} height={4} fill={p.grassLight} />
            <rect x={gx+3} y={93} width={2} height={5} fill={p.grassMid}   />
            <rect x={gx+6} y={95} width={2} height={3} fill={p.grassLight} />
          </motion.g>
        ))}

        {/* ── Side bushes ──────────────────────────────────────── */}
        {healthScore >= 25 && (
          <>
            {/* Left bush cluster — large & dense */}
            <g>
              <rect x="14" y="94" width="20" height="6" fill={p.leafDark}  />
              <rect x="16" y="92" width="16" height="4" fill={p.leafMid}   />
              <rect x="18" y="90" width="12" height="4" fill={p.leafLight} />
              <rect x="20" y="88" width="8"  height="4" fill={p.leafBright}/>
              <rect x="14" y="94" width="4"  height="2" fill={p.leafMid}   opacity="0.7" />
              <rect x="30" y="94" width="4"  height="2" fill={p.leafDark}  opacity="0.7" />
              <rect x="22" y="88" width="2"  height="2" fill={p.leafBright} opacity="0.8" />
              {/* Dithered texture */}
              <rect x="17" y="93" width="2"  height="1" fill={p.leafBright} opacity="0.4" />
              <rect x="25" y="91" width="2"  height="1" fill={p.leafDark}   opacity="0.4" />
              <rect x="20" y="95" width="2"  height="1" fill={p.leafLight}  opacity="0.4" />
            </g>

            {/* Mid-left bush */}
            <g>
              <rect x="38" y="94" width="14" height="4" fill={p.leafDark}  />
              <rect x="40" y="92" width="10" height="4" fill={p.leafMid}   />
              <rect x="42" y="90" width="6"  height="4" fill={p.leafLight} />
              <rect x="43" y="90" width="2"  height="2" fill={p.leafBright} opacity="0.6" />
            </g>

            {/* Right bush cluster — large & dense */}
            <g>
              <rect x="126" y="94" width="22" height="6" fill={p.leafDark}  />
              <rect x="128" y="92" width="18" height="4" fill={p.leafMid}   />
              <rect x="130" y="90" width="14" height="4" fill={p.leafLight} />
              <rect x="132" y="88" width="10" height="4" fill={p.leafBright}/>
              <rect x="126" y="94" width="4"  height="2" fill={p.leafMid}   opacity="0.7" />
              <rect x="144" y="94" width="4"  height="2" fill={p.leafDark}  opacity="0.7" />
              <rect x="136" y="88" width="2"  height="2" fill={p.leafBright} opacity="0.8" />
              {/* Dithered texture */}
              <rect x="131" y="93" width="2"  height="1" fill={p.leafBright} opacity="0.4" />
              <rect x="139" y="91" width="2"  height="1" fill={p.leafDark}   opacity="0.4" />
              <rect x="134" y="95" width="2"  height="1" fill={p.leafLight}  opacity="0.4" />
            </g>

            {/* Mid-right bush */}
            <g>
              <rect x="108" y="94" width="14" height="4" fill={p.leafDark}  />
              <rect x="110" y="92" width="10" height="4" fill={p.leafMid}   />
              <rect x="112" y="90" width="6"  height="4" fill={p.leafLight} />
              <rect x="113" y="90" width="2"  height="2" fill={p.leafBright} opacity="0.6" />
            </g>

            {/* Small seedling left of pond */}
            <motion.g animate={{ skewX: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 3 }} style={{ originX: '9px', originY: '97px' }}>
              <rect x="8"  y="94" width="2" height="4" fill={p.trunkLight}  />
              <rect x="4"  y="92" width="6" height="3"  fill={p.leafMid}    />
              <rect x="6"  y="90" width="4" height="3"  fill={p.leafLight}  />
              <rect x="7"  y="89" width="2" height="2"  fill={p.leafBright} />
            </motion.g>

            {/* Small seedling right of tree */}
            <motion.g animate={{ skewX: [-3, 3, -3] }} transition={{ repeat: Infinity, duration: 3.5, delay: 0.5 }} style={{ originX: '105px', originY: '97px' }}>
              <rect x="104" y="94" width="2" height="4" fill={p.trunkLight}  />
              <rect x="100" y="92" width="6" height="3"  fill={p.leafMid}    />
              <rect x="102" y="90" width="4" height="3"  fill={p.leafLight}  />
              <rect x="103" y="89" width="2" height="2"  fill={p.leafBright} />
            </motion.g>

            {/* Mushroom cluster near left bush */}
            {healthScore >= 50 && (
              <g>
                <rect x="48" y="95" width="1" height="3" fill={p.trunkLight} />
                <rect x="46" y="93" width="5" height="3" fill="#dc2626" />
                <rect x="47" y="93" width="1" height="1" fill="#fef08a" opacity="0.7" />
                <rect x="52" y="96" width="1" height="2" fill={p.trunkLight} />
                <rect x="51" y="94" width="3" height="2" fill="#dc2626" />
                <rect x="52" y="94" width="1" height="1" fill="#fef08a" opacity="0.7" />
              </g>
            )}

            {/* Fallen leaves / ground detail near base */}
            <rect x="62" y="96" width="2" height="1" fill={p.leafDark}   opacity="0.6" />
            <rect x="95" y="96" width="2" height="1" fill={p.leafMid}    opacity="0.5" />
            <rect x="78" y="97" width="3" height="1" fill={p.trunkLight} opacity="0.4" />
          </>
        )}

        {/* ── PIXEL TREE ───────────────────────────────────────────── */}
        <g id="tree" filter="url(#px-shadow)">
          {/* Ground shadow */}
          <ellipse cx="80" cy="100" rx="30" ry="5" fill={p.shadow} />

          {/* Trunk and branches */}
          {trunkSegments.map((seg, i) => {
            const isHighlight = seg.x < 76;
            const isShadow = seg.x > 84;
            return (
              <g key={`trunk${i}`}>
                <rect x={seg.x} y={seg.y} width={seg.w} height={seg.h} fill={p.trunkMid}  />
                {/* Left highlight strip */}
                <rect x={seg.x} y={seg.y} width={2} height={seg.h} fill={p.trunkLight} opacity="0.8" />
                {/* Right shadow strip */}
                <rect x={seg.x + seg.w - 2} y={seg.y} width={2} height={seg.h} fill={p.trunkDark} opacity="0.8" />
                {/* Bark texture dithering */}
                {seg.h >= 8 && <rect x={seg.x+3} y={seg.y+2} width={2} height={2} fill={p.trunkHi}  opacity="0.4" />}
                {seg.h >= 8 && <rect x={seg.x+5} y={seg.y+5} width={2} height={2} fill={p.trunkDark} opacity="0.4" />}
              </g>
            );
          })}

          {/* ── Leaf Canopy Blobs ──────────────────────────────── */}
          <motion.g
            animate={healthScore >= 20 ? { rotate: [-0.8, 0.8, -0.8] } : {}}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
            style={{ originX: '80px', originY: '68px' }}
          >
            <AnimatePresence>
              {canopyBlobs.map((blob, i) => {
                if (healthScore < blob.h_th) return null;
                return (
                  <motion.g
                    key={`blob${i}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    style={{ originX: `${blob.x + blob.w/2}px`, originY: `${blob.y + blob.h/2}px` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 14, delay: i * 0.02 }}
                  >
                    <rect x={blob.x}   y={blob.y}   width={blob.w}   height={blob.h}   fill={blob.color} />
                    <rect x={blob.x}   y={blob.y}   width={blob.w}   height={2}         fill={p.leafBright} opacity="0.5" />
                    <rect x={blob.x}   y={blob.y + blob.h - 2} width={blob.w} height={2} fill={p.leafDark}   opacity="0.5" />
                    <rect x={blob.x}   y={blob.y}   width={2}         height={blob.h}   fill={p.leafBright} opacity="0.3" />
                    {/* Dithered pixel noise */}
                    <rect x={blob.x+3} y={blob.y+2} width={2} height={2} fill={p.leafBright} opacity="0.25" />
                    <rect x={blob.x+7} y={blob.y+4} width={2} height={2} fill={p.leafDark}   opacity="0.25" />
                  </motion.g>
                );
              })}
            </AnimatePresence>

            {/* Leaf edge ripple blocks for dithered outline */}
            <AnimatePresence>
              {healthScore >= 15 && leafRippleBlocks.map((blk, i) => (
                <motion.rect
                  key={`lr${i}`} x={blk.x} y={blk.y} width={4} height={4}
                  fill={i % 2 === 0 ? p.leafMid : p.leafDark}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                />
              ))}
            </AnimatePresence>

            {/* Fruits & Blossoms */}
            <AnimatePresence>
              {fruits.map((fruit, i) => (
                <motion.g
                  key={`fruit${i}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  style={{ originX: `${fruit.x + 2}px`, originY: `${fruit.y + 2}px` }}
                  transition={{ type: 'spring', bounce: 0.6, delay: i * 0.05 }}
                >
                  <motion.g
                    animate={{ y: [0, -1.5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 + (i * 0.3), ease: 'easeInOut' }}
                  >
                    {fruit.type === 'apple' && (
                      <>
                        <rect x={fruit.x}   y={fruit.y}   width={5} height={5} fill={p.appleRed}    />
                        <rect x={fruit.x}   y={fruit.y}   width={2} height={2} fill={p.appleHi}     />
                        <rect x={fruit.x+4} y={fruit.y+3} width={1} height={2} fill={p.appleDark}   />
                        <rect x={fruit.x+2} y={fruit.y-2} width={1} height={3} fill={p.appleStem}   />
                      </>
                    )}
                    {fruit.type === 'pear' && (
                      <>
                        <rect x={fruit.x}   y={fruit.y+2} width={5} height={4} fill={p.pearYellow}  />
                        <rect x={fruit.x+1} y={fruit.y}   width={3} height={3} fill={p.pearYellow}  />
                        <rect x={fruit.x}   y={fruit.y+2} width={2} height={2} fill={p.pearHi}      />
                        <rect x={fruit.x+2} y={fruit.y-2} width={1} height={3} fill={p.appleStem}   />
                      </>
                    )}
                    {fruit.type === 'blossom' && (
                      <>
                        <rect x={fruit.x+1} y={fruit.y}   width={3} height={1} fill={p.blossomLight} />
                        <rect x={fruit.x}   y={fruit.y+1} width={5} height={3} fill={p.blossomPink}  />
                        <rect x={fruit.x+1} y={fruit.y+4} width={3} height={1} fill={p.blossomLight} />
                        <rect x={fruit.x+2} y={fruit.y+2} width={1} height={1} fill="#fef08a"        />
                      </>
                    )}
                  </motion.g>
                </motion.g>
              ))}
            </AnimatePresence>
          </motion.g>
        </g>

        {/* ── Fireflies (dark + tier 5) ─────────────────────────── */}
        {isDark && showFireflies && fireflies.map(f => (
          <motion.g key={`ff${f.id}`}
            animate={{ x: [f.x, f.x + 8, f.x - 5, f.x], y: [f.y, f.y - 6, f.y + 4, f.y], opacity: [0, 1, 0.5, 0] }}
            transition={{ repeat: Infinity, duration: 3 + f.delay, delay: f.delay }}
          >
            <rect x="0" y="0" width="2" height="2" fill="#fef08a" />
            <rect x="-1" y="-1" width="4" height="4" fill="#fef08a" opacity="0.25" />
          </motion.g>
        ))}

        {/* ── Butterfly (light + tier 5) ────────────────────────── */}
        <AnimatePresence>
          {!isDark && showButterfly && (
            <motion.g
              key="butterfly"
              initial={{ x: 10, y: 70, opacity: 0 }}
              animate={{ opacity: 1, x: [10, 40, 30, 60, 45, 10], y: [70, 40, 50, 30, 45, 70] }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 15, ease: 'easeInOut' }}
            >
              {/* Body */}
              <rect x="2" y="2" width="1" height="4" fill={p.bflyBody} />
              {/* Wings animated */}
              <motion.g animate={{ scaleX: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 0.15, ease: 'linear' }} style={{ originX: '2.5px' }}>
                {/* Left wing */}
                <rect x="0" y="0" width="2" height="3" fill={p.bflyWing} />
                <rect x="0" y="3" width="2" height="2" fill={p.bflyWing} opacity="0.8" />
                {/* Right wing */}
                <rect x="3" y="0" width="2" height="3" fill={p.bflyWing} />
                <rect x="3" y="3" width="2" height="2" fill={p.bflyWing} opacity="0.8" />
              </motion.g>
            </motion.g>
          )}
        </AnimatePresence>

        {/* ── BLUE BIRD ─────────────────────────────────────────── */}
        <AnimatePresence>
          {showBird && (
            <motion.g
              key="bird"
              initial={{ x: -20, opacity: 0 }}
              animate={{ opacity: 1, x: [110, 100, 116, 108], y: [30, 26, 34, 28] }}
              exit={{ x: 180, opacity: 0 }}
              transition={{ x: { repeat: Infinity, duration: 6, ease: 'easeInOut' }, y: { repeat: Infinity, duration: 4, ease: 'easeInOut' }, opacity: { duration: 0.5 } }}
            >
              {/* Body */}
              <rect x="2" y="3" width="8"  height="5"  fill={p.birdBody}  />
              <rect x="0" y="4" width="4"  height="3"  fill={p.birdWing}  />
              <rect x="4" y="2" width="6"  height="3"  fill={p.birdBody}  />
              {/* Belly */}
              <rect x="4" y="5" width="4"  height="3"  fill={p.birdBelly} />
              {/* Head */}
              <rect x="8" y="1" width="5"  height="5"  fill={p.birdBody}  />
              {/* Beak */}
              <rect x="12" y="3" width="3" height="2"  fill={p.birdBeak}  />
              {/* Eye */}
              <rect x="10" y="2" width="1" height="1"  fill={p.birdEye}   />
              {/* Wing flap */}
              <motion.g
                animate={{ scaleY: [-1, 1, -1] }}
                transition={{ repeat: Infinity, duration: 0.3 }}
                style={{ originY: '5px' }}
              >
                <rect x="0" y="2" width="5" height="4" fill={p.birdWing}  opacity="0.85" />
              </motion.g>
              {/* Tail */}
              <rect x="-2" y="5" width="4" height="2"  fill={p.birdBody}  />
            </motion.g>
          )}
        </AnimatePresence>
        </g>

      </svg>

      {/* ── RETRO HUD PANEL ─────────────────────────────────────── */}
      <div
        className="absolute top-4 left-4 z-50 flex items-center rounded-full px-3 py-2 gap-3"
        style={{
          background: isDark ? 'rgba(15,15,20,0.88)' : 'rgba(220,225,230,0.92)',
          border: `3px solid ${p.hudBorder}`,
          boxShadow: `3px 3px 0 ${p.hudGlow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
          imageRendering: 'pixelated'
        }}
      >
        {/* Indicator dot */}
        <div
          className="w-3 h-3 border border-black/50"
          style={{ background: p.hudBorder, boxShadow: `0 0 6px ${p.hudBorder}` }}
        />
        {/* Health text */}
        <span
          className="font-mono font-bold tracking-widest text-sm"
          style={{ color: isDark ? '#e2e8f0' : '#1e293b', textShadow: isDark ? '1px 1px 0 #000' : '1px 1px 0 rgba(255,255,255,0.6)' }}
        >
          HP: {healthScore}/100
        </span>
        {/* Clear button */}
        <button
          aria-label="Clear HUD"
          className="font-mono text-xs px-2 py-1 border-2"
          style={{
            background: isDark ? '#1e293b' : '#9ca3af',
            color: isDark ? '#94a3b8' : '#111827',
            borderColor: isDark ? '#334155' : '#6b7280',
            borderBottomColor: isDark ? '#0f172a' : '#374151',
            borderRightColor:  isDark ? '#0f172a' : '#374151',
            boxShadow: `2px 2px 0 ${isDark ? '#0f172a' : '#374151'}`
          }}
        >
          [Clear]
        </button>
      </div>

      {/* ── MINI HEALTH BAR ─────────────────────────────────────── */}
      <div
        className="absolute bottom-3 right-3 z-50 flex flex-col items-end gap-1"
      >
        <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: p.hudBorder }}>
          {weatherState.toUpperCase()}
        </span>
        <div className="flex gap-[2px]">
          {Array.from({ length: 10 }).map((_, i) => {
            const active = i < Math.round(healthScore / 10);
            return (
              <span key={i} className={`inline-block w-3 h-3 border ${active ? 'animate-none' : ''}`}
                style={{
                  background: active ? p.hudBorder : (isDark ? '#1e293b' : '#d1d5db'),
                  borderColor: isDark ? '#0f172a' : '#9ca3af',
                  boxShadow: active ? `0 0 4px ${p.hudBorder}` : 'none'
                }}
              />
            );
          })}
        </div>
      </div>
    </figure>
  );
});
