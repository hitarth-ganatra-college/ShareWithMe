import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Project } from '@/lib/models/Project';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        projects: [],
        isAuth: false,
        maxProjects: 2,
        warning: 'MONGODB_URI is not configured in .env.local',
      });
    }

    await connectToDatabase();

    const session = await auth();
    const isAuthenticated = !!(session?.user?.id || session?.user?.email);
    const userId = session?.user?.id || session?.user?.email;

    const { searchParams } = new URL(req.url);
    const guestSessionId = searchParams.get('guestSessionId');

    const ownerId = isAuthenticated ? userId! : guestSessionId;

    if (!ownerId) {
      return NextResponse.json({ projects: [], isAuth: false });
    }

    const now = new Date();
    const projects = await Project.find({
      ownerId,
      expiresAt: { $gt: now },
    })
      .sort({ createdAt: -1 })
      .select('title slug createdAt expiresAt views ownerType editToken htmlBundle')
      .lean();

    return NextResponse.json({
      projects,
      isAuth: isAuthenticated,
      maxProjects: isAuthenticated ? 5 : 2,
    });
  } catch (error: unknown) {
    console.error('Error fetching projects:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch projects';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
