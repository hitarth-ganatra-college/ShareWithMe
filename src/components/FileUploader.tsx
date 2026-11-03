'use client';

import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { UploadCloud, FileArchive, CheckCircle2, AlertCircle, FileText, X } from 'lucide-react';

interface FileUploaderProps {
  onFilesLoaded: (data: { html: string; css: string; js: string; filename?: string }) => void;
}

export default function FileUploader({ onFilesLoaded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFileList = async (files: FileList | File[]) => {
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const fileArray = Array.from(files);
      const zipFile = fileArray.find((f) => f.name.endsWith('.zip'));

      if (zipFile) {
        // Handle ZIP file
        setStatusMessage(`Extracting ${zipFile.name}...`);
        const zip = await JSZip.loadAsync(zipFile);
        const extracted: { name: string; size: number }[] = [];

        let foundHtml = '';
        let foundCss = '';
        let foundJs = '';

        const fileEntries = Object.keys(zip.files).filter((k) => !zip.files[k].dir);

        for (const filename of fileEntries) {
          const zipEntry = zip.files[filename];
          const lower = filename.toLowerCase();

          if (lower.endsWith('.html') || lower.endsWith('.htm')) {
            const content = await zipEntry.async('string');
            if (!foundHtml || lower.includes('index')) {
              foundHtml = content;
            }
            extracted.push({ name: filename, size: content.length });
          } else if (lower.endsWith('.css')) {
            const content = await zipEntry.async('string');
            foundCss += (foundCss ? '\n\n' : '') + `/* ${filename} */\n` + content;
            extracted.push({ name: filename, size: content.length });
          } else if (lower.endsWith('.js')) {
            const content = await zipEntry.async('string');
            foundJs += (foundJs ? '\n\n' : '') + `// ${filename}\n` + content;
            extracted.push({ name: filename, size: content.length });
          }
        }

        if (!foundHtml) {
          throw new Error('No .html or index.html file found inside the zip archive.');
        }

        setUploadedFiles(extracted);
        setStatusMessage(`Successfully extracted ${extracted.length} files from ${zipFile.name}!`);
        onFilesLoaded({
          html: foundHtml,
          css: foundCss,
          js: foundJs,
          filename: zipFile.name.replace(/\.zip$/i, ''),
        });
      } else {
        // Individual files
        let htmlContent = '';
        let cssContent = '';
        let jsContent = '';
        const extracted: { name: string; size: number }[] = [];

        for (const f of fileArray) {
          const content = await f.text();
          const lower = f.name.toLowerCase();
          extracted.push({ name: f.name, size: f.size });

          if (lower.endsWith('.html') || lower.endsWith('.htm')) {
            if (!htmlContent || lower.includes('index')) {
              htmlContent = content;
            }
          } else if (lower.endsWith('.css')) {
            cssContent += (cssContent ? '\n\n' : '') + `/* ${f.name} */\n` + content;
          } else if (lower.endsWith('.js')) {
            jsContent += (jsContent ? '\n\n' : '') + `// ${f.name}\n` + content;
          }
        }

        if (!htmlContent && !cssContent && !jsContent) {
          throw new Error('Please select at least one .html, .css, or .js file.');
        }

        setUploadedFiles(extracted);
        setStatusMessage(`Successfully loaded ${extracted.length} file(s)!`);
        onFilesLoaded({
          html: htmlContent,
          css: cssContent,
          js: jsContent,
          filename: fileArray[0]?.name.split('.')[0],
        });
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to process files.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10 scale-[0.99]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".html,.htm,.css,.js,.zip"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFileList(e.target.files);
            }
          }}
        />

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base font-semibold text-slate-100">
          Drop your project folder (.zip) or HTML/CSS/JS files
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Supports .zip archives containing index.html, or individual .html, .css, and .js files.
        </p>

        <button
          type="button"
          className="mt-5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
        >
          Browse Files
        </button>
      </div>

      {loading && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs text-blue-400 animate-pulse">
          Processing files...
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {statusMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-300">
              Loaded Files ({uploadedFiles.length})
            </span>
            <button
              onClick={() => setUploadedFiles([])}
              className="text-xs text-slate-500 hover:text-slate-300 transition"
            >
              Clear
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {uploadedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 bg-slate-950/70 border border-slate-800/80 rounded-lg text-xs"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate text-slate-200 flex-1">{file.name}</span>
                <span className="text-slate-500 shrink-0 text-[10px]">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
