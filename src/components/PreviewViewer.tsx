'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Clock,
  Share2,
  Copy,
  Check,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  ExternalLink,
  Code2,
  Eye,
  X,
  Download,
} from 'lucide-react';
import Link from 'next/link';

interface PreviewViewerProps {
  slug: string;
  title: string;
  expiresAt: string;
  htmlBundle: string;
  views: number;
}

export default function PreviewViewer({
  slug,
  title,
  expiresAt,
  htmlBundle,
  views: initialViews,
}: PreviewViewerProps) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  // Countdown timer logic
  useEffect(() => {
    const target = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s left`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
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
        link.download = `${slug}-qrcode.png`;
        link.href = pngUrl;
        link.click();
      }
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const rawUrl = `/raw/${slug}`;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-base tracking-tight hover:opacity-80 transition shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Code2 className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              ShareWithMe
            </span>
          </Link>

          <span className="text-slate-700 hidden sm:inline">/</span>

          <div className="truncate">
            <h1 className="font-semibold text-sm text-slate-200 truncate">{title}</h1>
            <p className="text-xs text-slate-400 truncate hidden md:block">
              {shareUrl || `/p/${slug}`}
            </p>
          </div>
        </div>

        {/* Viewport switchers (Desktop / Tablet / Mobile) */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-slate-300">
          <button
            onClick={() => setDeviceMode('desktop')}
            title="Desktop view (100%)"
            className={`p-1.5 rounded transition ${
              deviceMode === 'desktop'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:text-white hover:bg-slate-700'
            }`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            title="Tablet view (768px)"
            className={`p-1.5 rounded transition ${
              deviceMode === 'tablet'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:text-white hover:bg-slate-700'
            }`}
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            title="Mobile view (375px)"
            className={`p-1.5 rounded transition ${
              deviceMode === 'mobile'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'hover:text-white hover:bg-slate-700'
            }`}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Actions & Status */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Expiry Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isExpired
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{timeLeft || 'Calculating...'}</span>
          </div>

          {/* Views badge */}
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 bg-slate-800/60 px-2 py-1 rounded-md border border-slate-800">
            <Eye className="w-3.5 h-3.5" />
            <span>{initialViews}</span>
          </div>

          {/* QR Code Button */}
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share / QR</span>
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition shadow-sm ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {/* Open Raw Fullscreen */}
          <a
            href={rawUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Fullscreen Raw Page"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Main Preview Container */}
      <main className="flex-1 w-full bg-slate-900/50 flex items-center justify-center p-0 md:p-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 shadow-2xl relative ${
            deviceMode === 'mobile'
              ? 'w-[375px] max-h-[812px] rounded-2xl border-4 border-slate-800 overflow-hidden'
              : deviceMode === 'tablet'
              ? 'w-[768px] max-h-[1024px] rounded-xl border-2 border-slate-800 overflow-hidden'
              : 'w-full h-full border-0 rounded-none'
          }`}
        >
          {isExpired ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-center p-6">
              <Clock className="w-12 h-12 text-red-400 mb-4" />
              <h2 className="text-xl font-bold text-slate-200">This deployment has expired</h2>
              <p className="text-sm text-slate-400 max-w-sm mt-2">
                The time limit for this temporary site has ended and the files have been cleaned up.
              </p>
              <Link
                href="/"
                className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow transition"
              >
                Create a New Site
              </Link>
            </div>
          ) : (
            <iframe
              title={title}
              srcDoc={htmlBundle}
              sandbox="allow-scripts allow-forms allow-modals allow-popups"
              className="w-full h-full bg-white border-0"
            />
          )}
        </div>
      </main>

      {/* QR Code & Share Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-100">{title}</h3>
            <p className="text-xs text-slate-400 mt-1">Scan to test on your phone or share with friends</p>

            {/* QR Code Canvas */}
            <div
              ref={qrRef}
              className="mt-5 p-4 bg-white rounded-xl inline-block shadow-lg mx-auto"
            >
              <QRCodeSVG
                value={shareUrl || `https://sharewithme.hitarth.tech/p/${slug}`}
                size={200}
                level="M"
                includeMargin={false}
              />
            </div>

            {/* Link Preview box */}
            <div className="mt-4 flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3 py-2 rounded-lg text-left">
              <span className="text-xs text-slate-300 truncate flex-1 font-mono">
                {shareUrl || `/p/${slug}`}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 hover:text-blue-400 text-slate-400 transition shrink-0"
                title="Copy Link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Quick Share Buttons */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadQr}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save PNG</span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Check out "${title}" on ShareWithMe: ${shareUrl || window.location.href}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
              >
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
