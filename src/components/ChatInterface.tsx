'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Volume2, VolumeX, Bot, User, Loader2 } from 'lucide-react';

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

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        onPlayStateChange(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
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
  };

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
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={lang === 'sw' ? 'Uliza swali la ziada kuhusu dawa hii...' : 'Ask a follow-up question...'}
          className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-2xl px-4 py-3 text-sm text-[var(--foreground)] placeholder-zinc-500 focus:outline-none focus:border-[var(--foreground)]/30 transition-colors"
          disabled={isLoading}
        />
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
