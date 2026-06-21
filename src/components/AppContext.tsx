'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';

interface AppContextType {
  user: any | null;
  ecosystem: any | null;
  logs: any[];
  goals: any[];
  swaps: any[];
  achievements: any[];
  loading: boolean;
  logout: () => void;
  completeOnboarding: (name: string, email: string, profile: any, footprint: number) => Promise<void>;
  logActivity: (rawText: string, customActivities?: any[]) => Promise<any>;
  acceptSwap: (swap: any) => Promise<void>;
  completeSwap: (swapId: string) => Promise<void>;
  addGoal: (goalData: any) => Promise<void>;
  refreshAll: () => Promise<void>;
  setLocalUser: (user: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppProviderInner>{children}</AppProviderInner>
    </SessionProvider>
  );
}

function AppProviderInner({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [ecosystem, setEcosystem] = useState<any | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [swaps, setSwaps] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const fetchUserData = async (email?: string) => {
    try {
      const url = email ? `/api/user?email=${encodeURIComponent(email)}` : '/api/user';
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.user) {
        setUser(data.user);
        setEcosystem(data.ecosystem);
        setAchievements(data.achievements || []);
        
        // Fetch logs, goals, swaps
        const [logsRes, goalsRes, swapsRes] = await Promise.all([
          fetch(`/api/user/log?userId=${data.user.id}`),
          fetch(`/api/user/goal?userId=${data.user.id}`),
          fetch(`/api/user/swap?userId=${data.user.id}`)
        ]);

        if (logsRes.ok) setLogs(await logsRes.json());
        if (goalsRes.ok) setGoals(await goalsRes.json());
        if (swapsRes.ok) setSwaps(await swapsRes.json());
      } else {
        setUser(null);
        setEcosystem(null);
        setLogs([]);
        setGoals([]);
        setSwaps([]);
        setAchievements([]);
      }
    } catch (e) {
      console.error('Error fetching context user data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && session?.user?.email) {
      fetchUserData(session.user.email);
    } else if (status === 'unauthenticated') {
      setUser(null);
      setEcosystem(null);
      setLogs([]);
      setGoals([]);
      setSwaps([]);
      setAchievements([]);
      setLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    // Redirect if not onboarded
    if (!loading) {
      const isAuthPage = pathname === '/login' || pathname === '/register';
      if (!user && pathname !== '/onboarding' && !isAuthPage) {
        router.push('/login');
      } else if (user && user.baselineFootprintKgCO2e === 0 && pathname !== '/onboarding') {
        router.push('/onboarding');
      } else if (user && user.baselineFootprintKgCO2e > 0 && (pathname === '/onboarding' || isAuthPage)) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const logout = async () => {
    setLoading(true);
    await signOut({ callbackUrl: '/login' });
  };

  const completeOnboarding = async (name: string, email: string, profile: any, footprint: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          baselineProfile: profile,
          baselineFootprintKgCO2e: footprint
        })
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setEcosystem(data.ecosystem);
        await fetchUserData(data.user.email);
        router.push('/dashboard');
      }
    } catch (e) {
      console.error('Error in onboarding API:', e);
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (rawText: string, customActivities?: any[]) => {
    if (!user) return null;
    try {
      let activities = customActivities;
      if (!activities) {
        // Run AI parsing API
        const parseRes = await fetch('/api/parse-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText })
        });
        const parseData = await parseRes.json();
        if (parseData.clarificationNeeded) {
          return parseData; // contains clarificationQuestion
        }
        activities = parseData.activities;
      }

      // Log it
      const res = await fetch('/api/user/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          rawInputText: rawText,
          activityDate: new Date().toISOString(),
          parsedActivities: activities
        })
      });

      const data = await res.json();
      if (res.ok && data.update) {
        setUser(data.update.user);
        setEcosystem(data.update.ecosystem);
        setAchievements(data.update.achievements || []);
        // Refresh logs, goals, swaps
        await fetchUserData(user.email);
        return { success: true, pointsEarned: data.update.pointsEarned, achievementsUnlocked: data.update.achievementsUnlocked };
      }
    } catch (e) {
      console.error('Error logging activity:', e);
    }
    return { success: false };
  };

  const acceptSwap = async (swap: any) => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          swapTitle: swap.swapTitle,
          analogyText: swap.analogyText,
          reasonText: swap.reasonText,
          estimatedSavingsKgCO2eWeekly: swap.estimatedSavingsKgCO2eWeekly,
          action: 'accept'
        })
      });
      if (res.ok) {
        await fetchUserData(user.email);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const completeSwap = async (swapId: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          swapId,
          action: 'complete'
        })
      });
      if (res.ok) {
        await fetchUserData(user.email);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addGoal = async (goalData: any) => {
    if (!user) return;
    try {
      const res = await fetch('/api/user/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...goalData
        })
      });
      if (res.ok) {
        await fetchUserData(user.email);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const refreshAll = async () => {
    if (user) await fetchUserData(user.email);
  };

  const setLocalUser = (updatedUser: any) => {
    setUser(updatedUser);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        ecosystem,
        logs,
        goals,
        swaps,
        achievements,
        loading,
        logout,
        completeOnboarding,
        logActivity,
        acceptSwap,
        completeSwap,
        addGoal,
        refreshAll,
        setLocalUser
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
