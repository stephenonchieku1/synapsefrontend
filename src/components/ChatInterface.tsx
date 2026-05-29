'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Volume2, VolumeX, Bot, User, Loader2, Mic, MicOff } from 'lucide-react';

interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  audio_url?: string | null;
  created_at?: string;
}

interface ChatInterfaceProps {
  uploadId: number;
  initialMessages: Message[];
  backendUrl: string;
  onPlayStateChange: (isPlaying: boolean) => void;
  onNewAudioGenerated: (audioUrl: string) => void;
  lang?: 'en' | 'sw';
}

// Extend Window to include vendor-prefixed SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionInstance) | null {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export default function ChatInterface({
  uploadId,
  initialMessages,
  backendUrl,
  onPlayStateChange,
  onNewAudioGenerated,
  lang = 'en'
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<number | string | null>(null);

  // Voice input state
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const speechSupported = typeof window !== 'undefined' && getSpeechRecognition() !== null;

  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync initial messages when they load
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up audio and speech recognition on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        onPlayStateChange(false);
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onPlayStateChange]);

  const playAudio = (url: string, id: number | string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      onPlayStateChange(false);

      // If clicking the currently playing audio, stop it
      if (playingAudioId === id) {
        setPlayingAudioId(null);
        return;
      }
    }

    const absoluteUrl = url.startsWith('http') ? url : `${backendUrl}${url}`;
    const audio = new Audio(absoluteUrl);
    audioRef.current = audio;
    setPlayingAudioId(id);
    onPlayStateChange(true);

    audio.play().catch(err => {
      console.error('Audio playback failed:', err);
      setPlayingAudioId(null);
      onPlayStateChange(false);
    });

    audio.onended = () => {
      setPlayingAudioId(null);
      onPlayStateChange(false);
    };
  };

  const submitMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    setInput('');
    setIsLoading(true);

    // Append user message immediately
    const tempUserMsg: Message = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const formData = new FormData();
      formData.append('upload_id', uploadId.toString());
      formData.append('message', userMessage);
      formData.append('lang', lang);

      const res = await fetch(`${backendUrl}/api/chat`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to send message');

      const data = await res.json();

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.content,
        audio_url: data.audio_url
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Automatically play the voice response if available
      if (data.audio_url) {
        const uniqueId = `msg-${Date.now()}`;
        onNewAudioGenerated(data.audio_url);
        playAudio(data.audio_url, uniqueId);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: lang === 'sw'
            ? 'Samahani, nimepata hitilafu katika kushughulikia hilo. Tafadhali angalia muunganisho wa mfumo.'
            : 'Sorry, I encountered an issue processing that. Please check your backend connection.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, uploadId, lang, backendUrl, onNewAudioGenerated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitMessage(input);
  };

  // Voice input handlers
  const startListening = useCallback(() => {
    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) return;

    // Stop any playing audio when mic starts
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingAudioId(null);
      onPlayStateChange(false);
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = lang === 'sw' ? 'sw-KE' : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }
      if (finalText) {
        setInput(prev => (prev + ' ' + finalText).trim());
        setInterimTranscript('');
      } else {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event: Event & { error: string }) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang, onPlayStateChange]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Determine the displayed placeholder
  const displayPlaceholder = isListening
    ? (lang === 'sw' ? 'Sikiliza... sema sasa' : 'Listening... speak now')
    : (lang === 'sw' ? 'Uliza swali la ziada kuhusu dawa hii...' : 'Ask a follow-up question...');

  return (
    <div className="flex flex-col h-[520px] glass-panel rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--card-border)] bg-[var(--secondary)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full pulsing-dot" />
          <span className="text-sm font-semibold text-[var(--foreground)]">
            {lang === 'sw' ? 'Msaidizi wa Mazungumzo wa Synapse' : 'Synapse Chat Assistant'}
          </span>
        </div>
        {isListening && (
          <div className="flex items-center gap-2 text-xs text-red-400 font-medium animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            {lang === 'sw' ? 'Inarekodi...' : 'Recording...'}
          </div>
        )}
      </div>

      {/* Messages History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, index) => {
          const isAssistant = msg.role === 'assistant';
          const msgId = msg.id || index;
          const isPlaying = playingAudioId === msgId;

          return (
            <div
              key={index}
              className={`flex gap-3 max-w-[85%] ${
                isAssistant ? 'self-start' : 'self-end ml-auto flex-row-reverse'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                  isAssistant
                    ? 'bg-[var(--secondary)] border-[var(--card-border)] text-[var(--foreground)]'
                    : 'bg-[var(--primary)] border-[var(--card-border)] text-[var(--background)]'
                }`}
              >
                {isAssistant ? <Bot size={15} /> : <User size={15} />}
              </div>

              <div className="flex flex-col gap-1">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isAssistant
                      ? 'bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--card-border)]'
                      : 'bg-[var(--primary)] text-[var(--background)] shadow-md'
                  }`}
                >
                  <p>{msg.content}</p>
                </div>

                {isAssistant && msg.audio_url && (
                  <button
                    onClick={() => playAudio(msg.audio_url!, msgId)}
                    className="flex items-center gap-1.5 self-start text-xs font-semibold text-zinc-400 hover:text-[var(--foreground)] transition-colors py-1 px-2.5 rounded-lg hover:bg-[var(--secondary)] cursor-pointer mt-1"
                  >
                    {isPlaying ? (
                      <>
                        <VolumeX size={13} />
                        <span>{lang === 'sw' ? 'Zima Sauti' : 'Stop Voice'}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={13} />
                        <span>{lang === 'sw' ? 'Sikiliza Tena' : 'Listen Again'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-[80%] self-start">
            <div className="w-8 h-8 rounded-full bg-[var(--secondary)] border border-[var(--card-border)] text-zinc-450 flex items-center justify-center shrink-0">
              <Bot size={15} />
            </div>
            <div className="bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--card-border)] rounded-2xl px-4 py-3 text-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-zinc-400" />
              <span>{lang === 'sw' ? 'Kuhakiki majibu...' : 'Analyzing response...'}</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-4 bg-[var(--secondary)] border-t border-[var(--card-border)] flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={interimTranscript ? `${input} ${interimTranscript}`.trim() : input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={displayPlaceholder}
            className={`w-full bg-[var(--background)] border rounded-2xl px-4 py-3 text-sm text-[var(--foreground)] placeholder-zinc-500 focus:outline-none transition-colors ${
              isListening
                ? 'border-red-500/50 ring-2 ring-red-500/20'
                : 'border-[var(--card-border)] focus:border-[var(--foreground)]/30'
            }`}
            disabled={isLoading}
          />
        </div>

        {/* Microphone Button */}
        {speechSupported && (
          <button
            type="button"
            onClick={toggleListening}
            disabled={isLoading}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0 border ${
              isListening
                ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/25 animate-pulse'
                : 'bg-[var(--background)] text-[var(--foreground)] border-[var(--card-border)] hover:bg-[var(--primary)] hover:text-[var(--background)]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isListening
              ? (lang === 'sw' ? 'Simamisha kunasa sauti' : 'Stop recording')
              : (lang === 'sw' ? 'Anza kunasa sauti' : 'Start voice input')
            }
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
        )}

        {/* Send Button */}
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="w-12 h-12 rounded-2xl bg-[var(--primary)] text-[var(--background)] flex items-center justify-center hover:bg-[var(--secondary)] hover:text-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shrink-0 border border-[var(--card-border)]"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
