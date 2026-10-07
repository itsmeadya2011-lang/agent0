import React from 'react';

interface Agent0LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const Agent0Logo: React.FC<Agent0LogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = false,
}) => {
  // Dot matrix representation for "agent0"
  // Inspired by the LED dot matrix logo provided in user image
  const sizeScales = {
    sm: 'text-xl tracking-wider',
    md: 'text-2xl tracking-widest',
    lg: 'text-4xl tracking-widest',
    xl: 'text-6xl tracking-widest',
  };

  return (
    <div className={`flex flex-col select-none ${className}`}>
      <div className="flex items-center gap-3">
        {/* Animated Halftone / Dot Matrix Icon Badge */}
        <div className="relative flex items-center justify-center p-2 rounded-lg bg-zinc-950 border border-zinc-800 shadow-[0_0_20px_rgba(255,255,255,0.07)]">
          <div className="grid grid-cols-4 gap-1 p-0.5">
            {[
              1, 1, 1, 1,
              1, 0, 0, 1,
              1, 1, 1, 1,
              1, 0, 0, 1,
            ].map((dot, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                  dot
                    ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                    : 'bg-zinc-800/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Dot Matrix Wordmark matching the uploaded image */}
        <div className="flex items-baseline">
          <span
            className={`font-mono font-black text-white uppercase tracking-tight ${sizeScales[size]} drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]`}
            style={{
              letterSpacing: '0.08em',
              textShadow: '0 0 10px rgba(255,255,255,0.7), 0 0 20px rgba(255,255,255,0.2)',
            }}
          >
            agent
            <span className="text-zinc-100 font-extrabold border-b-2 border-white/60 pb-0.5">0</span>
          </span>
          <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-widest bg-zinc-900 text-zinc-400 border border-zinc-700/60 rounded">
            v2.6
          </span>
        </div>
      </div>

      {showSubtitle && (
        <span className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mt-1 pl-1">
          Autonomous Next-Gen Agent Architecture
        </span>
      )}
    </div>
  );
};
