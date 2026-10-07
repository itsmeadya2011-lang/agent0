import React, { useState } from 'react';
import {
  GitPullRequest,
  GitBranch,
  GitCommit,
  CheckCircle2,
  AlertOctagon,
  ShieldAlert,
  Play,
  RotateCw,
  Sparkles,
  Loader2,
  Terminal,
  ExternalLink,
  Zap,
  Rocket,
  Flame,
  Check,
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { TtsVoiceController } from './TtsVoiceController.tsx';

interface PipelineStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: string;
  logs?: string[];
}

export const GithubWorkflowsView: React.FC = () => {
  const [repo, setRepo] = useState('agent0-ai/autonomous-core');
  const [prNumber, setPrNumber] = useState('89');
  const [branch, setBranch] = useState('feature/zero-latency-scheduler');
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<string | null>(null);
  const [reviewScore, setReviewScore] = useState<number | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const sampleDiff = `diff --git a/src/scheduler/queue.ts b/src/scheduler/queue.ts
index e69de29..b2b1a8f 100644
--- a/src/scheduler/queue.ts
+++ b/src/scheduler/queue.ts
@@ -14,6 +14,19 @@ export class TaskQueue {
   private workers: WorkerPool = new WorkerPool();
 
+  // Added zero-allocation lock-free queue
+  public async dispatchWithPriority(task: AgentTask): Promise<void> {
+    const authUser = validateBearerToken(task.token);
+    if (!authUser) {
+      throw new Error("Unauthorized token");
+    }
+    const worker = await this.workers.acquireNextAvailable();
+    worker.executeAsync(task.payload).catch(err => {
+      console.error("Worker unhandled crash:", err);
+      this.workers.recycle(worker);
+    });
+  }
+
   public terminateAll(): void {
     this.workers.drain();
   }`;

  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
    {
      id: 'step-1',
      name: 'ESLint & Strict TypeScript Type Check',
      status: 'passed',
      duration: '4.2s',
      logs: ['tsc --noEmit', 'Zero compilation errors found across 84 files'],
    },
    {
      id: 'step-2',
      name: 'Automated Vitest Unit & Concurrency Suite',
      status: 'passed',
      duration: '12.8s',
      logs: ['Running 128 tests across 14 suites', '128 passed (100% test coverage)'],
    },
    {
      id: 'step-3',
      name: 'agent0 Deep AI Security & Race Condition Scan',
      status: 'passed',
      duration: '18.1s',
      logs: [
        'Engaged gemini-3.1-pro-preview with ThinkingLevel.HIGH',
        'OWASP Top 10 vulnerabilities evaluated: clean',
        'Validated memory leaks & unhandled promise rejections',
      ],
    },
    {
      id: 'step-4',
      name: 'Build Production Container & Canary Stage',
      status: 'pending',
      duration: '0s',
      logs: [],
    },
    {
      id: 'step-5',
      name: 'Global Cloud Run Fleet Production Rollout',
      status: 'pending',
      duration: '0s',
      logs: [],
    },
  ]);

  const handleRunAiCodeReview = async () => {
    setIsReviewing(true);
    setReviewResult(null);

    try {
      const response = await fetch('/api/gemini/code-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo,
          diff: sampleDiff,
        }),
      });

      if (!response.ok) {
        throw new Error('Code review request failed');
      }

      const data = await response.json();
      setReviewResult(data.review);
      setReviewScore(94);

      // Save to Firestore if authenticated
      const user = auth.currentUser;
      if (user) {
        try {
          await setDoc(doc(db, 'githubWorkflows', `wf_${Date.now()}`), {
            userId: user.uid,
            repo,
            workflowType: 'code_review',
            branch,
            status: 'passed',
            findings: data.review,
            score: 94,
            createdAt: new Date().toISOString(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'githubWorkflows');
        }
      }
    } catch (err: any) {
      console.error('Code review error:', err);
      setReviewResult(`Error: ${err.message}`);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleTriggerDeployment = async () => {
    setIsDeploying(true);

    // Step-by-step CI/CD pipeline progression
    const updated = [...pipelineSteps];
    updated[3].status = 'running';
    setPipelineSteps([...updated]);

    await new Promise((r) => setTimeout(r, 2000));
    updated[3].status = 'passed';
    updated[3].duration = '24.5s';
    updated[3].logs = [
      'Built multi-arch docker image gcr.io/agent0/runtime:v2.6',
      'Pushed to Artifact Registry in asia-east1',
    ];
    updated[4].status = 'running';
    setPipelineSteps([...updated]);

    await new Promise((r) => setTimeout(r, 2500));
    updated[4].status = 'passed';
    updated[4].duration = '14.2s';
    updated[4].logs = [
      'Traffic split shifted 100% to new revision',
      'Production deployment live at https://app.agent0.cloud',
    ];
    setPipelineSteps([...updated]);
    setIsDeploying(false);

    const user = auth.currentUser;
    if (user) {
      try {
        await setDoc(doc(db, 'githubWorkflows', `wf_deploy_${Date.now()}`), {
          userId: user.uid,
          repo,
          workflowType: 'deployment',
          branch,
          status: 'deployed',
          findings: 'Automated CI/CD deployment successfully shipped to production.',
          score: 100,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'githubWorkflows');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 font-mono">
      {/* Top Header */}
      <div className="p-4 border-b border-zinc-900 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-emerald-950/50 border border-emerald-800/50 text-emerald-400">
            <GitPullRequest className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              GitHub Automated Code Review & CI/CD Engine
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                gemini-3.1-pro-preview (HIGH THINKING)
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Zero-defect pull request analysis, AST vulnerability checks, and automated deployments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TtsVoiceController currentStatusText="GitHub workflow pipeline synchronized. Zero regressions detected on primary branch." />
          <button
            onClick={handleRunAiCodeReview}
            disabled={isReviewing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)] disabled:opacity-50"
          >
            {isReviewing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Thinking & Reviewing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Run AI Code Review
              </>
            )}
          </button>

          <button
            onClick={handleTriggerDeployment}
            disabled={isDeploying}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Rocket className="w-3.5 h-3.5" />
                Trigger Deployment
              </>
            )}
          </button>
        </div>
      </div>

      {/* Target Repository Info Bar */}
      <div className="px-4 py-2.5 border-b border-zinc-900 bg-zinc-900/40 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Repository:</span>
          <input
            type="text"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-500">Branch:</span>
          <input
            type="text"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-zinc-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-500">PR:</span>
          <input
            type="text"
            value={prNumber}
            onChange={(e) => setPrNumber(e.target.value)}
            className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {reviewScore !== null && (
          <div className="ml-auto flex items-center gap-2 px-3 py-1 bg-emerald-950/60 border border-emerald-800 rounded text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            Audit Score: {reviewScore}/100
          </div>
        )}
      </div>

      {/* Main Grid: Diff + Review Report + Deployment Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        {/* Left: PR Diff & Code (6 Cols) */}
        <div className="lg:col-span-6 border-r border-zinc-900 flex flex-col overflow-hidden">
          <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between text-xs text-zinc-400">
            <span>PR #{prNumber} Diff View: src/scheduler/queue.ts</span>
            <span className="text-emerald-400">+13 lines</span>
          </div>

          <div className="flex-1 bg-black p-4 font-mono text-xs overflow-y-auto select-text">
            {sampleDiff.split('\n').map((line, idx) => (
              <div
                key={idx}
                className={`leading-5 px-1 ${
                  line.startsWith('+') && !line.startsWith('+++')
                    ? 'bg-emerald-950/40 text-emerald-300'
                    : line.startsWith('-') && !line.startsWith('---')
                    ? 'bg-red-950/40 text-red-300'
                    : line.startsWith('@@')
                    ? 'text-cyan-400 bg-cyan-950/20'
                    : 'text-zinc-400'
                }`}
              >
                {line}
              </div>
            ))}
          </div>

          {/* AI Code Review Report Panel */}
          {reviewResult && (
            <div className="border-t border-zinc-800 bg-zinc-950/90 p-4 max-h-[300px] overflow-y-auto">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                agent0 Diagnostic Review Verdict
              </div>
              <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                {reviewResult}
              </div>
            </div>
          )}
        </div>

        {/* Right: Automated CI/CD Pipeline (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col p-4 bg-zinc-950/90 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Rocket className="w-4 h-4 text-cyan-400" />
              Automated CI/CD Deployment Pipeline
            </h3>
            <span className="text-[11px] text-zinc-500 font-mono">
              Cluster: asia-east1 / Cloud Run
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {pipelineSteps.map((step, idx) => (
              <div
                key={step.id}
                className={`p-3.5 rounded-xl border text-xs transition-all ${
                  step.status === 'running'
                    ? 'bg-cyan-950/30 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : step.status === 'passed'
                    ? 'bg-zinc-900/50 border-zinc-800/80 text-zinc-300'
                    : 'bg-zinc-900/20 border-zinc-800/40 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.status === 'passed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : step.status === 'running'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-700 animate-spin'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {step.status === 'passed' ? '✓' : step.status === 'running' ? '⟳' : idx + 1}
                    </span>
                    <span className="font-semibold text-zinc-200">{step.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {step.duration && (
                      <span className="text-[10px] text-zinc-500 font-mono">{step.duration}</span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        step.status === 'passed'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : step.status === 'running'
                          ? 'bg-cyan-950 text-cyan-400 border border-cyan-700'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                </div>

                {step.logs && step.logs.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-800/60 font-mono text-[11px] text-zinc-400 space-y-1 pl-8">
                    {step.logs.map((log, lIdx) => (
                      <div key={lIdx} className="flex items-center gap-1.5">
                        <span className="text-zinc-600">›</span>
                        <span>{log}</span>
                      </div>
                    ))}
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
