'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Clock,
  Eye,
  ExternalLink,
  Edit3,
  Trash2,
  Share2,
  Copy,
  Check,
  X,
  Download,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

export interface ProjectCardData {
  slug: string;
  title: string;
  expiresAt: string;
  createdAt: string;
  views: number;
  editToken?: string;
  htmlBundle?: string;
}

interface ProjectCardProps {
  project: ProjectCardData;
  onEdit: (slug: string) => void;
  onDelete: (slug: string, editToken?: string) => Promise<void>;
}

export default function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const projectUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/p/${project.slug}`
      : `/p/${project.slug}`;

  useEffect(() => {
    const target = new Date(project.expiresAt).getTime();

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
      const minutes = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000); // every 30s
    return () => clearInterval(interval);
  }, [project.expiresAt]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(projectUrl);
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
        link.download = `${project.slug}-qrcode.png`;
        link.href = pngUrl;
        link.click();
      }
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(project.slug, project.editToken);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition flex flex-col group">
        {/* Thumbnail Preview Area */}
        <div className="relative w-full h-36 bg-slate-950 overflow-hidden border-b border-slate-800/80">
          {project.htmlBundle ? (
            <iframe
              title={project.title}
              srcDoc={project.htmlBundle}
              sandbox="allow-scripts"
              tabIndex={-1}
              className="w-[400%] h-[400%] origin-top-left scale-[0.25] pointer-events-none select-none border-0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700 font-mono text-xs">
              Live Preview
            </div>
          )}

          {/* Expiry Badge */}
          <div className="absolute top-2.5 right-2.5">
            <span
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold backdrop-blur-md shadow-sm border ${
                isExpired
                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{timeLeft || '...'}</span>
            </span>
          </div>

          {/* Views count */}
          <div className="absolute bottom-2 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-slate-950/80 text-slate-300 border border-slate-800 backdrop-blur-sm">
            <Eye className="w-3 h-3" />
            <span>{project.views} views</span>
          </div>
        </div>

        {/* Card Info */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-100 truncate group-hover:text-blue-400 transition">
              {project.title}
            </h3>
            <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
              /p/{project.slug}
            </p>
          </div>

          {/* Actions Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowShareModal(true)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Share & QR Code"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onEdit(project.slug)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Edit Code"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                title="Delete Project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <Link
              href={`/p/${project.slug}`}
              className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
            >
              <span>View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Share / QR Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-100">{project.title}</h3>
            <p className="text-xs text-slate-400 mt-1">Scan or copy to share with friends</p>

            <div
              ref={qrRef}
              className="mt-4 p-3 bg-white rounded-xl inline-block shadow-md mx-auto"
            >
              <QRCodeSVG value={projectUrl} size={180} level="M" />
            </div>

            <div className="mt-4 flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-left">
              <span className="text-xs text-slate-300 font-mono truncate flex-1">
                {projectUrl}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 text-slate-400 hover:text-blue-400 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

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
                  `Check out "${project.title}" on ShareWithMe: ${projectUrl}`
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xs w-full shadow-2xl text-center relative">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-100">Delete Project?</h4>
            <p className="text-xs text-slate-400 mt-1">
              Are you sure you want to delete &ldquo;{project.title}&rdquo;? This link will immediately stop working.
            </p>

            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 transition"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
