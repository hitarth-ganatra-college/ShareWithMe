'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Code2,
  UploadCloud,
  Rocket,
  FolderGit2,
  RefreshCw,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Laptop,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import CodeEditor from '@/components/CodeEditor';
import FileUploader from '@/components/FileUploader';
import DeployModal from '@/components/DeployModal';
import ProjectCard, { ProjectCardData } from '@/components/ProjectCard';
import AuthButton from '@/components/AuthButton';
import {
  getOrCreateGuestSessionId,
  getLocalGuestProjects,
  removeLocalGuestProject,
} from '@/lib/guestSession';
import { bundleProject } from '@/lib/bundler';

interface MainAppProps {
  initialSession: {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } | null;
  } | null;
}

const DEFAULT_HTML = `<div class="hero">
  <div class="badge">🚀 ShareWithMe</div>
  <h1>Deploy your code in seconds.</h1>
  <p>Edit this HTML, CSS & JavaScript or upload your project. Share instantly via link and QR code!</p>
  <button id="ctaBtn" class="btn">Click me for a surprise</button>
</div>`;

const DEFAULT_CSS = `body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 20%, #1e1b4b, #09090b);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f8fafc;
  overflow: hidden;
}

.hero {
  text-align: center;
  padding: 2.5rem;
  max-width: 520px;
}

.badge {
  display: inline-block;
  padding: 6px 14px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.35);
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  color: #818cf8;
  margin-bottom: 1.25rem;
}

h1 {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, #ffffff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  color: #94a3b8;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.btn {
  background: linear-gradient(135deg, #2563eb, #6366f1);
  color: white;
  border: none;
  padding: 0.85rem 1.75rem;
  font-size: 0.95rem;
  font-weight: 700;
  border-radius: 9999px;
  cursor: pointer;
  box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 15px 30px -5px rgba(37, 99, 235, 0.6);
}

.btn:active {
  transform: translateY(0);
}`;

const DEFAULT_JS = `const btn = document.getElementById('ctaBtn');

btn.addEventListener('click', () => {
  btn.textContent = '🎉 You did it! Share your link!';
  btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
  document.body.style.background = 'radial-gradient(circle at 50% 20%, #064e3b, #09090b)';
});`;

export default function MainApp({ initialSession }: MainAppProps) {
  const isAuth = !!initialSession?.user?.email;

  const [activeTab, setActiveTab] = useState<'editor' | 'upload' | 'dashboard'>('editor');
  const [mobilePane, setMobilePane] = useState<'code' | 'preview'>('code');

  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState(DEFAULT_CSS);
  const [js, setJs] = useState(DEFAULT_JS);
  const [projectTitle, setProjectTitle] = useState('My Web Project');

  const [guestSessionId, setGuestSessionId] = useState('');
  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Deploy Modal state
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | undefined>(undefined);
  const [editToken, setEditToken] = useState<string | undefined>(undefined);

  // Claim banner state
  const [hasClaimable, setHasClaimable] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  // Live bundle for real-time preview
  const liveBundle = useMemo(() => {
    return bundleProject({
      title: projectTitle,
      html,
      css,
      js,
      showWatermark: false, // in-editor preview has no watermark
    });
  }, [projectTitle, html, css, js]);

  // Init guest session & fetch projects
  useEffect(() => {
    const gid = getOrCreateGuestSessionId();
    setGuestSessionId(gid);
    fetchProjects(gid);

    // Check if guest has projects stored locally that could be claimed
    if (isAuth) {
      const localProjects = getLocalGuestProjects();
      if (localProjects.length > 0) {
        setHasClaimable(true);
      }
    }
  }, [isAuth]);

  const fetchProjects = async (gid?: string) => {
    setLoadingProjects(true);
    try {
      const targetGid = gid || guestSessionId;
      const res = await fetch(`/api/projects?guestSessionId=${encodeURIComponent(targetGid)}`);
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (e) {
      console.error('Failed to load projects', e);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleFilesLoaded = (data: { html: string; css: string; js: string; filename?: string }) => {
    setHtml(data.html);
    setCss(data.css);
    setJs(data.js);
    if (data.filename) {
      setProjectTitle(data.filename.replace(/[-_]/g, ' '));
    }
    setActiveTab('editor'); // Jump to editor/preview
  };

  const handleEditProject = async (slug: string) => {
    try {
      const res = await fetch(`/api/projects/${slug}`);
      const data = await res.json();
      if (data.project) {
        const p = data.project;
        setProjectTitle(p.title);
        setEditingSlug(p.slug);
        setEditToken(p.editToken);

        const htmlFile = p.files?.find((f: { type: string }) => f.type === 'html');
        const cssFile = p.files?.find((f: { type: string }) => f.type === 'css');
        const jsFile = p.files?.find((f: { type: string }) => f.type === 'js');

        setHtml(htmlFile?.content || '');
        setCss(cssFile?.content || '');
        setJs(jsFile?.content || '');

        setActiveTab('editor');
      }
    } catch (e) {
      console.error('Failed to load project for edit', e);
    }
  };

  const handleDeleteProject = async (slug: string, token?: string) => {
    try {
      const res = await fetch(`/api/projects/${slug}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editToken: token }),
      });
      if (res.ok) {
        removeLocalGuestProject(slug);
        setProjects((prev) => prev.filter((p) => p.slug !== slug));
      }
    } catch (e) {
      console.error('Failed to delete project', e);
    }
  };

  const handleClaimGuestProjects = async () => {
    if (!guestSessionId) return;
    setIsClaiming(true);
    try {
      const res = await fetch('/api/projects/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestSessionId }),
      });
      const data = await res.json();
      if (res.ok) {
        setClaimSuccess(data.message);
        setHasClaimable(false);
        localStorage.removeItem('sharewithme_guest_projects');
        fetchProjects();
      }
    } catch (e) {
      console.error('Claim error', e);
    } finally {
      setIsClaiming(false);
    }
  };

  const maxProjects = isAuth ? 5 : 2;
  const projectCount = projects.length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                ShareWithMe
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                hitarth.tech
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'editor'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeTab === 'upload'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('dashboard');
              fetchProjects();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition relative ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>My Projects</span>
            {projectCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] flex items-center justify-center text-white font-bold ml-0.5">
                {projectCount}
              </span>
            )}
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quota indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              {projectCount} / {maxProjects} projects
            </span>
          </div>

          <AuthButton user={initialSession?.user} />
        </div>
      </header>

      {/* Claim Banner (if logged in with unclaimed guest projects) */}
      {hasClaimable && (
        <div className="bg-gradient-to-r from-indigo-900/60 to-blue-900/60 border-b border-indigo-500/30 px-4 py-2.5 text-center text-xs text-slate-200 flex items-center justify-center gap-3">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            You have active guest projects created earlier. Claim them to extend their expiration to 30 days!
          </span>
          <button
            onClick={handleClaimGuestProjects}
            disabled={isClaiming}
            className="px-3 py-1 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-lg shadow-sm text-xs transition disabled:opacity-50"
          >
            {isClaiming ? 'Claiming...' : 'Claim Now'}
          </button>
        </div>
      )}

      {claimSuccess && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 text-center text-xs text-emerald-300 flex items-center justify-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{claimSuccess}</span>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 flex flex-col p-3 sm:p-5 max-w-7xl mx-auto w-full">
        {/* VIEW 1: Interactive Code Editor */}
        {activeTab === 'editor' && (
          <div className="flex-1 flex flex-col gap-3">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 p-2.5 rounded-2xl">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Project Name..."
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-xl focus:outline-none focus:border-blue-500 transition max-w-xs"
                />
                {editingSlug && (
                  <span className="text-[11px] font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20 truncate">
                    Editing: /p/{editingSlug}
                  </span>
                )}
              </div>

              {/* Mobile toggle: Code vs Preview */}
              <div className="flex md:hidden items-center bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setMobilePane('code')}
                  className={`px-3 py-1 rounded-lg ${
                    mobilePane === 'code' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Code
                </button>
                <button
                  onClick={() => setMobilePane('preview')}
                  className={`px-3 py-1 rounded-lg ${
                    mobilePane === 'preview' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Live Preview
                </button>
              </div>

              {/* Deploy Button */}
              <button
                onClick={() => setDeployModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition"
              >
                <Rocket className="w-4 h-4" />
                <span>{editingSlug ? 'Update & Share' : 'Deploy & Share'}</span>
              </button>
            </div>

            {/* Split Screen: Left = Editor, Right = Live Preview */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[550px]">
              {/* Left: Code Editor */}
              <div className={`${mobilePane === 'code' ? 'block' : 'hidden md:block'} h-full`}>
                <CodeEditor
                  html={html}
                  setHtml={setHtml}
                  css={css}
                  setCss={setCss}
                  js={js}
                  setJs={setJs}
                />
              </div>

              {/* Right: Live Interactive Sandbox Preview */}
              <div
                className={`${
                  mobilePane === 'preview' ? 'block' : 'hidden md:block'
                } h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col`}
              >
                <div className="flex items-center justify-between bg-slate-950 border-b border-slate-800 px-4 py-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-semibold text-slate-300">Live Preview</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Updates as you type</span>
                </div>

                <div className="flex-1 w-full bg-white relative">
                  <iframe
                    title="Live Code Preview"
                    srcDoc={liveBundle}
                    sandbox="allow-scripts allow-forms allow-modals"
                    className="w-full h-full border-0"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: File Upload (.zip / files) */}
        {activeTab === 'upload' && (
          <div className="flex-1 max-w-2xl mx-auto w-full py-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-100">Upload your Website</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                Drop your HTML, CSS, JS files or a .zip archive to deploy in one click.
              </p>
            </div>

            <FileUploader onFilesLoaded={handleFilesLoaded} />
          </div>
        )}

        {/* VIEW 3: My Projects Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 flex flex-col gap-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100">My Active Deployments</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAuth
                    ? `Authenticated Account (${projectCount} / ${maxProjects} slots used)`
                    : `Guest Session (${projectCount} / ${maxProjects} slots used • max 2h duration)`}
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingSlug(undefined);
                  setEditToken(undefined);
                  setProjectTitle('New Project');
                  setHtml(DEFAULT_HTML);
                  setCss(DEFAULT_CSS);
                  setJs(DEFAULT_JS);
                  setActiveTab('editor');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition"
              >
                <Code2 className="w-4 h-4" />
                <span>Create New Project</span>
              </button>
            </div>

            {loadingProjects ? (
              <div className="p-12 text-center text-xs text-slate-500">Loading deployments...</div>
            ) : projects.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto my-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-4">
                  <Rocket className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-100">No active projects yet</h3>
                <p className="text-xs text-slate-400 mt-1.5 mb-6">
                  Ready to deploy your first creation and get a shareable QR code?
                </p>
                <button
                  onClick={() => setActiveTab('editor')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition"
                >
                  Open Code Editor
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map((proj) => (
                  <ProjectCard
                    key={proj.slug}
                    project={proj}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Deploy & Share Modal */}
      <DeployModal
        isOpen={deployModalOpen}
        onClose={() => setDeployModalOpen(false)}
        html={html}
        css={css}
        js={js}
        isAuth={isAuth}
        guestSessionId={guestSessionId}
        defaultTitle={projectTitle}
        existingSlug={editingSlug}
        editToken={editToken}
        onSuccess={() => {
          fetchProjects();
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-6 py-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>ShareWithMe</span>
          <span>•</span>
          <a
            href="https://hitarth.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-blue-400 transition"
          >
            hitarth.tech
          </a>
        </div>
        <div>All temporary deployments auto-purge on expiration. Zero tracking.</div>
      </footer>
    </div>
  );
}
