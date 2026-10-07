import React, { useState, useRef } from 'react';
import { Volume2, VolumeX, Loader2, Play, Square, Sparkles } from 'lucide-react';

interface TtsVoiceControllerProps {
  currentStatusText?: string;
}

export const TtsVoiceController: React.FC<TtsVoiceControllerProps> = ({
  currentStatusText = 'agent0 is operational. All autonomous background processes and workspace nodes are synchronized.',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Puck');
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const voices = [
    { id: 'Puck', label: 'Puck (Tactical / Dynamic)' },
    { id: 'Charon', label: 'Charon (Deep / Command)' },
    { id: 'Kore', label: 'Kore (Clear / Analytical)' },
    { id: 'Fenrir', label: 'Fenrir (Bold / Resolute)' },
    { id: 'Zephyr', label: 'Zephyr (Smooth / Rapid)' },
  ];

  const handleSpeak = async (customText?: string) => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const textToSpeak = customText || currentStatusText;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          voice: selectedVoice,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to synthesize speech');
      }

      const data = await response.json();
      if (!data.audioData) {
        throw new Error('No audio returned');
      }

      const audioSrc = `data:audio/wav;base64,${data.audioData}`;
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioSrc);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setError('Playback failed');
      };

      await audio.play();
      setIsPlaying(true);
    } catch (err: any) {
      console.error('TTS error:', err);
      setError(err.message || 'TTS Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs font-mono backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          {isPlaying && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying ? 'bg-cyan-400' : 'bg-zinc-600'}`}></span>
        </span>
        <span className="text-zinc-400 font-semibold tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          gemini-3.8-flash-tts
        </span>
      </div>

      <div className="h-4 w-px bg-zinc-800" />

      {/* Voice Selection */}
      <select
        value={selectedVoice}
        onChange={(e) => setSelectedVoice(e.target.value)}
        className="bg-zinc-900 text-zinc-300 border border-zinc-700/60 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-cyan-500"
      >
        {voices.map((v) => (
          <option key={v.id} value={v.id}>
            {v.label}
          </option>
        ))}
      </select>

      {/* Waveform / Visualizer */}
      <div className="flex items-center gap-0.5 px-2 py-1 bg-zinc-900/50 rounded border border-zinc-800/80">
        {[4, 8, 12, 6, 14, 10, 5, 11, 7, 3].map((height, i) => (
          <span
            key={i}
            className={`w-0.5 rounded-full transition-all duration-150 ${
              isPlaying
                ? 'bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]'
                : 'bg-zinc-700'
            }`}
            style={{
              height: isPlaying ? `${Math.max(4, (height * (1 + (i % 3) * 0.4)) % 16)}px` : '4px',
            }}
          />
        ))}
      </div>

      {/* Speak Button */}
      <button
        onClick={() => handleSpeak()}
        disabled={isLoading}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all ${
          isPlaying
            ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
            : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
        ) : isPlaying ? (
          <>
            <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Speaking...</span>
          </>
        ) : (
          <>
            <Play className="w-3 h-3 text-zinc-400" />
            <span>Audio Brief</span>
          </>
        )}
      </button>

      {isPlaying && (
        <button
          onClick={handleStop}
          className="p-1 rounded bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 border border-zinc-800"
          title="Stop audio"
        >
          <Square className="w-3 h-3 fill-current" />
        </button>
      )}

      {error && (
        <span className="text-red-400 text-[10px] truncate max-w-[150px]" title={error}>
          {error}
        </span>
      )}
    </div>
  );
};
