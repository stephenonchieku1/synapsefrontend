import React from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
}

export default function AudioVisualizer({ isPlaying, barCount = 24 }: AudioVisualizerProps) {
  // Generate random heights and animation durations for a realistic voice wave look
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Generate heights that slope upwards in the center and down at the edges
    const centerFactor = 1 - Math.abs(i - barCount / 2) / (barCount / 2);
    const height = Math.max(15, Math.floor(centerFactor * 70) + Math.floor(Math.random() * 15));
    const duration = 0.8 + Math.random() * 0.8;
    const delay = Math.random() * -1.2;

    return {
      height: `${height}px`,
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
    };
  });

  return (
    <div className="flex items-center justify-center gap-1.5 h-24 px-6 py-4 bg-zinc-950/40 rounded-2xl border border-white/5 backdrop-blur-md w-full">
      {bars.map((bar, index) => (
        <span
          key={index}
          className={`w-1.5 bg-white rounded-full transition-all duration-300 ${
            isPlaying ? 'waveform-bar' : 'opacity-40'
          }`}
          style={{
            height: isPlaying ? bar.height : '8px',
            animationDuration: bar.animationDuration,
            animationDelay: bar.animationDelay,
            animationPlayState: isPlaying ? 'running' : 'paused',
          }}
        />
      ))}
    </div>
  );
}
