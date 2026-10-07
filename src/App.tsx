import React, { useState, useEffect } from 'react';
import {
  Activity,
  Monitor,
  FileCode,
  GitPullRequest,
  Folder,
  Sparkles,
  LogOut,
  User as UserIcon,
  Cpu,
  Layers,
  Terminal,
  Volume2,
} from 'lucide-react';
import { Agent0Logo } from './components/Agent0Logo.tsx';
import { BackgroundProcessesView } from './components/BackgroundProcessesView.tsx';
import { ComputerUseView } from './components/ComputerUseView.tsx';
import { FileEditorView } from './components/FileEditorView.tsx';
import { GithubWorkflowsView } from './components/GithubWorkflowsView.tsx';
import { WorkspaceIntegrationsView } from './components/WorkspaceIntegrationsView.tsx';
import { TtsVoiceController } from './components/TtsVoiceController.tsx';
import {
  initAuth,
  googleSignIn,
  logout,
  testFirestoreConnection,
  getAccessToken,
} from './lib/firebase.ts';
import type { User } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'processes' | 'computer_use' | 'files' | 'github' | 'workspace'
  >('processes');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Test Firestore connection on boot per Firebase guidelines
    testFirestoreConnection();

    // Initialize Auth state listener
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        if (accessToken) setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-zinc-100 font-mono overflow-hidden select-none">
      {/* Top Navigation & Status Bar */}
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 px-4 flex items-center justify-between gap-4 backdrop-blur-md z-30 flex-shrink-0">
        {/* Brand Logo matching the uploaded dot matrix logo */}
        <div className="flex items-center gap-4">
          <Agent0Logo size="sm" />
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-zinc-300">SYSTEM DAEMON:</span>
            <span>ACTIVE</span>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-xs">
          {[
            { id: 'processes', label: 'Background Processes', icon: Activity },
            { id: 'computer_use', label: 'Computer & Browser Use', icon: Monitor },
            { id: 'files', label: 'Local File Editor', icon: FileCode },
            { id: 'github', label: 'GitHub CI/CD & Review', icon: GitPullRequest },
            { id: 'workspace', label: 'Google Workspace', icon: Folder },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-zinc-800 text-white font-bold shadow-[0_0_12px_rgba(255,255,255,0.08)] border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive ? 'text-cyan-400' : 'text-zinc-500'
                  }`}
                />
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Model Spec, TTS Voice, & Google Auth */}
        <div className="flex items-center gap-3">
          {/* TTS Audio Player */}
          <div className="hidden lg:block">
            <TtsVoiceController currentStatusText="agent0 autonomous daemon operating at nominal efficiency. Background scheduler running." />
          </div>

          {/* User Sign In / Profile */}
          {user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-zinc-800">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-cyan-500/50"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-300 text-xs">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="hidden sm:block text-left text-[11px] leading-tight">
                  <div className="font-semibold text-zinc-200 truncate max-w-[120px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[9px] text-emerald-400">Authenticated</div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            /* Official Google Sign-in Material Button per Workspace Guidelines */
            <button
              onClick={handleSignIn}
              disabled={isLoggingIn}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 font-sans font-semibold text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Interactive Work Area */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'processes' && <BackgroundProcessesView />}
        {activeTab === 'computer_use' && <ComputerUseView />}
        {activeTab === 'files' && <FileEditorView />}
        {activeTab === 'github' && <GithubWorkflowsView />}
        {activeTab === 'workspace' && <WorkspaceIntegrationsView />}
      </main>

      {/* Persistent Terminal Status Bar at Bottom */}
      <footer className="h-7 border-t border-zinc-900 bg-zinc-950 px-3 flex items-center justify-between text-[11px] text-zinc-500 font-mono z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="text-zinc-200 font-bold">agent0</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">asia-east1 cluster</span>
          </div>
          <span className="hidden sm:inline text-zinc-600">|</span>
          <div className="hidden sm:flex items-center gap-2 text-zinc-400">
            <span>MODELS:</span>
            <span className="text-purple-400 font-medium">gemini-3.1-pro-preview</span>
            <span className="text-zinc-600">/</span>
            <span className="text-cyan-400 font-medium">gemini-3.5-flash</span>
            <span className="text-zinc-600">/</span>
            <span className="text-emerald-400 font-medium">gemini-3.8-flash-tts</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-purple-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> HIGH THINKING ACTIVE
          </span>
          <span className="text-zinc-600">|</span>
          <span>LATENCY: 18ms</span>
        </div>
      </footer>
    </div>
  );
}
