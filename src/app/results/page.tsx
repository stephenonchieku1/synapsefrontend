'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Pill, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Activity, 
  Sparkles, 
  Volume2, 
  VolumeX,
  FileImage,
  Loader2,
  Search,
  Leaf
} from 'lucide-react';
import AudioVisualizer from '@/components/AudioVisualizer';
import ChatInterface from '@/components/ChatInterface';
import ThemeToggle from '@/components/ThemeToggle';

interface HerbalAlternative {
  name: string;
  description: string;
  safety_warning: string;
  name_sw?: string;
  description_sw?: string;
  safety_warning_sw?: string;
}

interface DrugAnalysis {
  name: string;
  is_brand_name?: boolean;
  brand_name?: string | null;
  generic_name: string;
  drug_class: string;
  drug_class_sw?: string;
  dosage: string;
  frequency: string;
  duration: string;
  uses: string[];
  side_effects: string[];
  warnings: string[];
  suitability_warnings: string;
  suitability_warnings_sw?: string;
  simple_explanation: string;
  ocr_raw_text: string;
  safety_disclaimer: string;
  herbal_alternatives?: HerbalAlternative[];
  simple_explanation_sw?: string;
  uses_sw?: string[];
  side_effects_sw?: string[];
  warnings_sw?: string[];
  safety_disclaimer_sw?: string;
}

interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  audio_url?: string | null;
  created_at?: string;
}

interface UploadDetails {
  id: number;
  image_url: string;
  analysis: DrugAnalysis;
  created_at: string;
  messages: Message[];
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const uploadId = searchParams.get('id');

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  const [data, setData] = useState<UploadDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Waveform state
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);
  const [lang, setLang] = useState<'en' | 'sw'>('en');

  // Stop and reset audio player when language changes
  useEffect(() => {
    if (audioPlayer) {
      audioPlayer.pause();
      setAudioPlayer(null);
      setIsAudioPlaying(false);
    }
  }, [lang]);

  const getAudioUrl = () => {
    if (!currentAudioUrl) return null;
    if (lang === 'sw') {
      return currentAudioUrl.replace('.mp3', '_sw.mp3');
    }
    return currentAudioUrl;
  };

  const t = {
    explanation: lang === 'en' ? 'Layman Explanation' : 'Maelezo ya Kueleweka kwa Mgonjwa',
    uses: lang === 'en' ? 'Common Uses' : 'Matumizi Yaliyokusudiwa',
    sideEffects: lang === 'en' ? 'Side Effects' : 'Madhara ya Kawaida ya Dawa',
    precautions: lang === 'en' ? 'Precautions & Warnings' : 'Tahadhari na Maonyo',
    alternatives: lang === 'en' ? 'Complementary Herbal & Natural Options' : 'Chaguzi za Nyongeza za Mimea na Asili',
    ocrTitle: lang === 'en' ? 'Prescription Image' : 'Picha ya Cheti cha Dawa',
    searchTitle: lang === 'en' ? 'Search Query Source' : 'Chanzo cha Utafutaji',
    ocrRaw: lang === 'en' ? 'Extracted Prescription OCR Text' : 'Maandishi Yaliyotolewa kwenye Cheti (OCR)',
    frequency: lang === 'en' ? 'Frequency' : 'Mzunguko wa Kunywa',
    duration: lang === 'en' ? 'Duration' : 'Muda wa Matibabu',
    assistantTitle: lang === 'en' ? 'Synapse Voice Assist' : 'Msaidizi wa Sauti wa Synapse',
    speakingState: lang === 'en' ? 'Assistant is speaking now...' : 'Msaidizi anazungumza sasa...',
    clickReplay: lang === 'en' ? 'Click the sphere to replay the overview' : 'Bofya tu tufe ili kusikiliza tena maelezo',
    genericName: lang === 'en' ? 'Generic Active Ingredient' : 'Kiambata Hai (Generic)',
    drugClass: lang === 'en' ? 'Drug Class' : 'Kundi la Dawa',
    suitabilityTitle: lang === 'en' ? 'Suitability & Conditions Warning' : 'Tahadhari ya Kufaa Dawa na Hali ya Afya',
    suitabilityIntro: lang === 'en' ? 'Warning: This medication may not be suitable for everyone, especially individuals with certain health conditions.' : 'Ilani: Dawa hii inaweza isiwe salama kwa kila mtu, hasa watu walio na hali fulani za afya.',
  };

  useEffect(() => {
    if (!uploadId) {
      router.push('/');
      return;
    }

    const fetchDetails = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/uploads/${uploadId}`);
        if (!res.ok) {
          throw new Error('Failed to load analysis results. Make sure the ID is valid.');
        }
        const json = await res.json();
        setData(json);
        
        // Find the initial assistant audio URL (first audio message)
        const initialAudioMsg = json.messages.find((m: Message) => m.role === 'assistant' && m.audio_url);
        if (initialAudioMsg?.audio_url) {
          setCurrentAudioUrl(initialAudioMsg.audio_url);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Unable to connect to the backend server.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [uploadId, BACKEND_URL, router]);

  // Clean up audio player on unmount
  useEffect(() => {
    return () => {
      if (audioPlayer) {
        audioPlayer.pause();
      }
    };
  }, [audioPlayer]);

  // Auto-play introduction audio on load
  const triggerAutoPlay = () => {
    const targetAudioUrl = getAudioUrl();
    if (data && targetAudioUrl && !audioPlayer) {
      const absoluteUrl = targetAudioUrl.startsWith('http') ? targetAudioUrl : `${BACKEND_URL}${targetAudioUrl}`;
      const player = new Audio(absoluteUrl);
      setAudioPlayer(player);
      setIsAudioPlaying(true);

      player.play().catch(err => {
        console.warn('Auto-play blocked by browser. User interaction required.', err);
        setIsAudioPlaying(false);
      });

      player.onended = () => {
        setIsAudioPlaying(false);
      };
    }
  };

  // Play audio on user demand or auto
  useEffect(() => {
    const targetAudioUrl = getAudioUrl();
    if (data && targetAudioUrl) {
      // Small timeout to let UI mount
      const timer = setTimeout(() => {
        triggerAutoPlay();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [data, currentAudioUrl, lang]);

  const toggleAutoPlayAudio = () => {
    if (audioPlayer) {
      if (isAudioPlaying) {
        audioPlayer.pause();
        setIsAudioPlaying(false);
      } else {
        audioPlayer.play().catch(() => setIsAudioPlaying(false));
        setIsAudioPlaying(true);
      }
    } else {
      const targetAudioUrl = getAudioUrl();
      if (targetAudioUrl) {
        const absoluteUrl = targetAudioUrl.startsWith('http') ? targetAudioUrl : `${BACKEND_URL}${targetAudioUrl}`;
        const player = new Audio(absoluteUrl);
        setAudioPlayer(player);
        setIsAudioPlaying(true);
        player.play().catch(() => setIsAudioPlaying(false));
        player.onended = () => setIsAudioPlaying(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-zinc-400" size={36} />
        <p className="text-sm text-zinc-400">Loading analysis data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldAlert className="text-zinc-400" size={48} />
        <h2 className="text-xl font-bold text-zinc-200">Analysis Error</h2>
        <p className="text-sm text-zinc-400 max-w-md leading-relaxed">{error}</p>
        <Link href="/" className="mt-4 px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-sm transition-all shadow-lg">
          Back to Upload
        </Link>
      </div>
    );
  }

  const { analysis, image_url, messages } = data;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] relative pb-16 transition-colors duration-300">
      {/* Decorative Gradients - Monochrome */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/[0.01] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/[0.01] rounded-full blur-[100px] pointer-events-none" />

      {/* Top Navbar */}
      <nav className="border-b border-[var(--card-border)] bg-[var(--card)]/50 backdrop-blur-md sticky top-0 z-20 transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-[var(--foreground)] transition-colors">
            <ChevronLeft size={16} />
            <span>New Prescription</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center">
              <Activity size={16} />
            </div>
            <span className="text-sm font-bold text-[var(--foreground)]">Synapse Assistant</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs text-zinc-500 font-mono hidden sm:block">Session ID: #{uploadId}</div>
            
            {/* Language Selector */}
            <div className="flex bg-[var(--secondary)] border border-[var(--card-border)] rounded-xl p-0.5 shadow-sm text-[10px] font-bold">
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[var(--primary)] text-[var(--background)] shadow-sm'
                    : 'text-zinc-400 hover:text-[var(--foreground)]'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('sw')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'sw'
                    ? 'bg-[var(--primary)] text-[var(--background)] shadow-sm'
                    : 'text-zinc-400 hover:text-[var(--foreground)]'
                }`}
              >
                SW
              </button>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Grid Dashboard */}
      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Medical Analysis Details (7 Cols) */}
        <section className="lg:col-span-7 space-y-6">
          
          {/* Main Card (Drug Classification Overview) */}
          <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border border-white/10">
            <div className="absolute top-0 right-0 p-4">
              <span className="text-xs font-bold text-zinc-300 bg-zinc-800 border border-zinc-700 px-3 py-1 rounded-full uppercase tracking-wider">
                Active Match
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--secondary)] border border-[var(--card-border)] text-zinc-300 flex items-center justify-center shrink-0">
                <Pill size={22} className="text-[var(--foreground)]" />
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">{analysis.name}</h1>
                
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--foreground)] text-[var(--background)]">
                    {lang === 'sw' ? (analysis.drug_class_sw || analysis.drug_class) : analysis.drug_class}
                  </span>
                  {analysis.generic_name && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--secondary)] border border-[var(--card-border)] text-zinc-450">
                      {t.genericName}: <span className="text-[var(--foreground)]">{analysis.generic_name}</span>
                    </span>
                  )}
                </div>
                
                <p className="text-sm font-semibold text-zinc-455 mt-2">Strength/Dosage: {analysis.dosage || 'Not specified'}</p>
              </div>
            </div>

            {analysis.is_brand_name && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
                <Pill size={16} className="shrink-0 mt-0.5 text-amber-450 animate-pulse" />
                <p>
                  <strong>{analysis.name}</strong> {lang === 'sw' ? 'ni jina la chapa ya viambata hai vya dawa ya' : 'is a brand name for the active ingredient'} <strong>{analysis.generic_name}</strong>, {lang === 'sw' ? 'ambayo huainishwa kama' : 'which is categorized as a(n)'} <strong>{(lang === 'sw' ? (analysis.drug_class_sw || analysis.drug_class) : analysis.drug_class).toLowerCase()}</strong>.
                </p>
              </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4 mt-6 border-t border-[var(--card-border)] pt-6">
              <div className="flex items-center gap-3 bg-[var(--secondary)] p-3 rounded-2xl border border-[var(--card-border)]">
                <Clock className="text-zinc-400 shrink-0" size={18} />
                <div>
                  <div className="text-[10px] uppercase font-bold text-zinc-500">{t.frequency}</div>
                  <div className="text-sm font-bold text-[var(--foreground)]">{analysis.frequency || 'As directed'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-[var(--secondary)] p-3 rounded-2xl border border-[var(--card-border)]">
                <Calendar className="text-zinc-400 shrink-0" size={18} />
                <div>
                  <div className="text-[10px] uppercase font-bold text-zinc-500">{t.duration}</div>
                  <div className="text-sm font-bold text-[var(--foreground)]">{analysis.duration || 'Not specified'}</div>
                </div>
              </div>
            </div>

            {/* Simple Patient Explanation */}
            <div className="mt-6 bg-[var(--secondary)] border border-[var(--card-border)] rounded-2xl p-4">
              <h3 className="text-xs font-bold text-zinc-450 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles size={12} />
                <span>{t.explanation}</span>
              </h3>
              <p className="text-sm leading-relaxed text-[var(--foreground)] opacity-90 font-medium">
                {lang === 'sw' ? (analysis.simple_explanation_sw || analysis.simple_explanation) : analysis.simple_explanation}
              </p>
            </div>
          </div>

          {/* Suitability Warning Callout Card */}
          {(analysis.suitability_warnings || analysis.suitability_warnings_sw) && (
            <div className="glass-panel rounded-3xl p-6 border border-amber-500/20 bg-gradient-to-r from-amber-500/[0.03] to-transparent relative overflow-hidden transition-all duration-300">
              <div className="absolute top-[-20px] left-[-20px] w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-amber-550 shrink-0" />
                <span>{t.suitabilityTitle}</span>
              </h3>
              <div className="space-y-2 text-sm text-[var(--foreground)] opacity-90 leading-relaxed">
                <p className="font-semibold text-amber-300/90 text-xs">
                  {t.suitabilityIntro}
                </p>
                <div className="bg-[var(--secondary)] p-4 rounded-2xl border border-[var(--card-border)] text-zinc-350 italic mt-2.5">
                  "{lang === 'sw' ? (analysis.suitability_warnings_sw || analysis.suitability_warnings) : analysis.suitability_warnings}"
                </div>
              </div>
            </div>
          )}

          {/* Uses, Warnings, Side effects Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Indicated Uses */}
            <div className="glass-panel rounded-3xl p-6">
              <h3 className="text-sm font-bold text-[var(--foreground)] border-b border-[var(--card-border)] pb-3 mb-4 flex items-center gap-2">
                <CheckCircle className="text-zinc-400" size={16} />
                <span>{t.uses}</span>
              </h3>
              <ul className="space-y-3">
                {(lang === 'sw' ? (analysis.uses_sw || analysis.uses) : analysis.uses).map((use, idx) => (
                  <li key={idx} className="text-sm text-[var(--foreground)] opacity-85 flex items-start gap-2.5 leading-relaxed">
                    <span className="w-1.5 h-1.5 bg-zinc-450 rounded-full mt-1.5 shrink-0" />
                    <span>{use}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Side Effects */}
            <div className="glass-panel rounded-3xl p-6">
              <h3 className="text-sm font-bold text-[var(--foreground)] border-b border-[var(--card-border)] pb-3 mb-4 flex items-center gap-2">
                <Activity className="text-zinc-400" size={16} />
                <span>{t.sideEffects}</span>
              </h3>
              <ul className="space-y-3">
                {(lang === 'sw' ? (analysis.side_effects_sw || analysis.side_effects) : analysis.side_effects).map((effect, idx) => (
                  <li key={idx} className="text-sm text-[var(--foreground)] opacity-85 flex items-start gap-2.5 leading-relaxed">
                    <span className="w-1.5 h-1.5 bg-zinc-450 rounded-full mt-1.5 shrink-0" />
                    <span>{effect}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Warnings & Precautions */}
          <div className="glass-panel rounded-3xl p-6">
            <h3 className="text-sm font-bold text-[var(--foreground)] border-b border-[var(--card-border)] pb-3 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-zinc-400" size={16} />
              <span>{t.precautions}</span>
            </h3>
            <ul className="space-y-3">
              {(lang === 'sw' ? (analysis.warnings_sw || analysis.warnings) : analysis.warnings).map((warning, idx) => (
                <li key={idx} className="text-sm text-[var(--foreground)] opacity-85 flex items-start gap-3 leading-relaxed">
                  <AlertTriangle className="text-zinc-500 shrink-0 mt-0.5" size={15} />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Herbal Alternatives */}
          {analysis.herbal_alternatives && analysis.herbal_alternatives.length > 0 && (
            <div className="glass-panel rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-[-30px] right-[-30px] w-28 h-28 text-zinc-500/5 pointer-events-none transform rotate-12">
                <Leaf size={112} />
              </div>

              <h3 className="text-sm font-bold text-[var(--foreground)] border-b border-[var(--card-border)] pb-3 mb-4 flex items-center gap-2">
                <Leaf className="text-zinc-400" size={16} />
                <span>{t.alternatives}</span>
              </h3>
              
              <div className="space-y-4">
                {analysis.herbal_alternatives.map((item, idx) => (
                  <div key={idx} className="bg-[var(--secondary)] rounded-2xl border border-[var(--card-border)] p-4 relative">
                    <h4 className="text-xs font-bold text-[var(--foreground)] flex items-center gap-1.5 mb-1.5">
                      <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                      {lang === 'sw' ? (item.name_sw || item.name) : item.name}
                    </h4>
                    <p className="text-xs text-[var(--foreground)] opacity-95 leading-relaxed pl-3 font-medium">
                      {lang === 'sw' ? (item.description_sw || item.description) : item.description}
                    </p>
                    {(lang === 'sw' ? item.safety_warning_sw : item.safety_warning) && (
                      <div className="mt-2.5 pt-2 border-t border-[var(--card-border)] pl-3 flex gap-2 items-start text-[10px] text-zinc-550">
                        <AlertTriangle className="shrink-0 mt-0.5 animate-pulse text-zinc-500" size={11} />
                        <span className="leading-normal font-medium">
                          {lang === 'sw' ? (item.safety_warning_sw || item.safety_warning) : item.safety_warning}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Upload Preview & OCR raw text */}
          <div className="glass-panel rounded-3xl p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                {image_url.includes('placeholder') ? <Search size={12} /> : <FileImage size={12} />}
                <span>{image_url.includes('placeholder') ? t.searchTitle : t.ocrTitle}</span>
              </h4>
              <div className="relative rounded-2xl overflow-hidden border border-[var(--card-border)] group aspect-[4/3] bg-[var(--secondary)] flex items-center justify-center">
                {image_url.includes('placeholder') ? (
                  <div className="flex flex-col items-center gap-3 text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--background)] border border-[var(--card-border)] flex items-center justify-center text-zinc-400">
                      <Search size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider">
                        {lang === 'sw' ? 'Utafutaji wa Moja kwa Moja' : 'Direct Search Lookup'}
                      </span>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        {lang === 'sw' ? 'Karatasi ya maelezo ya dawa hii ilitafutwa moja kwa moja kwa jina.' : 'This medication details sheet was looked up directly by name.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <img 
                    src={`${BACKEND_URL}${image_url}`} 
                    alt="Prescription Uploaded" 
                    className="object-contain w-full h-full max-h-[160px] opacity-80 group-hover:scale-102 group-hover:opacity-100 transition-all"
                  />
                )}
              </div>
            </div>

            <div className="md:col-span-7 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t.ocrRaw}</h4>
              <div className="bg-[var(--secondary)] rounded-2xl border border-[var(--card-border)] p-3.5 h-[160px] overflow-y-auto font-mono text-[11px] text-[var(--foreground)] opacity-80 leading-normal whitespace-pre-wrap">
                {analysis.ocr_raw_text || 'No text could be extracted.'}
              </div>
            </div>
          </div>

          {/* Safety Warning */}
          <div className="p-4 rounded-2xl bg-[var(--secondary)] border border-[var(--card-border)] flex gap-3 items-start">
            <ShieldAlert className="text-zinc-500 shrink-0 mt-0.5" size={16} />
            <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
              {lang === 'sw' ? (analysis.safety_disclaimer_sw || analysis.safety_disclaimer) : analysis.safety_disclaimer}
            </p>
          </div>

        </section>

        {/* Right Side: Voice Avatar Hologram & Chat Interface (5 Cols) */}
        <section className="lg:col-span-5 space-y-6">
          
          {/* Avatar Voice Hologram Panel */}
          <div className="glass-panel rounded-3xl p-6 flex flex-col items-center gap-5 relative overflow-hidden">
            {/* Hologram Circle background grid */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02),transparent_60%)] pointer-events-none" />
            
            {/* Pulsating avatar orb */}
            <div className="relative mt-2">
              {/* Outer halo */}
              <div className={`absolute inset-[-12px] rounded-full blur-xl bg-white opacity-5 transition-all duration-700 ${isAudioPlaying ? 'scale-110 opacity-10 animate-pulse' : 'scale-95'}`} />
              
              <button 
                onClick={toggleAutoPlayAudio}
                className={`relative w-28 h-28 rounded-full border overflow-hidden flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
                  isAudioPlaying 
                    ? 'border-white shadow-white/10 scale-102' 
                    : 'border-zinc-850 hover:border-zinc-700'
                }`}
              >
                {/* Human AI Avatar Image */}
                <img 
                  src="/avatar.png" 
                  alt="Synapse AI Avatar" 
                  className={`w-full h-full object-cover transition-transform duration-750 ${isAudioPlaying ? 'scale-105 pulsing-dot' : 'scale-100 opacity-90'}`}
                />

                {/* Holographic lines */}
                <div className={`absolute inset-0 rounded-full border border-white/10 border-dashed animate-[spin_25s_linear_infinite] pointer-events-none ${isAudioPlaying ? 'opacity-100' : 'opacity-40'}`} />
                
                {/* Speaking control overlay badge */}
                <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-zinc-950/80 border border-white/10 flex items-center justify-center shadow-lg text-white pointer-events-none z-10">
                  {isAudioPlaying ? <Volume2 size={12} className="animate-pulse" /> : <VolumeX size={12} className="text-zinc-400" />}
                </div>
              </button>
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-zinc-200">{t.assistantTitle}</h4>
              <p className="text-xs text-zinc-500 font-semibold">
                {isAudioPlaying ? t.speakingState : t.clickReplay}
              </p>
            </div>

            {/* Dynamic Waveform Visualizer */}
            <AudioVisualizer isPlaying={isAudioPlaying} barCount={20} />
          </div>

          {/* Interactive Chat Board */}
          <ChatInterface 
            uploadId={parseInt(uploadId!)} 
            initialMessages={messages} 
            backendUrl={BACKEND_URL}
            onPlayStateChange={setIsAudioPlaying}
            onNewAudioGenerated={setCurrentAudioUrl}
            lang={lang}
          />

        </section>

      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-zinc-400" size={36} />
        <p className="text-sm text-zinc-400">Loading components...</p>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
