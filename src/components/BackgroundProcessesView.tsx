import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  Pause,
  Square,
  Plus,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  query,
  where,
  setDoc,
  doc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase.ts';

export interface BackgroundProcess {
  id: string;
  userId?: string;
  pid: number;
  title: string;
  type: 'computer_use' | 'browser_use' | 'file_editing' | 'github_review' | 'workspace_sync' | 'general';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  cpu: number;
  memoryMb: number;
  modelUsed: string;
  thinkingEnabled: boolean;
  output: string;
  logs: string[];
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_PROCESSES: BackgroundProcess[] = [
  {
    id: 'proc_01',
    pid: 8492,
    title: 'Autonomous Browser Crawl & DOM State Parser',
    type: 'browser_use',
    status: 'running',
    progress: 68,
    cpu: 18.4,
    memoryMb: 312,
    modelUsed: 'gemini-3.5-flash',
    thinkingEnabled: false,
    output: 'Extracted 42 dynamic UI states from target staging environment.',
    logs: [
      '[02:40:12] Initialized headless Chromium sandbox instance #1',
      '[02:40:15] Intercepted network requests on /v1/telemetry',
      '[02:41:02] Calculated bounding boxes for interactive DOM tree',
      '[02:41:30] Executed cursor movement to selector button#deploy-staging',
      '[02:42:01] Awaiting websocket handshake confirmation...',
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proc_02',
    pid: 9104,
    title: 'GitHub PR Deep Security Audit (PR #142)',
    type: 'github_review',
    status: 'running',
    progress: 92,
    cpu: 42.1,
    memoryMb: 680,
    modelUsed: 'gemini-3.1-pro-preview',
    thinkingEnabled: true,
    output: 'Analyzing AST changes in auth token validation logic for memory leak vectors.',
    logs: [
      '[02:35:10] Fetched diff from origin/feature/zero-copy-buffers',
      '[02:35:45] Engaged High Thinking Level (gemini-3.1-pro-preview)',
      '[02:36:12] AST tokenization complete. Scanning 18 modified files.',
      '[02:38:00] Detected potential unhandled rejection in stream pipeline',
      '[02:40:11] Synthesizing automated GitHub review comments...',
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proc_03',
    pid: 7719,
    title: 'Local Workspace AST Indexer & Live Watcher',
    type: 'file_editing',
    status: 'running',
    progress: 100,
    cpu: 4.2,
    memoryMb: 148,
    modelUsed: 'gemini-3.1-flash-lite',
    thinkingEnabled: false,
    output: 'Watching 14 source files for delta updates.',
    logs: [
      '[02:20:00] Watching ./src and ./config directories',
      '[02:25:12] Rebuilt module resolution graph',
      '[02:30:45] Incremental type-check passed in 84ms',
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'proc_04',
    pid: 6280,
    title: 'Google Workspace Cross-Sync Pipeline',
    type: 'workspace_sync',
    status: 'completed',
    progress: 100,
    cpu: 0.0,
    memoryMb: 86,
    modelUsed: 'gemini-3.5-flash',
    thinkingEnabled: false,
    output: 'Successfully synchronized 6 Drive docs and 2 Sheets audit logs.',
    logs: [
      '[02:10:04] Connected to Google Drive v3 endpoint',
      '[02:10:12] Synced agent execution report into root folder',
      '[02:11:00] Recorded metric entries in agent0_audit_sheet',
      '[02:11:05] Batch sync complete.',
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const BackgroundProcessesView: React.FC = () => {
  const [processes, setProcesses] = useState<BackgroundProcess[]>(DEFAULT_PROCESSES);
  const [selectedProcessId, setSelectedProcessId] = useState<string>(DEFAULT_PROCESSES[0].id);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<BackgroundProcess['type']>('computer_use');
  const [newComplexity, setNewComplexity] = useState<'complex' | 'general' | 'fast'>('complex');
  const [isSpawning, setIsSpawning] = useState(false);

  // Real-time Firestore sync when authenticated
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: BackgroundProcess[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              list.push({
                id: docSnap.id,
                userId: data.userId,
                pid: data.pid || Math.floor(1000 + Math.random() * 9000),
                title: data.title,
                type: data.type || 'general',
                status: data.status || 'running',
                progress: data.progress || 0,
                cpu: data.cpu || 12.5,
                memoryMb: data.memoryMb || 256,
                modelUsed: data.modelUsed || 'gemini-3.5-flash',
                thinkingEnabled: !!data.thinkingEnabled,
                output: data.output || '',
                logs: data.logs || ['[agent0] Process initialized'],
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
              });
            });
            setProcesses(list);
            if (list.length > 0 && !list.find((p) => p.id === selectedProcessId)) {
              setSelectedProcessId(list[0].id);
            }
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'tasks');
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore subscription fallback:', e);
    }
  }, [selectedProcessId]);

  // Periodic simulated telemetry tick for active processes
  useEffect(() => {
    const interval = setInterval(() => {
      setProcesses((prev) =>
        prev.map((p) => {
          if (p.status === 'running') {
            const newProgress = Math.min(100, p.progress + (Math.random() > 0.6 ? 2 : 0));
            const newCpu = Math.max(2.1, Math.min(88.4, +(p.cpu + (Math.random() * 6 - 3)).toFixed(1)));
            return {
              ...p,
              progress: newProgress,
              cpu: newCpu,
              status: newProgress >= 100 ? 'completed' : 'running',
            };
          }
          return p;
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const activeProcess = processes.find((p) => p.id === selectedProcessId) || processes[0];

  const handleTogglePause = async (processId: string) => {
    const target = processes.find((p) => p.id === processId);
    if (!target) return;
    const newStatus = target.status === 'running' ? 'paused' : 'running';

    setProcesses((prev) =>
      prev.map((p) => (p.id === processId ? { ...p, status: newStatus } : p))
    );

    const user = auth.currentUser;
    if (user && target.userId) {
      try {
        await updateDoc(doc(db, 'tasks', processId), {
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Failed to update Firestore task:', err);
      }
    }
  };

  const handleTerminate = async (processId: string) => {
    setProcesses((prev) =>
      prev.map((p) => (p.id === processId ? { ...p, status: 'failed', cpu: 0 } : p))
    );

    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, 'tasks', processId), {
          status: 'failed',
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Firestore update error:', err);
      }
    }
  };

  const handleSpawnProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSpawning(true);
    const newPid = Math.floor(2000 + Math.random() * 7999);
    const modelUsed =
      newComplexity === 'complex'
        ? 'gemini-3.1-pro-preview'
        : newComplexity === 'fast'
        ? 'gemini-3.1-flash-lite'
        : 'gemini-3.5-flash';

    const newProc: BackgroundProcess = {
      id: `proc_${Date.now()}`,
      pid: newPid,
      title: newTitle.trim(),
      type: newType,
      status: 'running',
      progress: 5,
      cpu: +(15 + Math.random() * 25).toFixed(1),
      memoryMb: Math.floor(180 + Math.random() * 320),
      modelUsed,
      thinkingEnabled: newComplexity === 'complex',
      output: `Autonomous process #${newPid} executing via ${modelUsed}`,
      logs: [
        `[${new Date().toLocaleTimeString()}] Spawning daemon PID #${newPid}`,
        `[${new Date().toLocaleTimeString()}] Initialized runtime container with model ${modelUsed}`,
        `[${new Date().toLocaleTimeString()}] High thinking mode: ${newComplexity === 'complex' ? 'ENABLED (ThinkingLevel.HIGH)' : 'OFF'}`,
        `[${new Date().toLocaleTimeString()}] Executing goal: "${newTitle.trim()}"`,
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProcesses((prev) => [newProc, ...prev]);
    setSelectedProcessId(newProc.id);

    const user = auth.currentUser;
    if (user) {
      try {
        await setDoc(doc(db, 'tasks', newProc.id), {
          userId: user.uid,
          pid: newProc.pid,
          title: newProc.title,
          type: newProc.type,
          status: newProc.status,
          progress: newProc.progress,
          cpu: newProc.cpu,
          memoryMb: newProc.memoryMb,
          modelUsed: newProc.modelUsed,
          thinkingEnabled: newProc.thinkingEnabled,
          output: newProc.output,
          logs: newProc.logs,
          createdAt: newProc.createdAt,
          updatedAt: newProc.updatedAt,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'tasks');
      }
    }

    setNewTitle('');
    setIsSpawning(false);
    setIsModalOpen(false);
  };

  const filteredProcesses = processes.filter((p) => {
    const matchesFilter = filterType === 'all' || p.type === filterType;
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.pid).includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const totalCpu = +(
    processes.filter((p) => p.status === 'running').reduce((acc, p) => acc + p.cpu, 0)
  ).toFixed(1);
  const totalMem = processes
    .filter((p) => p.status === 'running')
    .reduce((acc, p) => acc + p.memoryMb, 0);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 font-mono">
      {/* Top Telemetry Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-zinc-900 bg-zinc-950/70">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
          <div className="p-2 rounded bg-cyan-950/40 text-cyan-400 border border-cyan-800/40">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 uppercase tracking-wider">Active Daemons</div>
            <div className="text-xl font-bold text-white flex items-baseline gap-2">
              {processes.filter((p) => p.status === 'running').length}
              <span className="text-xs text-zinc-500 font-normal">/ {processes.length} total</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
          <div className="p-2 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 uppercase tracking-wider">Aggregate CPU</div>
            <div className="text-xl font-bold text-white flex items-baseline gap-1">
              {totalCpu}%
              <span className="text-xs text-zinc-500 font-normal">utilized</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
          <div className="p-2 rounded bg-purple-950/40 text-purple-400 border border-purple-800/40">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 uppercase tracking-wider">Allocated Memory</div>
            <div className="text-xl font-bold text-white flex items-baseline gap-1">
              {totalMem}
              <span className="text-xs text-zinc-500 font-normal">MB</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
          <div className="p-2 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-zinc-400 uppercase tracking-wider">AI Reasoning Grid</div>
            <div className="text-xl font-bold text-white flex items-baseline gap-1">
              100%
              <span className="text-xs text-emerald-400 font-normal">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filter, Search, Spawn */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-zinc-900 bg-zinc-900/20">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by PID, title, or task type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
            {['all', 'browser_use', 'computer_use', 'github_review', 'file_editing', 'workspace_sync'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded text-[11px] capitalize transition-all ${
                  filterType === type
                    ? 'bg-zinc-800 text-white font-medium shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            Spawn Process
          </button>
        </div>
      </div>

      {/* Main Grid: Process Table + Live Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        {/* Process List (7 Cols) */}
        <div className="lg:col-span-7 border-r border-zinc-900 flex flex-col overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 text-[11px] uppercase tracking-wider border-b border-zinc-900 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">PID</th>
                  <th className="py-2.5 px-3">Process / Objective</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3">Load</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredProcesses.map((proc) => {
                  const isSelected = proc.id === selectedProcessId;
                  return (
                    <tr
                      key={proc.id}
                      onClick={() => setSelectedProcessId(proc.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-zinc-900/70 border-l-2 border-l-cyan-400'
                          : 'hover:bg-zinc-900/30'
                      }`}
                    >
                      <td className="py-3 px-3 font-mono text-zinc-400 font-semibold">
                        #{proc.pid}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-zinc-200 truncate max-w-[220px]">
                          {proc.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-24 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-cyan-500 h-1.5 transition-all duration-300"
                              style={{ width: `${proc.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-zinc-500">{proc.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            proc.status === 'running'
                              ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40'
                              : proc.status === 'completed'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                              : proc.status === 'paused'
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                              : 'bg-red-950/60 text-red-400 border border-red-800/40'
                          }`}
                        >
                          {proc.status === 'running' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                          )}
                          {proc.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] text-zinc-300 flex items-center gap-1">
                          {proc.thinkingEnabled && (
                            <span className="px-1 py-0.2 bg-purple-950 text-purple-300 border border-purple-700/50 rounded text-[9px] font-mono">
                              THINK
                            </span>
                          )}
                          {proc.modelUsed.replace('gemini-', '')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-[11px] text-zinc-300">{proc.cpu}% CPU</div>
                        <div className="text-[10px] text-zinc-500">{proc.memoryMb} MB</div>
                      </td>
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {proc.status !== 'completed' && proc.status !== 'failed' && (
                            <button
                              onClick={() => handleTogglePause(proc.id)}
                              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                              title={proc.status === 'running' ? 'Pause' : 'Resume'}
                            >
                              {proc.status === 'running' ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-cyan-400" />
                              )}
                            </button>
                          )}
                          {proc.status === 'running' && (
                            <button
                              onClick={() => handleTerminate(proc.id)}
                              className="p-1 rounded hover:bg-red-950/60 text-zinc-400 hover:text-red-400"
                              title="Terminate Process"
                            >
                              <Square className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Process Detail Inspector & Log Stream (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col bg-zinc-950/90 h-full overflow-hidden">
          {activeProcess ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-zinc-900 bg-zinc-900/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      PID #{activeProcess.pid}
                    </span>
                    <span className="text-[11px] text-zinc-400 capitalize">
                      [{activeProcess.type.replace('_', ' ')}]
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {activeProcess.status === 'running' && (
                      <span className="flex items-center gap-1 text-[11px] text-cyan-400 bg-cyan-950/50 border border-cyan-800/60 px-2 py-0.5 rounded">
                        <Activity className="w-3 h-3 animate-spin" /> LIVE
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white mt-2">{activeProcess.title}</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed bg-zinc-900/50 p-2 rounded border border-zinc-800/60">
                  {activeProcess.output || 'No output telemetry received yet.'}
                </p>
              </div>

              {/* Hardware / Engine Spec */}
              <div className="grid grid-cols-3 gap-2 p-3 border-b border-zinc-900 text-center text-xs">
                <div className="p-2 bg-zinc-900/30 rounded border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 uppercase block">Model Engine</span>
                  <span className="font-medium text-cyan-300 truncate block mt-0.5">
                    {activeProcess.modelUsed}
                  </span>
                </div>
                <div className="p-2 bg-zinc-900/30 rounded border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 uppercase block">Thinking Mode</span>
                  <span className="font-medium text-purple-300 block mt-0.5">
                    {activeProcess.thinkingEnabled ? 'High (Depth)' : 'Standard'}
                  </span>
                </div>
                <div className="p-2 bg-zinc-900/30 rounded border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 uppercase block">Memory Heap</span>
                  <span className="font-medium text-zinc-200 block mt-0.5">
                    {activeProcess.memoryMb} MB
                  </span>
                </div>
              </div>

              {/* Real-time Stdout / Execution Log Stream */}
              <div className="flex-1 flex flex-col overflow-hidden p-3">
                <div className="flex items-center justify-between pb-2 text-xs text-zinc-400 border-b border-zinc-900">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    Process Execution Stream
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Buffer size: {activeProcess.logs.length} lines
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto mt-2 p-2.5 rounded bg-black/70 border border-zinc-800/80 font-mono text-[11px] space-y-1.5 select-text">
                  {activeProcess.logs.map((log, idx) => (
                    <div key={idx} className="flex gap-2 text-zinc-300 leading-tight">
                      <span className="text-zinc-600 select-none">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={
                          log.includes('COMPLETE') || log.includes('passed')
                            ? 'text-emerald-400'
                            : log.includes('Thinking') || log.includes('THINK')
                            ? 'text-purple-400 font-medium'
                            : log.includes('Intercepted') || log.includes('DOM')
                            ? 'text-cyan-300'
                            : log.includes('unhandled') || log.includes('rejection')
                            ? 'text-amber-300'
                            : 'text-zinc-300'
                        }
                      >
                        {log}
                      </span>
                    </div>
                  ))}
                  {activeProcess.status === 'running' && (
                    <div className="flex items-center gap-2 text-cyan-400/80 pt-1">
                      <span className="inline-block w-1.5 h-3 bg-cyan-400 animate-pulse" />
                      <span className="text-[10px] text-zinc-500">agent0 process active...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-500 text-xs">
              Select a process to inspect its telemetry
            </div>
          )}
        </div>
      </div>

      {/* Spawn New Process Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Spawn Autonomous Agent Task
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSpawnProcess} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">
                  Task Objective / Goal:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspect Github repo, edit local tests, crawl staging DOM..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">
                    Process Category:
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-cyan-500 capitalize"
                  >
                    <option value="computer_use">Computer Use</option>
                    <option value="browser_use">Browser Use</option>
                    <option value="file_editing">File Editing</option>
                    <option value="github_review">GitHub Review</option>
                    <option value="workspace_sync">Workspace Sync</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1 font-semibold">
                    Gemini Intelligence Model:
                  </label>
                  <select
                    value={newComplexity}
                    onChange={(e) => setNewComplexity(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="complex">gemini-3.1-pro-preview (High Thinking)</option>
                    <option value="general">gemini-3.5-flash (Balanced)</option>
                    <option value="fast">gemini-3.1-flash-lite (Fastest)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400">
                <span className="text-cyan-400 font-semibold block mb-1">Architecture Note:</span>
                Tasks launched run as background daemon processes synchronized in real time with
                Google Cloud Firestore persistence.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSpawning}
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1.5"
                >
                  {isSpawning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  Launch Process
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
