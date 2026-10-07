import React, { useState, useEffect } from 'react';
import {
  FileCode,
  Folder,
  Save,
  Wand2,
  GitCommit,
  Check,
  RotateCcw,
  Sparkles,
  Loader2,
  FileText,
  Terminal,
  FileJson,
  Layers,
} from 'lucide-react';
import { doc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { TtsVoiceController } from './TtsVoiceController.tsx';

interface LocalFile {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  updatedAt: string;
}

const DEFAULT_FILES: LocalFile[] = [
  {
    id: 'f1',
    name: 'core.ts',
    path: 'src/agent/core.ts',
    language: 'typescript',
    content: `// agent0 Core Autonomous Execution Daemon
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

export class Agent0Runtime {
  private status: "idle" | "running" | "evaluating" = "idle";
  private memoryCache = new Map<string, any>();

  constructor(private readonly agentId: string) {}

  public async dispatchTask(objective: string): Promise<boolean> {
    this.status = "running";
    console.log(\`[agent0] Task dispatched: \${objective}\`);
    
    // Core reasoning cycle
    const result = await this.executeReasoningStep(objective);
    this.status = "evaluating";
    return result.success;
  }

  private async executeReasoningStep(goal: string) {
    // Zero-latency context synthesis
    return { success: true, timestamp: Date.now() };
  }
}`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'f2',
    name: 'runtime.json',
    path: 'config/runtime.json',
    language: 'json',
    content: `{
  "agentId": "agent0-node-primary",
  "concurrency": 8,
  "defaultModel": "gemini-3.1-pro-preview",
  "thinkingLevel": "HIGH",
  "maxWorkerMemoryMb": 1024,
  "browserDaemon": {
    "headless": true,
    "viewport": { "width": 1920, "height": 1080 },
    "networkTimeoutMs": 15000
  },
  "gitIntegration": {
    "autoReview": true,
    "enforceStrictTyping": true
  }
}`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'f3',
    name: 'deploy.sh',
    path: 'scripts/deploy.sh',
    language: 'bash',
    content: `#!/usr/bin/env bash
set -euo pipefail

echo "=== [agent0] Autonomous Deployment Pipeline ==="
echo "1. Checking local workspace artifacts..."
npm run build

echo "2. Running security and vulnerability scan..."
npm audit --audit-level=high

echo "3. Synchronizing Google Cloud Run artifacts..."
gcloud run deploy agent0-service \\
  --image gcr.io/agent0-core/production:latest \\
  --region asia-east1 \\
  --allow-unauthenticated

echo "=== Deployment Successfully Completed ==="`,
    updatedAt: new Date().toISOString(),
  },
];

export const FileEditorView: React.FC = () => {
  const [files, setFiles] = useState<LocalFile[]>(DEFAULT_FILES);
  const [selectedFileId, setSelectedFileId] = useState<string>(DEFAULT_FILES[0].id);
  const [activeCode, setActiveCode] = useState<string>(DEFAULT_FILES[0].content);
  const [promptInstruction, setPromptInstruction] = useState('');
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [lastDiffSummary, setLastDiffSummary] = useState<string | null>(null);
  const [proposedCode, setProposedCode] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(true);

  const currentFile = files.find((f) => f.id === selectedFileId) || files[0];

  useEffect(() => {
    setActiveCode(currentFile.content);
    setProposedCode(null);
    setLastDiffSummary(null);
  }, [selectedFileId]);

  // Sync with Firestore if authenticated
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const q = query(collection(db, 'files'), where('userId', '==', user.uid));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const loaded: LocalFile[] = [];
            snapshot.forEach((docSnap) => {
              const d = docSnap.data();
              loaded.push({
                id: docSnap.id,
                name: d.name,
                path: d.path,
                language: d.language || 'typescript',
                content: d.content,
                updatedAt: d.updatedAt,
              });
            });
            setFiles(loaded);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, 'files');
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore file listener:', e);
    }
  }, []);

  const handleSave = async () => {
    const updated = files.map((f) =>
      f.id === selectedFileId ? { ...f, content: activeCode, updatedAt: new Date().toISOString() } : f
    );
    setFiles(updated);
    setIsSaved(true);

    const user = auth.currentUser;
    if (user) {
      try {
        await setDoc(doc(db, 'files', currentFile.id), {
          userId: user.uid,
          name: currentFile.name,
          path: currentFile.path,
          language: currentFile.language,
          content: activeCode,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'files');
      }
    }
  };

  const handleRequestAiEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInstruction.trim() || isAiEditing) return;

    setIsAiEditing(true);
    setLastDiffSummary(null);

    try {
      const response = await fetch('/api/gemini/file-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: currentFile.name,
          currentContent: activeCode,
          instruction: promptInstruction.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate edit from agent');
      }

      const data = await response.json();
      setProposedCode(data.updatedContent);
      setLastDiffSummary(data.summary || 'Code updated with agent reasoning');
    } catch (err: any) {
      console.error('AI edit error:', err);
      setLastDiffSummary(`Error: ${err.message}`);
    } finally {
      setIsAiEditing(false);
    }
  };

  const handleApplyChanges = () => {
    if (proposedCode) {
      setActiveCode(proposedCode);
      setProposedCode(null);
      setIsSaved(false);
    }
  };

  const handleDiscardChanges = () => {
    setProposedCode(null);
    setLastDiffSummary(null);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 font-mono">
      {/* Top Bar */}
      <div className="p-3 border-b border-zinc-900 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-purple-950/50 border border-purple-800/50 text-purple-400">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Real-Time Local File Editor & Diff Engine
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-purple-300 border border-zinc-800">
                gemini-3.1-pro-preview
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Interactive workspace editing with AST analysis and autonomous code refactoring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TtsVoiceController currentStatusText={`Editing ${currentFile.path}. Workspace state is persistent and synchronized.`} />
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              !isSaved
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {isSaved ? 'Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        {/* File Navigator (3 Cols) */}
        <div className="lg:col-span-3 border-r border-zinc-900 p-3 bg-zinc-950/90 flex flex-col overflow-y-auto">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 pb-2 border-b border-zinc-900 uppercase tracking-wider">
            <Folder className="w-4 h-4 text-zinc-500" />
            Workspace Tree
          </div>

          <div className="space-y-1 mt-2">
            {files.map((file) => {
              const isSelected = file.id === selectedFileId;
              return (
                <button
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-zinc-900 text-cyan-300 border border-cyan-800/60 font-medium'
                      : 'text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {file.name.endsWith('.json') ? (
                      <FileJson className="w-3.5 h-3.5 text-amber-400" />
                    ) : file.name.endsWith('.sh') ? (
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span className="truncate">{file.name}</span>
                  </div>
                  <span className="text-[10px] text-zinc-600 font-mono">{file.language}</span>
                </button>
              );
            })}
          </div>

          {/* AI Code Transformation Directive Panel */}
          <div className="mt-auto pt-4 border-t border-zinc-900">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Agent Code Transformation
            </div>
            <form onSubmit={handleRequestAiEdit} className="space-y-2">
              <textarea
                rows={3}
                placeholder="Ask agent0 to edit: e.g. 'Add exponential backoff retry loop', 'Optimize memory', 'Add error handling'..."
                value={promptInstruction}
                onChange={(e) => setPromptInstruction(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-sans"
              />
              <button
                type="submit"
                disabled={isAiEditing || !promptInstruction.trim()}
                className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] disabled:opacity-50"
              >
                {isAiEditing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    agent0 Editing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    Dispatch AI Edit
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Code Editor & Diff Comparison (9 Cols) */}
        <div className="lg:col-span-9 flex flex-col bg-black overflow-hidden">
          {/* File Tab Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900 bg-zinc-950 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <span className="text-zinc-500">{currentFile.path}</span>
              {!isSaved && <span className="text-amber-400 text-xs">● unsaved</span>}
            </div>
            {lastDiffSummary && (
              <span className="text-[11px] text-purple-400 truncate max-w-sm">
                {lastDiffSummary}
              </span>
            )}
          </div>

          {/* Diff Banner if AI proposed changes */}
          {proposedCode && (
            <div className="p-3 bg-purple-950/60 border-b border-purple-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-purple-200">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>
                  agent0 generated code modifications. Review the proposed changes below.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleApplyChanges}
                  className="px-3 py-1 rounded bg-emerald-500 text-black font-bold flex items-center gap-1 hover:bg-emerald-400"
                >
                  <Check className="w-3.5 h-3.5" />
                  Accept & Apply
                </button>
                <button
                  onClick={handleDiscardChanges}
                  className="px-3 py-1 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Editor Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* If proposed code exists, show side-by-side or tabs */}
            {proposedCode ? (
              <div className="grid grid-cols-2 flex-1 divide-x divide-zinc-900 overflow-hidden">
                <div className="flex flex-col overflow-hidden">
                  <div className="px-3 py-1.5 bg-zinc-900/60 text-zinc-400 text-[11px] uppercase border-b border-zinc-800">
                    Original Code
                  </div>
                  <textarea
                    readOnly
                    value={activeCode}
                    className="flex-1 w-full bg-black p-4 text-xs font-mono text-zinc-400 resize-none focus:outline-none"
                  />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <div className="px-3 py-1.5 bg-purple-950/40 text-purple-300 text-[11px] uppercase border-b border-purple-900 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Proposed agent0 Changes
                  </div>
                  <textarea
                    readOnly
                    value={proposedCode}
                    className="flex-1 w-full bg-zinc-950/80 p-4 text-xs font-mono text-emerald-300 resize-none focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex overflow-hidden">
                {/* Line Numbers */}
                <div className="w-12 bg-zinc-950 py-4 select-none text-right pr-3 font-mono text-xs text-zinc-700 space-y-0.5 border-r border-zinc-900">
                  {activeCode.split('\n').map((_, i) => (
                    <div key={i} className="leading-5">
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Live Code Textarea */}
                <textarea
                  value={activeCode}
                  onChange={(e) => {
                    setActiveCode(e.target.value);
                    setIsSaved(false);
                  }}
                  spellCheck={false}
                  className="flex-1 w-full bg-black p-4 font-mono text-xs text-zinc-100 leading-5 resize-none focus:outline-none select-text"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
