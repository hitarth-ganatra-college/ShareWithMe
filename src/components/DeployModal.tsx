'use client';

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Rocket,
  CheckCircle2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Sparkles,
  Clock,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';
import { validateCustomSlug } from '@/lib/slugs';
import { saveLocalGuestProject } from '@/lib/guestSession';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  html: string;
  css: string;
  js: string;
  isAuth: boolean;
  guestSessionId: string;
  defaultTitle?: string;
  existingSlug?: string;
  editToken?: string;
  onSuccess?: () => void;
}

export default function DeployModal({
  isOpen,
  onClose,
  html,
  css,
  js,
  isAuth,
  guestSessionId,
  defaultTitle = '',
  existingSlug,
  editToken,
  onSuccess,
}: DeployModalProps) {
  const [title, setTitle] = useState(defaultTitle || 'My Awesome Creation');
  const [customSlug, setCustomSlug] = useState(existingSlug || '');
  const [durationMinutes, setDurationMinutes] = useState<number>(isAuth ? 1440 : 120); // 24h for auth, 2h for guest
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<{
    slug: string;
    editToken: string;
    expiresAt: string;
    url: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDeploy = async () => {
    setError(null);

    if (!title.trim()) {
      setError('Please provide a project name.');
      return;
    }

    if (customSlug && customSlug.trim()) {
      const val = validateCustomSlug(customSlug);
      if (!val.valid) {
        setError(val.error || 'Invalid slug');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch('/api/projects/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          customSlug: customSlug ? customSlug.trim().toLowerCase() : undefined,
          html,
          css,
          js,
          durationMinutes,
          guestSessionId,
          existingSlug,
          editToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to deploy');
      }

      setResult({
        slug: data.slug,
        editToken: data.editToken,
        expiresAt: data.expiresAt,
        url: `${window.location.origin}/p/${data.slug}`,
      });

      // Save to guest local storage if not logged in
      if (!isAuth) {
        saveLocalGuestProject({
          slug: data.slug,
          title: title.trim(),
          editToken: data.editToken,
          expiresAt: data.expiresAt,
        });
      }

      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error deploying project.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadQr = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20, 360, 360);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${result?.slug || 'project'}-qr.png`;
        link.href = pngUrl;
        link.click();
      }
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative text-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {!result ? (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {existingSlug ? 'Update Deployment' : 'Deploy & Share Project'}
                </h3>
                <p className="text-xs text-slate-400">
                  Instantly publish your static site with a live link and QR code.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-5 space-y-4">
              {/* Project Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. My Science Fair Project"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition"
                  maxLength={80}
                />
              </div>

              {/* Custom Slug */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Custom Link Slug (Optional)
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus-within:border-blue-500 transition">
                  <span className="text-slate-500 text-xs font-mono select-none">
                    sharewithme.hitarth.tech/p/
                  </span>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="my-cool-game"
                    disabled={!!existingSlug}
                    className="flex-1 bg-transparent text-slate-100 placeholder:text-slate-600 text-xs md:text-sm font-mono focus:outline-none ml-1 disabled:opacity-50"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Leave empty to auto-generate a memorable short name (e.g. swift-otter-42).
                </p>
              </div>

              {/* Duration / Expiration */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>How long should this link stay live?</span>
                  </label>
                  {!isAuth && (
                    <span className="text-[11px] text-amber-400 font-medium">
                      Guest Max: 2 Hours
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {!isAuth ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setDurationMinutes(30)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition ${
                          durationMinutes === 30
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        30 Minutes
                      </button>
                      <button
                        type="button"
                        onClick={() => setDurationMinutes(60)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition ${
                          durationMinutes === 60
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        1 Hour
                      </button>
                      <button
                        type="button"
                        onClick={() => setDurationMinutes(120)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition ${
                          durationMinutes === 120
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        2 Hours
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setDurationMinutes(60)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition ${
                          durationMinutes === 60
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        1 Hour
                      </button>
                      <button
                        type="button"
                        onClick={() => setDurationMinutes(1440)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition ${
                          durationMinutes === 1440
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        24 Hours
                      </button>
                      <button
                        type="button"
                        onClick={() => setDurationMinutes(7 * 1440)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition ${
                          durationMinutes === 7 * 1440
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        7 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setDurationMinutes(30 * 1440)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition ${
                          durationMinutes === 30 * 1440
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        30 Days
                      </button>
                    </>
                  )}
                </div>

                {!isAuth && (
                  <p className="text-[11px] text-slate-500 mt-2">
                    Want your link to stay live for up to 30 days? Sign in with Google to get 5 active projects!
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-7 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeploy}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 disabled:opacity-50 transition"
              >
                {loading ? (
                  <span>Deploying...</span>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    <span>{existingSlug ? 'Update Project' : 'Deploy & Get QR'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Deployment Success View */
          <div className="text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-bold text-slate-100">Your site is Live!</h3>
            <p className="text-xs text-slate-400 mt-1">
              Anyone with this link or QR code can instantly view your creation.
            </p>

            {/* QR Code Container */}
            <div
              ref={qrRef}
              className="mt-6 p-4 bg-white rounded-2xl inline-block shadow-2xl mx-auto border-4 border-slate-800"
            >
              <QRCodeSVG value={result.url} size={180} level="M" />
            </div>

            {/* Link Copy Box */}
            <div className="mt-5 flex items-center gap-2 bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-left">
              <LinkIcon className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-xs text-slate-200 font-mono truncate flex-1">
                {result.url}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Share / Save actions */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadQr}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save QR Code</span>
              </button>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Live Site</span>
              </a>
            </div>

            <button
              onClick={onClose}
              className="mt-5 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              Back to Editor
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
