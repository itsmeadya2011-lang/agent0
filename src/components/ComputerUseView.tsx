import React, { useState } from 'react';
import {
  Globe,
  Monitor,
  MousePointer,
  Play,
  RotateCw,
  Search,
  ExternalLink,
  Cpu,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Loader2,
  Volume2,
} from 'lucide-react';
import { TtsVoiceController } from './TtsVoiceController.tsx';

interface BrowserAction {
  step: number;
  action: 'navigate' | 'click' | 'type' | 'scroll' | 'inspect' | 'evaluate';
  target: string;
  value?: string;
  reason: string;
  status: 'pending' | 'active' | 'completed';
}

export const ComputerUseView: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState('https://app.agent0.cloud/dashboard');
  const [objective, setObjective] = useState(
    'Navigate to staging deployment, inspect performance metrics, verify zero error rate, and submit audit confirmation'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 340, y: 190 });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);

  const [actions, setActions] = useState<BrowserAction[]>([
    {
      step: 1,
      action: 'navigate',
      target: 'browser_window',
      value: 'https://staging.internal/releases/v2.6',
      reason: 'Open canary environment dashboard',
      status: 'completed',
    },
    {
      step: 2,
      action: 'click',
      target: '#btn-telemetry-metrics',
      reason: 'Expand live Prometheus / telemetry stream panel',
      status: 'completed',
    },
    {
      step: 3,
      action: 'inspect',
      target: '.latency-p99-indicator',
      reason: 'Assert P99 response time < 45ms across cluster',
      status: 'active',
    },
    {
      step: 4,
      action: 'type',
      target: 'input#release-notes',
      value: 'Canary verified by agent0 autonomous browser daemon',
      reason: 'Enter automated validation signature in release notes',
      status: 'pending',
    },
    {
      step: 5,
      action: 'click',
      target: 'button#approve-release',
      reason: 'Dispatch zero-defect release approval token',
      status: 'pending',
    },
  ]);

  const handleRunAutonomousCycle = async () => {
    setIsRunning(true);
    try {
      // Invoke Gemini via server API to plan browser actions
      const response = await fetch('/api/gemini/browser-act', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objective,
          context: `Current URL: ${currentUrl}. Interactive DOM: buttons [#btn-telemetry-metrics, #approve-release], inputs [input#release-notes], status [.latency-p99-indicator].`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let parsed: any[] = [];
        try {
          parsed = JSON.parse(data.actionsJson);
        } catch {
          parsed = [];
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
          const newActions: BrowserAction[] = parsed.map((item, idx) => ({
            step: idx + 1,
            action: item.action || 'inspect',
            target: item.target || 'element',
            value: item.value,
            reason: item.reason || 'Autonomous agent action step',
            status: 'pending',
          }));
          setActions(newActions);
        }
      }

      // Step-by-step playback simulation
      for (let i = 0; i < actions.length; i++) {
        setCurrentStepIndex(i);
        setActions((prev) =>
          prev.map((a, idx) => (idx === i ? { ...a, status: 'active' } : a))
        );

        // Move cursor realistically
        if (i === 1) {
          setCursorPos({ x: 280, y: 160 });
          setActiveHighlight('#btn-telemetry-metrics');
        } else if (i === 2) {
          setCursorPos({ x: 490, y: 220 });
          setActiveHighlight('.latency-p99-indicator');
        } else if (i === 3) {
          setCursorPos({ x: 310, y: 280 });
          setActiveHighlight('input#release-notes');
        } else if (i === 4) {
          setCursorPos({ x: 530, y: 340 });
          setActiveHighlight('button#approve-release');
        }

        await new Promise((r) => setTimeout(r, 1200));

        setActions((prev) =>
          prev.map((a, idx) => (idx === i ? { ...a, status: 'completed' } : a))
        );
      }
    } catch (err) {
      console.error('Browser action error:', err);
    } finally {
      setIsRunning(false);
      setActiveHighlight(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 font-mono">
      {/* Top Controller Bar */}
      <div className="p-4 border-b border-zinc-900 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-cyan-950/50 border border-cyan-800/50 text-cyan-400">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Autonomous Computer & Browser Daemon
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                gemini-3.5-flash
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Low-latency OS DOM inspection, mouse navigation, and form execution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TtsVoiceController currentStatusText="Autonomous browser daemon ready. All DOM selectors and headless sandbox streams active." />
          <button
            onClick={handleRunAutonomousCycle}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executing Sequence...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Run Browser Sequence
              </>
            )}
          </button>
        </div>
      </div>

      {/* Objective Input */}
      <div className="p-3 border-b border-zinc-900 bg-zinc-900/30 flex items-center gap-3 text-xs">
        <span className="text-zinc-400 font-semibold uppercase text-[11px] whitespace-nowrap">
          Agent Directive:
        </span>
        <input
          type="text"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 focus:outline-none focus:border-cyan-500 text-xs"
        />
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        {/* Simulated Browser Viewport (8 Cols) */}
        <div className="lg:col-span-8 p-4 flex flex-col bg-zinc-950/60 overflow-y-auto">
          {/* Simulated Browser Chrome */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-2xl overflow-hidden flex flex-col flex-1">
            {/* Window Controls & URL bar */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-950 border-b border-zinc-800 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>

              <div className="flex items-center gap-2 flex-1 bg-zinc-900 rounded-lg px-3 py-1 border border-zinc-800 text-zinc-300">
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                <span className="truncate flex-1 font-mono text-[11px]">{currentUrl}</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-sans">
                  <ShieldCheck className="w-3 h-3" /> TLS 1.3
                </span>
              </div>

              <div className="text-[10px] text-zinc-500 font-mono">
                X:{cursorPos.x} Y:{cursorPos.y}
              </div>
            </div>

            {/* Viewport Canvas Screen */}
            <div className="relative flex-1 bg-zinc-950 p-6 select-none overflow-hidden min-h-[380px]">
              {/* Virtual Virtual Desktop Background */}
              <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] opacity-30" />

              {/* Dynamic Target Web App Canvas */}
              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 backdrop-blur">
                  <div>
                    <h4 className="text-sm font-bold text-white">Staging Cluster Release v2.6</h4>
                    <p className="text-xs text-zinc-400">Canary Traffic Split: 10% active</p>
                  </div>
                  <button
                    id="btn-telemetry-metrics"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      activeHighlight === '#btn-telemetry-metrics'
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] ring-2 ring-cyan-300'
                        : 'bg-zinc-800 text-zinc-200 border-zinc-700'
                    }`}
                  >
                    View Telemetry Stream
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div
                    className={`p-3 rounded-lg bg-zinc-900/60 border transition-all ${
                      activeHighlight === '.latency-p99-indicator'
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.5)] ring-2 ring-cyan-300'
                        : 'border-zinc-800'
                    }`}
                  >
                    <span className="text-[10px] text-zinc-400 uppercase">P99 Latency</span>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5">38.2 ms</div>
                    <span className="text-[10px] text-zinc-500">Target &lt; 45ms</span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 uppercase">Error Rate</span>
                    <div className="text-lg font-bold text-emerald-400 mt-0.5">0.000%</div>
                    <span className="text-[10px] text-zinc-500">Zero exceptions</span>
                  </div>

                  <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 uppercase">Healthy Nodes</span>
                    <div className="text-lg font-bold text-cyan-400 mt-0.5">16 / 16</div>
                    <span className="text-[10px] text-zinc-500">Auto-scaled</span>
                  </div>
                </div>

                {/* Form Inputs for Agent Interaction */}
                <div className="p-4 rounded-lg bg-zinc-900/70 border border-zinc-800 space-y-3">
                  <label className="block text-xs font-semibold text-zinc-300">
                    Audit Verification Signature:
                  </label>
                  <input
                    id="release-notes"
                    type="text"
                    readOnly
                    value="Canary verified by agent0 autonomous browser daemon"
                    className={`w-full bg-zinc-950 rounded px-3 py-2 text-xs text-zinc-200 border transition-all ${
                      activeHighlight === 'input#release-notes'
                        ? 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] ring-2 ring-cyan-300'
                        : 'border-zinc-800'
                    }`}
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      id="approve-release"
                      className={`px-4 py-2 rounded text-xs font-bold transition-all ${
                        activeHighlight === 'button#approve-release'
                          ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.8)] ring-2 ring-emerald-300'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      Approve Release Rollout
                    </button>
                  </div>
                </div>
              </div>

              {/* Animated Virtual Cursor */}
              <div
                className="absolute z-50 pointer-events-none transition-all duration-500 ease-out flex items-start gap-1"
                style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
              >
                <MousePointer className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.9)] fill-cyan-400/30" />
                <span className="text-[9px] bg-zinc-900 border border-zinc-700 text-cyan-300 px-1.5 py-0.5 rounded shadow">
                  agent0 cursor
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Sequence Plan & Inspector (4 Cols) */}
        <div className="lg:col-span-4 border-l border-zinc-900 p-4 flex flex-col bg-zinc-950/90 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Action Step Pipeline
              </h3>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              {actions.filter((a) => a.status === 'completed').length} / {actions.length} done
            </span>
          </div>

          <div className="space-y-2.5 mt-3 flex-1">
            {actions.map((act) => (
              <div
                key={act.step}
                className={`p-3 rounded-lg border text-xs transition-all ${
                  act.status === 'active'
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : act.status === 'completed'
                    ? 'bg-zinc-900/50 border-zinc-800 text-zinc-300'
                    : 'bg-zinc-900/20 border-zinc-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        act.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : act.status === 'active'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-700 animate-pulse'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {act.status === 'completed' ? '✓' : act.step}
                    </span>
                    <span className="font-mono text-cyan-300 uppercase text-[11px] font-semibold">
                      {act.action}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{act.target}</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed mt-1 pl-7">
                  {act.reason}
                </p>
                {act.value && (
                  <div className="mt-1.5 pl-7">
                    <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded text-amber-300 border border-zinc-800">
                      Value: &quot;{act.value}&quot;
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
