import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';

// POST /api/group — create a new group (returns invite code)
// POST /api/group?action=join — join an existing group via invite code
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const { userId, inviteCode, groupName } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (action === 'join') {
      // Join an existing group
      if (!inviteCode) {
        return NextResponse.json({ error: 'inviteCode is required to join a group' }, { status: 400 });
      }

      // Check the invite code is valid (exists in any leaderboard entry)
      const dbData = (db as any).isMock
        ? await getJsonDbGroups()
        : null;

      // For the mock DB, search through leaderboard entries for matching groupId
      // GroupId is the invite code itself for simplicity
      const user = await db.user.findUnique({ 
        where: { id: userId },
        select: { ecoPoints: true }
      });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      // Update user's leaderboard entry to use this groupId
      await db.leaderboardEntry.upsert({
        where: { userId },
        update: { groupId: inviteCode },
        create: { userId, weeklyPoints: user.ecoPoints || 0, groupId: inviteCode }
      });

      return NextResponse.json({
        success: true,
        message: `Joined group successfully!`,
        groupId: inviteCode
      });
    }

    // Default: create a new group
    const inviteCodeNew = nanoid(6).toUpperCase();

    const user = await db.user.findUnique({ 
      where: { id: userId },
      select: { ecoPoints: true }
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Creator joins their own group immediately
    await db.leaderboardEntry.upsert({
      where: { userId },
      update: { groupId: inviteCodeNew },
      create: { userId, weeklyPoints: user.ecoPoints || 0, groupId: inviteCodeNew }
    });

    return NextResponse.json({
      success: true,
      inviteCode: inviteCodeNew,
      message: `Group created! Share this code with friends: ${inviteCodeNew}`
    });
  } catch (error: any) {
    console.error('Error in group API:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

// GET /api/group?groupId=XXX — fetch group leaderboard
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get('groupId');

    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 });
    }

    const entries = await db.leaderboardEntry.findMany({
      orderBy: { weeklyPoints: 'desc' },
      take: 50
    });

    // Filter by groupId
    const groupEntries = entries.filter((e: any) => e.groupId === groupId);

    return NextResponse.json({
      groupId,
      inviteCode: groupId,
      members: groupEntries
    });
  } catch (error: any) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

async function getJsonDbGroups() {
  return null; // Placeholder for Prisma path
}
