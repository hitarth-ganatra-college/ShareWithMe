import React from 'react';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/db';
import { Project } from '@/lib/models/Project';
import PreviewViewer from '@/components/PreviewViewer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    await connectToDatabase();
    const project = await Project.findOne({
      slug: slug.toLowerCase(),
      expiresAt: { $gt: new Date() },
    }).select('title').lean();

    if (!project) {
      return { title: 'Project Expired | ShareWithMe' };
    }
    return {
      title: `${project.title} | ShareWithMe`,
      description: `Live preview of ${project.title} hosted temporarily on ShareWithMe.`,
    };
  } catch {
    return { title: 'ShareWithMe Project' };
  }
}

export default async function PreviewPage({ params }: PageProps) {
  const { slug } = await params;

  if (!process.env.MONGODB_URI) {
    notFound();
  }

  await connectToDatabase();

  const project = await Project.findOne({
    slug: slug.toLowerCase(),
    expiresAt: { $gt: new Date() },
  });

  if (!project) {
    notFound();
  }

  // Increment views
  await Project.updateOne({ _id: project._id }, { $inc: { views: 1 } });

  return (
    <PreviewViewer
      slug={project.slug}
      title={project.title}
      expiresAt={project.expiresAt.toISOString()}
      htmlBundle={project.htmlBundle}
      views={project.views + 1}
    />
  );
}
