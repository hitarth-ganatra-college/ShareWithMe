import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Project } from '@/lib/models/Project';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const session = await auth();
    if (!session?.user?.id && !session?.user?.email) {
      return NextResponse.json({ error: 'You must be signed in to claim projects' }, { status: 401 });
    }

    const userId = (session.user.id || session.user.email)!;
    const body = await req.json();
    const { guestSessionId } = body;

    if (!guestSessionId) {
      return NextResponse.json({ error: 'guestSessionId is required' }, { status: 400 });
    }

    // Find active guest projects belonging to this guest session
    const guestProjects = await Project.find({
      ownerId: guestSessionId,
      ownerType: 'guest',
      expiresAt: { $gt: new Date() },
    });

    if (guestProjects.length === 0) {
      return NextResponse.json({ message: 'No guest projects to claim', count: 0 });
    }

    // Check how many active user projects the user already has
    const userActiveCount = await Project.countDocuments({
      ownerId: userId,
      expiresAt: { $gt: new Date() },
    });

    const maxAllowed = 5;
    const availableSlots = Math.max(0, maxAllowed - userActiveCount);
    const toClaim = guestProjects.slice(0, availableSlots);

    const claimedIds = [];
    for (const project of toClaim) {
      project.ownerType = 'user';
      project.ownerId = userId;
      // Upgrade expiry to 30 days from now!
      project.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await project.save();
      claimedIds.push(project.slug);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully claimed ${claimedIds.length} project(s) and extended to 30 days!`,
      claimedSlugs: claimedIds,
    });
  } catch (error: unknown) {
    console.error('Error claiming projects:', error);
    const message = error instanceof Error ? error.message : 'Failed to claim projects';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
