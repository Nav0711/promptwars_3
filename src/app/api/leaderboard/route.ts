import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// Seed mock competitors to make the leaderboard look active
async function seedMockCompetitors() {
  if (!db.isMock) return;

  const JSON_DB_PATH = path.join(process.cwd(), 'prisma', 'db.json');
  if (!fs.existsSync(JSON_DB_PATH)) return;

  try {
    const data = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf-8'));
    
    // Check if we already have competitors
    const competitorEmails = ['emma@ecoloop.org', 'alex@ecoloop.org', 'sarah@ecoloop.org', 'david@ecoloop.org'];
    const hasCompetitors = data.users.some((u: any) => competitorEmails.includes(u.email));

    if (!hasCompetitors) {
      const competitors = [
        {
          id: 'comp-emma',
          name: 'Emma Green',
          email: 'emma@ecoloop.org',
          createdAt: new Date().toISOString(),
          baselineProfile: {},
          baselineFootprintKgCO2e: 450.0,
          ecoPoints: 480,
          currentStreak: 8,
          longestStreak: 12,
          lastLogDate: new Date().toISOString()
        },
        {
          id: 'comp-alex',
          name: 'Alex Soil',
          email: 'alex@ecoloop.org',
          createdAt: new Date().toISOString(),
          baselineProfile: {},
          baselineFootprintKgCO2e: 520.0,
          ecoPoints: 340,
          currentStreak: 5,
          longestStreak: 5,
          lastLogDate: new Date().toISOString()
        },
        {
          id: 'comp-sarah',
          name: 'Sarah Breeze',
          email: 'sarah@ecoloop.org',
          createdAt: new Date().toISOString(),
          baselineProfile: {},
          baselineFootprintKgCO2e: 380.0,
          ecoPoints: 210,
          currentStreak: 3,
          longestStreak: 7,
          lastLogDate: new Date().toISOString()
        },
        {
          id: 'comp-david',
          name: 'David Wave',
          email: 'david@ecoloop.org',
          createdAt: new Date().toISOString(),
          baselineProfile: {},
          baselineFootprintKgCO2e: 610.0,
          ecoPoints: 120,
          currentStreak: 1,
          longestStreak: 3,
          lastLogDate: new Date().toISOString()
        }
      ];

      // Add to users
      data.users.push(...competitors);

      // Add corresponding ecosystem states
      competitors.forEach(comp => {
        data.ecosystemStates.push({
          id: `eco-${comp.id}`,
          userId: comp.id,
          healthScore: comp.ecoPoints > 400 ? 85 : comp.ecoPoints > 200 ? 68 : 45,
          weatherState: comp.ecoPoints > 400 ? 'clear' : comp.ecoPoints > 200 ? 'clear' : 'cloudy',
          unlockedAssets: JSON.stringify(comp.ecoPoints > 400 ? ['asset_sprout', 'asset_squirrel'] : ['asset_sprout']),
          lastUpdated: new Date().toISOString()
        });

        data.leaderboardEntries.push({
          id: `lead-${comp.id}`,
          userId: comp.id,
          weeklyPoints: comp.ecoPoints,
          groupId: 'global'
        });
      });

      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error('Error seeding competitors:', e);
  }
}

export async function GET(req: NextRequest) {
  try {
    // Seed competitors if mock DB
    await seedMockCompetitors();

    const entries = await db.leaderboardEntry.findMany({
      orderBy: { weeklyPoints: 'desc' }
    });

    return NextResponse.json(entries);
  } catch (error: any) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
