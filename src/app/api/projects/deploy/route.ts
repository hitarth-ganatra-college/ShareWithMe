import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import { Project } from '@/lib/models/Project';
import { bundleProject } from '@/lib/bundler';
import { generateRandomSlug, validateCustomSlug } from '@/lib/slugs';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        {
          error:
            'MongoDB connection string is missing. Please add MONGODB_URI in your .env.local file.',
        },
        { status: 503 }
      );
    }

    await connectToDatabase();

    const body = await req.json();
    const {
      title = 'Untitled Project',
      customSlug,
      html = '',
      css = '',
      js = '',
      files = [],
      durationMinutes = 120, // default 2 hours
      guestSessionId,
      editToken,
      existingSlug,
    } = body;

    // Check if user is logged in
    const session = await auth();
    const isAuthenticated = !!(session?.user?.id || session?.user?.email);
    const userId = session?.user?.id || session?.user?.email;

    const ownerType = isAuthenticated ? 'user' : 'guest';
    const ownerId = isAuthenticated ? userId! : (guestSessionId || 'unknown_guest');

    // Tier limits enforcement
    const MAX_GUEST_PROJECTS = 2;
    const MAX_USER_PROJECTS = 5;
    const MAX_GUEST_MINUTES = 120; // 2 hours
    const MAX_USER_MINUTES = 30 * 24 * 60; // 30 days = 43,200 mins

    const allowedMaxMinutes = isAuthenticated ? MAX_USER_MINUTES : MAX_GUEST_MINUTES;
    const effectiveMinutes = Math.min(Math.max(15, Number(durationMinutes) || 120), allowedMaxMinutes);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + effectiveMinutes * 60 * 1000);

    // If updating an existing project with editToken
    if (existingSlug && editToken) {
      const existingProject = await Project.findOne({ slug: existingSlug.toLowerCase() });
      if (!existingProject) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      // Check authorization
      const isOwner =
        existingProject.editToken === editToken ||
        (isAuthenticated && existingProject.ownerId === ownerId);

      if (!isOwner) {
        return NextResponse.json({ error: 'Unauthorized to update this project' }, { status: 403 });
      }

      // Re-bundle
      const htmlBundle = bundleProject({
        title: title || existingProject.title,
        html,
        css,
        js,
        showWatermark: true,
      });

      existingProject.title = title || existingProject.title;
      existingProject.htmlBundle = htmlBundle;
      existingProject.files = files && files.length > 0 ? files : [
        { name: 'index.html', content: html, type: 'html' },
        { name: 'style.css', content: css, type: 'css' },
        { name: 'script.js', content: js, type: 'js' },
      ];
      // Refresh expiration if requested
      existingProject.expiresAt = expiresAt;

      await existingProject.save();

      return NextResponse.json({
        success: true,
        slug: existingProject.slug,
        editToken: existingProject.editToken,
        expiresAt: existingProject.expiresAt,
        url: `/p/${existingProject.slug}`,
      });
    }

    // New project creation: check active project limits
    const currentActiveCount = await Project.countDocuments({
      ownerId,
      expiresAt: { $gt: now },
    });

    const maxAllowed = isAuthenticated ? MAX_USER_PROJECTS : MAX_GUEST_PROJECTS;
    if (currentActiveCount >= maxAllowed) {
      return NextResponse.json(
        {
          error: isAuthenticated
            ? `You have reached the maximum limit of ${MAX_USER_PROJECTS} active projects for your account. Please delete or let an older project expire.`
            : `You have reached the limit of ${MAX_GUEST_PROJECTS} active projects as a guest. Please Sign In with Google for up to 5 projects for 30 days, or delete an existing project.`,
        },
        { status: 403 }
      );
    }

    // Determine Slug
    let finalSlug: string;
    if (customSlug && customSlug.trim()) {
      const validation = validateCustomSlug(customSlug);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const requestedSlug = customSlug.trim().toLowerCase();
      const existing = await Project.findOne({ slug: requestedSlug });
      if (existing) {
        return NextResponse.json(
          { error: `The custom link "${requestedSlug}" is already taken. Please choose another.` },
          { status: 409 }
        );
      }
      finalSlug = requestedSlug;
    } else {
      // Generate a unique random slug
      let attempts = 0;
      do {
        finalSlug = generateRandomSlug();
        const existing = await Project.findOne({ slug: finalSlug });
        if (!existing) break;
        attempts++;
      } while (attempts < 10);
    }

    // Bundle HTML + CSS + JS
    const htmlBundle = bundleProject({
      title: title || 'My Project',
      html,
      css,
      js,
      showWatermark: true,
    });

    const projectFiles = files && files.length > 0 ? files : [
      { name: 'index.html', content: html, type: 'html' },
      { name: 'style.css', content: css, type: 'css' },
      { name: 'script.js', content: js, type: 'js' },
    ];

    const newEditToken = crypto.randomBytes(24).toString('hex');

    const project = await Project.create({
      slug: finalSlug,
      title: title || 'Untitled Project',
      htmlBundle,
      files: projectFiles,
      ownerType,
      ownerId,
      editToken: newEditToken,
      expiresAt,
      views: 0,
    });

    return NextResponse.json({
      success: true,
      slug: project.slug,
      editToken: project.editToken,
      expiresAt: project.expiresAt,
      url: `/p/${project.slug}`,
    });
  } catch (error: unknown) {
    console.error('Error deploying project:', error);
    const message = error instanceof Error ? error.message : 'Failed to deploy project';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
