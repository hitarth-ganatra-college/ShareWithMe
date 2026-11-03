import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Project } from '@/lib/models/Project';
import { auth } from '@/lib/auth';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 503 });
    }

    await connectToDatabase();
    const { slug } = await context.params;

    const project = await Project.findOne({
      slug: slug.toLowerCase(),
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found or expired' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error: unknown) {
    console.error('Error fetching project:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch project';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();
    const { slug } = await context.params;

    const body = await req.json().catch(() => ({}));
    const { editToken } = body;

    const session = await auth();
    const isAuthenticated = !!(session?.user?.id || session?.user?.email);
    const userId = session?.user?.id || session?.user?.email;

    const project = await Project.findOne({ slug: slug.toLowerCase() });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isAuthorized =
      (editToken && project.editToken === editToken) ||
      (isAuthenticated && project.ownerId === userId);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized to delete this project' }, { status: 403 });
    }

    await Project.deleteOne({ _id: project._id });

    return NextResponse.json({ success: true, message: 'Project deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting project:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete project';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
