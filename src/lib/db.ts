import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Initialize the real Prisma Client
let prisma: PrismaClient | null = null;
const isPostgresConfigured = !!process.env.DATABASE_URL;

if (isPostgresConfigured) {
  prisma = new PrismaClient();
}

export const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
  baselineProfile: true,
  baselineFootprintKgCO2e: true,
  ecoPoints: true,
  currentStreak: true,
  longestStreak: true,
  lastLogDate: true,
};

// -------------------------------------------------------------
// JSON MOCK DATABASE FALLBACK
// -------------------------------------------------------------
const JSON_DB_PATH = path.join(process.cwd(), 'prisma', 'db.json');

interface MockDbData {
  users: any[];
  carbonLogs: any[];
  ecosystemStates: any[];
  goals: any[];
  swapActions: any[];
  achievements: any[];
  userAchievements: any[];
  leaderboardEntries: any[];
}

const DEFAULT_ACHIEVEMENTS = [
  {
    id: 'ach-first-log',
    code: 'FIRST_LOG',
    title: 'Welcome to the Loop',
    description: 'Logged your first carbon activity',
    iconAsset: 'welcome'
  },
  {
    id: 'ach-streak-7',
    code: 'STREAK_7',
    title: 'One Week Wonder',
    description: 'Maintained a 7-day logging streak',
    iconAsset: 'streak_7'
  },
  {
    id: 'ach-streak-30',
    code: 'STREAK_30',
    title: 'Habit Formed',
    description: 'Maintained a 30-day logging streak',
    iconAsset: 'streak_30'
  },
  {
    id: 'ach-first-swap',
    code: 'FIRST_SWAP',
    title: 'Swap Starter',
    description: 'Completed your first carbon swap action',
    iconAsset: 'swap_starter'
  },
  {
    id: 'ach-forest-bloom',
    code: 'FOREST_BLOOM',
    title: 'Thriving Ecosystem',
    description: 'Reached an ecosystem health score of 80 or above',
    iconAsset: 'forest_bloom'
  },
  {
    id: 'ach-vegan-week',
    code: 'VEGAN_WEEK',
    title: 'Plant-Powered',
    description: 'Logged 7 vegan or vegetarian meals in a single week',
    iconAsset: 'plant_powered'
  }
];

function readJsonDb(): MockDbData {
  if (!fs.existsSync(JSON_DB_PATH)) {
    const initialData: MockDbData = {
      users: [],
      carbonLogs: [],
      ecosystemStates: [],
      goals: [],
      swapActions: [],
      achievements: DEFAULT_ACHIEVEMENTS,
      userAchievements: [],
      leaderboardEntries: []
    };
    fs.mkdirSync(path.dirname(JSON_DB_PATH), { recursive: true });
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const data = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf-8'));
    // Ensure achievements are seeded
    if (!data.achievements || data.achievements.length === 0) {
      data.achievements = DEFAULT_ACHIEVEMENTS;
      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    }
    return data;
  } catch (e) {
    console.error('Error reading JSON DB, resetting', e);
    const initialData: MockDbData = {
      users: [],
      carbonLogs: [],
      ecosystemStates: [],
      goals: [],
      swapActions: [],
      achievements: DEFAULT_ACHIEVEMENTS,
      userAchievements: [],
      leaderboardEntries: []
    };
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

function writeJsonDb(data: MockDbData) {
  fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Helper to simulate Prisma structure
export const db = {
  isMock: !isPostgresConfigured,

  user: {
    findUnique: async ({ where, select }: { where: { id?: string; email?: string }, select?: any }) => {
      if (prisma) return prisma.user.findUnique({ where, select } as any);
      const data = readJsonDb();
      return data.users.find(u => (where.id && u.id === where.id) || (where.email && u.email === where.email)) || null;
    },
    findFirst: async ({ select }: { select?: any } = {}) => {
      if (prisma) return prisma.user.findFirst({ select } as any);
      const data = readJsonDb();
      return data.users[0] || null;
    },
    create: async ({ data, select }: { data: any, select?: any }) => {
      if (prisma) return prisma.user.create({ data, select } as any);
      const dbData = readJsonDb();
      const newUser = {
        id: Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
        ecoPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastLogDate: null,
        ...data
      };
      dbData.users.push(newUser);
      
      // Also initialize ecosystem state
      const newEcosystem = {
        id: Math.random().toString(36).substring(2, 9),
        userId: newUser.id,
        healthScore: 50,
        weatherState: 'clear',
        unlockedAssets: JSON.stringify([]),
        lastUpdated: new Date().toISOString()
      };
      dbData.ecosystemStates.push(newEcosystem);
      
      writeJsonDb(dbData);
      return newUser;
    },
    update: async ({ where, data, select }: { where: { id?: string; email?: string }; data: any; select?: any }) => {
      if (prisma) return prisma.user.update({ where, data, select } as any);
      const dbData = readJsonDb();
      const userIndex = dbData.users.findIndex(u => (where.id && u.id === where.id) || (where.email && u.email === where.email));
      if (userIndex === -1) throw new Error('User not found');
      
      dbData.users[userIndex] = {
        ...dbData.users[userIndex],
        ...data
      };
      writeJsonDb(dbData);
      return dbData.users[userIndex];
    }
  },

  carbonLog: {
    create: async ({ data }: { data: any }) => {
      if (prisma) return prisma.carbonLog.create({ data });
      const dbData = readJsonDb();
      const newLog = {
        id: Math.random().toString(36).substring(2, 9),
        loggedAt: new Date().toISOString(),
        ...data
      };
      dbData.carbonLogs.push(newLog);
      writeJsonDb(dbData);
      return newLog;
    },
    findMany: async ({ where, orderBy }: { where: { userId: string }; orderBy?: any }) => {
      if (prisma) return prisma.carbonLog.findMany({ where, orderBy });
      const dbData = readJsonDb();
      let logs = dbData.carbonLogs.filter(l => l.userId === where.userId);
      if (orderBy && orderBy.activityDate) {
        logs.sort((a, b) => {
          const dateA = new Date(a.activityDate).getTime();
          const dateB = new Date(b.activityDate).getTime();
          return orderBy.activityDate === 'desc' ? dateB - dateA : dateA - dateB;
        });
      }
      return logs;
    }
  },

  ecosystemState: {
    findUnique: async ({ where }: { where: { userId: string } }) => {
      if (prisma) return prisma.ecosystemState.findUnique({ where });
      const dbData = readJsonDb();
      return dbData.ecosystemStates.find(e => e.userId === where.userId) || null;
    },
    update: async ({ where, data }: { where: { userId: string }; data: any }) => {
      if (prisma) return prisma.ecosystemState.update({ where, data });
      const dbData = readJsonDb();
      const index = dbData.ecosystemStates.findIndex(e => e.userId === where.userId);
      if (index === -1) {
        // Create if missing
        const newEcosystem = {
          id: Math.random().toString(36).substring(2, 9),
          userId: where.userId,
          healthScore: 50,
          weatherState: 'clear',
          unlockedAssets: JSON.stringify([]),
          ...data,
          lastUpdated: new Date().toISOString()
        };
        dbData.ecosystemStates.push(newEcosystem);
        writeJsonDb(dbData);
        return newEcosystem;
      }
      dbData.ecosystemStates[index] = {
        ...dbData.ecosystemStates[index],
        ...data,
        lastUpdated: new Date().toISOString()
      };
      writeJsonDb(dbData);
      return dbData.ecosystemStates[index];
    }
  },

  goal: {
    create: async ({ data }: { data: any }) => {
      if (prisma) return prisma.goal.create({ data });
      const dbData = readJsonDb();
      const newGoal = {
        id: Math.random().toString(36).substring(2, 9),
        status: 'active',
        ...data
      };
      dbData.goals.push(newGoal);
      writeJsonDb(dbData);
      return newGoal;
    },
    findMany: async ({ where }: { where: { userId: string; status?: string } }) => {
      if (prisma) return prisma.goal.findMany({ where });
      const dbData = readJsonDb();
      return dbData.goals.filter(g => g.userId === where.userId && (!where.status || g.status === where.status));
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      if (prisma) return prisma.goal.update({ where, data });
      const dbData = readJsonDb();
      const index = dbData.goals.findIndex(g => g.id === where.id);
      if (index === -1) throw new Error('Goal not found');
      dbData.goals[index] = {
        ...dbData.goals[index],
        ...data
      };
      writeJsonDb(dbData);
      return dbData.goals[index];
    }
  },

  swapAction: {
    create: async ({ data }: { data: any }) => {
      if (prisma) return prisma.swapAction.create({ data });
      const dbData = readJsonDb();
      const newSwap = {
        id: Math.random().toString(36).substring(2, 9),
        acceptedAt: new Date().toISOString(),
        status: 'active',
        abandonedAt: null,
        completedAt: null,
        embeddingVector: null,
        ...data
      };
      dbData.swapActions.push(newSwap);
      writeJsonDb(dbData);
      return newSwap;
    },
    findMany: async ({ where }: { where: { userId: string; status?: string } }) => {
      if (prisma) return prisma.swapAction.findMany({ where });
      const dbData = readJsonDb();
      return dbData.swapActions.filter(s => s.userId === where.userId && (!where.status || s.status === where.status));
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      if (prisma) return prisma.swapAction.update({ where, data });
      const dbData = readJsonDb();
      const index = dbData.swapActions.findIndex(s => s.id === where.id);
      if (index === -1) throw new Error('SwapAction not found');
      dbData.swapActions[index] = {
        ...dbData.swapActions[index],
        ...data
      };
      writeJsonDb(dbData);
      return dbData.swapActions[index];
    }
  },

  achievement: {
    findMany: async () => {
      if (prisma) return prisma.achievement.findMany();
      return readJsonDb().achievements;
    },
    findUnique: async ({ where }: { where: { code: string } }) => {
      if (prisma) return prisma.achievement.findUnique({ where });
      return readJsonDb().achievements.find(a => a.code === where.code) || null;
    }
  },

  userAchievement: {
    create: async ({ data }: { data: any }) => {
      if (prisma) return prisma.userAchievement.create({ data });
      const dbData = readJsonDb();
      const newUserAch = {
        id: Math.random().toString(36).substring(2, 9),
        unlockedAt: new Date().toISOString(),
        ...data
      };
      dbData.userAchievements.push(newUserAch);
      writeJsonDb(dbData);
      return newUserAch;
    },
    findMany: async ({ where, include }: { where: { userId: string }; include?: any }) => {
      if (prisma) return prisma.userAchievement.findMany({ where, include });
      const dbData = readJsonDb();
      const uAchs = dbData.userAchievements.filter(ua => ua.userId === where.userId);
      if (include && include.achievement) {
        return uAchs.map(ua => ({
          ...ua,
          achievement: dbData.achievements.find(a => a.id === ua.achievementId)
        }));
      }
      return uAchs;
    }
  },

  leaderboardEntry: {
    findMany: async ({ where, orderBy, take }: { where?: { groupId?: string }; orderBy?: any; take?: number }) => {
      if (prisma) return (prisma.leaderboardEntry as any).findMany({ where, orderBy, take });
      const dbData = readJsonDb();
      let entries = [...dbData.leaderboardEntries];
      
      // Calculate active scores for all users (if no groupId filter — global view)
      if (!where?.groupId || where.groupId === 'global') {
        dbData.users.forEach(u => {
          let entry = entries.find(e => e.userId === u.id);
          if (!entry) {
            entry = {
              id: Math.random().toString(36).substring(2, 9),
              userId: u.id,
              weeklyPoints: u.ecoPoints,
              groupId: 'global'
            };
            entries.push(entry);
          } else {
            entry.weeklyPoints = u.ecoPoints;
          }
        });
      }

      // Filter by groupId if specified
      if (where?.groupId) {
        entries = entries.filter(e => e.groupId === where.groupId);
        // Attach user data for group members
        entries = entries.map(e => ({
          ...e,
          weeklyPoints: dbData.users.find((u: any) => u.id === e.userId)?.ecoPoints || e.weeklyPoints,
          user: dbData.users.find((u: any) => u.id === e.userId)
        }));
      }

      if (orderBy?.weeklyPoints) {
        entries.sort((a, b) => orderBy.weeklyPoints === 'desc' ? b.weeklyPoints - a.weeklyPoints : a.weeklyPoints - b.weeklyPoints);
      }
      
      // Add ranks dynamically for global view
      if (!where?.groupId || where.groupId === 'global') {
        entries = entries.map((e, index) => ({
          ...e,
          rank: index + 1,
          user: dbData.users.find(u => u.id === e.userId)
        }));
      }

      if (take) entries = entries.slice(0, take);
      return entries;
    },
    upsert: async ({ where, update, create }: { where: { userId: string }; update: any; create: any }) => {
      if (prisma) return prisma.leaderboardEntry.upsert({ where, update, create });
      const dbData = readJsonDb();
      const index = dbData.leaderboardEntries.findIndex(e => e.userId === where.userId);
      if (index === -1) {
        const newEntry = {
          id: Math.random().toString(36).substring(2, 9),
          userId: where.userId,
          weeklyPoints: create.weeklyPoints || 0,
          groupId: create.groupId || 'global'
        };
        dbData.leaderboardEntries.push(newEntry);
        writeJsonDb(dbData);
        return newEntry;
      }
      dbData.leaderboardEntries[index] = {
        ...dbData.leaderboardEntries[index],
        ...update
      };
      writeJsonDb(dbData);
      return dbData.leaderboardEntries[index];
    }
  }
};
