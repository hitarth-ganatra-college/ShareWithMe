import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Project } from '@/lib/models/Project';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    await connectToDatabase();
    const { slug } = await context.params;

    const project = await Project.findOne({
      slug: slug.toLowerCase(),
      expiresAt: { $gt: new Date() },
    });

    if (!project) {
      return new Response(
        `<!DOCTYPE html>
<html>
<head><title>Project Not Found or Expired</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0f172a;color:#f8fafc;text-align:center;}h1{font-size:24px;margin-bottom:8px;}p{color:#94a3b8;}</style></head>
<body><div><h1>Project Expired or Not Found</h1><p>The requested link has either expired or does not exist.</p><p><a href="/" style="color:#60a5fa;">Create a new project on ShareWithMe</a></p></div></body>
</html>`,
        {
          status: 404,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    }

    // Increment views asynchronously
    Project.updateOne({ _id: project._id }, { $inc: { views: 1 } }).exec();

    return new Response(project.htmlBundle, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        // Content-Security-Policy sandboxing
        'Content-Security-Policy': "sandbox allow-scripts allow-forms allow-modals allow-popups;",
      },
    });
  } catch (error) {
    console.error('Error serving raw project:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
