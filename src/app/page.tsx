'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, Activity, ShieldAlert, Sparkles, Plus, Loader2, Search } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  const router = useRouter();
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searching || uploading) return;

    setSearching(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('drug_name', searchQuery.trim());

      const res = await fetch(`${BACKEND_URL}/api/search`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Search lookup failed. Please try again.');
      }

      const data = await res.json();
      router.push(`/results?id=${data.id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred during search.');
      setSearching(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to analyze prescription');
      }

      const data = await res.json();
      // Redirect to results page with the upload ID
      router.push(`/results?id=${data.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connection to backend failed. Make sure the backend server is running on port 8000.');
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-between px-6 py-12 relative overflow-hidden transition-colors duration-300">
      {/* Decorative Gradients - Monochrome */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* Header / Brand */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-lg">
            <Activity size={20} />
          </div>
          <div>
            <span className="text-xl font-bold text-[var(--foreground)]">Synapse</span>
            <span className="text-xs text-zinc-300 ml-1.5 font-bold uppercase tracking-wider bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">MVP</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-zinc-400 hidden sm:block">Voice-Guided Medicine Assistant</div>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero & Upload Panel */}
      <div className="w-full max-w-2xl flex flex-col items-center text-center my-auto z-10 gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300">
            <Sparkles size={12} className="text-zinc-200 animate-pulse" />
            <span>OCR + LLM Extraction Layer Active</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--foreground)] leading-tight">
            Understand Your Medication <br className="hidden sm:inline" />
            Instantly with AI & Voice
          </h1>
          <p className="text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
            Upload any handwritten prescription, note, or medicine label. Extract the details, identify instructions, and listen to a simplified audio explanation.
          </p>
        </div>

        {/* Drag and Drop Container */}
        <div className="w-full relative">
          <input
            type="file"
            id="file-upload"
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={uploading}
          />
          
          <label
            htmlFor="file-upload"
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`w-full flex flex-col items-center justify-center px-6 py-12 rounded-3xl glass-panel border transition-all duration-300 cursor-pointer ${
              isDragActive 
                ? 'border-[var(--foreground)] bg-[var(--primary-glow)] shadow-lg scale-[1.01]' 
                : 'border-[var(--card-border)] hover:border-[var(--foreground)]/20 hover:bg-[var(--primary-glow)]'
            } ${uploading ? 'pointer-events-none opacity-80' : ''}`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/5 rounded-full blur-xl animate-pulse" />
                  <Loader2 className="animate-spin text-zinc-200" size={48} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--foreground)]">Analyzing Prescription...</h3>
                  <p className="text-sm text-zinc-500 mt-1">Extracting text & running medicine classification</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--secondary)] border border-[var(--card-border)] flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                  <UploadCloud className="text-zinc-400" size={24} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[var(--foreground)]">
                    Upload prescription or bottle label
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Drag & drop file here or click to browse (supports JPG, PNG, WEBP)
                  </p>
                </div>
              </div>
            )}
          </label>
          
          {error && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3 text-left">
              <ShieldAlert size={18} className="shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center my-6 gap-4">
            <div className="flex-1 h-[1px] bg-[var(--card-border)]" />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Or Search by Name</span>
            <div className="flex-1 h-[1px] bg-[var(--card-border)]" />
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="relative flex items-center bg-[var(--secondary)] border border-[var(--card-border)] rounded-2xl p-1.5 focus-within:border-[var(--foreground)]/30 transition-all">
              <div className="flex items-center pl-3 text-zinc-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter drug name (e.g., Paracetamol, Amoxicillin)..."
                className="flex-1 bg-transparent px-3 py-2 text-sm text-[var(--foreground)] placeholder-zinc-500 focus:outline-none"
                disabled={searching || uploading}
              />
              <button
                type="submit"
                disabled={searching || uploading || !searchQuery.trim()}
                className="px-5 py-2.5 bg-[var(--primary)] text-[var(--background)] font-semibold text-xs rounded-xl hover:bg-[var(--foreground)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer border border-[var(--card-border)]"
              >
                {searching ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <span>Search</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-6 w-full pt-4 max-w-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] border border-[var(--card-border)] text-[var(--foreground)] flex items-center justify-center">
              <FileText size={16} />
            </div>
            <span className="text-xs font-semibold text-zinc-400">OCR Extraction</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] border border-[var(--card-border)] text-[var(--foreground)] flex items-center justify-center">
              <Activity size={16} />
            </div>
            <span className="text-xs font-semibold text-zinc-400">Drug Profiling</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--secondary)] border border-[var(--card-border)] text-[var(--foreground)] flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <span className="text-xs font-semibold text-zinc-400">Voice Synthesis</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-550 gap-4 z-10 border-t border-[var(--card-border)] pt-8">
        <div>© 2026 Synapse Medical AI. All rights reserved.</div>
        <div className="flex gap-4">
          <a href="#" className="hover:text-zinc-400 transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-zinc-400 transition-colors">Terms of Use</a>
          <span>•</span>
          <a href="#" className="hover:text-rose-400/80 transition-colors">Safety Disclaimer</a>
        </div>
      </footer>
    </main>
  );
}
