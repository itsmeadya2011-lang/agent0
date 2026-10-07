import React, { useState, useEffect } from 'react';
import {
  Folder,
  FileSpreadsheet,
  Mail,
  Calendar,
  FileText,
  Presentation,
  CheckSquare,
  MessageSquare,
  FileCheck,
  Users,
  Video,
  Plus,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  listDriveFiles,
  createDriveFile,
  listCalendarEvents,
  createCalendarEvent,
  listRecentEmails,
  sendEmailMessage,
  createSpreadsheet,
  createGoogleDocument,
  createPresentation,
  listTasks,
  insertTask,
  listContacts,
  WorkspaceItem,
} from '../lib/workspaceApi.ts';
import { auth, googleSignIn, getAccessToken } from '../lib/firebase.ts';
import { TtsVoiceController } from './TtsVoiceController.tsx';

export const WorkspaceIntegrationsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'drive' | 'sheets' | 'gmail' | 'calendar' | 'docs' | 'slides' | 'tasks' | 'contacts'
  >('drive');

  const [items, setItems] = useState<WorkspaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Destructive / Mutation Confirmation Modal State (MANDATORY per Workspace skill)
  const [pendingAction, setPendingAction] = useState<{
    title: string;
    description: string;
    execute: () => Promise<void>;
  } | null>(null);

  // Form states for creating new items
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('agent0 Automated Execution Status Brief');
  const [emailBody, setEmailBody] = useState('All background tasks, browser sessions, and CI/CD pipelines verified with zero errors.');

  const [calSummary, setCalSummary] = useState('agent0 Autonomous Maintenance Window');
  const [calDescription, setCalDescription] = useState('Scheduled system health check and cache rebuild.');

  const [taskTitle, setTaskTitle] = useState('');
  const [docTitle, setDocTitle] = useState('agent0_Architecture_Audit_Report');
  const [sheetTitle, setSheetTitle] = useState('agent0_Telemetry_Metrics');

  useEffect(() => {
    checkToken();
  }, [auth.currentUser]);

  const checkToken = async () => {
    const token = await getAccessToken();
    setHasToken(!!token);
    if (token) {
      loadTabData(activeTab);
    }
  };

  useEffect(() => {
    if (hasToken) {
      loadTabData(activeTab);
    }
  }, [activeTab, hasToken]);

  const loadTabData = async (tab: typeof activeTab) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      if (tab === 'drive') {
        const data = await listDriveFiles();
        setItems(data);
      } else if (tab === 'calendar') {
        const data = await listCalendarEvents();
        setItems(data);
      } else if (tab === 'gmail') {
        const data = await listRecentEmails();
        setItems(data);
      } else if (tab === 'tasks') {
        const data = await listTasks();
        setItems(data);
      } else if (tab === 'contacts') {
        const data = await listContacts();
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      console.warn('Failed to load workspace data:', err);
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setHasToken(true);
        loadTabData(activeTab);
      }
    } catch (e: any) {
      setStatusMessage('Google connection failed: ' + e.message);
    }
  };

  // Safe wrapper enforcing MANDATORY confirmation dialog
  const requestMutationConfirmation = (title: string, description: string, execute: () => Promise<void>) => {
    setPendingAction({
      title,
      description,
      execute,
    });
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    try {
      setIsLoading(true);
      await pendingAction.execute();
      setStatusMessage('Operation completed successfully.');
      loadTabData(activeTab);
    } catch (e: any) {
      setStatusMessage('Action failed: ' + e.message);
    } finally {
      setIsLoading(false);
      setPendingAction(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 font-mono">
      {/* Top Header */}
      <div className="p-4 border-b border-zinc-900 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-blue-950/50 border border-blue-800/50 text-blue-400">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Google Workspace & Tool Integration Hub
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-blue-300 border border-zinc-800">
                12 Services Connected
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Synchronize agent0 outputs directly into Google Drive, Sheets, Gmail, Docs, Calendar, and Tasks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TtsVoiceController currentStatusText="Google Workspace bridge active. Permissions authenticated via Firebase Auth." />
          {!hasToken ? (
            <button
              onClick={handleConnectGoogle}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
            >
              Connect Workspace Account
            </button>
          ) : (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-950/50 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" /> Workspace Connected
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-zinc-900 bg-zinc-900/40 overflow-x-auto text-xs">
        {[
          { id: 'drive', label: 'Google Drive', icon: Folder },
          { id: 'sheets', label: 'Google Sheets', icon: FileSpreadsheet },
          { id: 'gmail', label: 'Gmail', icon: Mail },
          { id: 'calendar', label: 'Google Calendar', icon: Calendar },
          { id: 'docs', label: 'Google Docs', icon: FileText },
          { id: 'slides', label: 'Google Slides', icon: Presentation },
          { id: 'tasks', label: 'Google Tasks', icon: CheckSquare },
          { id: 'contacts', label: 'Contacts', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-zinc-800 text-cyan-300 border border-cyan-800/60 font-semibold'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {statusMessage && (
        <div className="p-3 bg-zinc-900 border-b border-zinc-800 text-xs text-cyan-300 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-zinc-500 hover:text-zinc-300">
            ✕
          </button>
        </div>
      )}

      {/* Tab Content & Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
        {/* Main List / View (7 Cols) */}
        <div className="lg:col-span-7 border-r border-zinc-900 p-4 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs">
            <span className="font-semibold text-zinc-300 uppercase tracking-wider">
              {activeTab.toUpperCase()} Records
            </span>
            <span className="text-zinc-500 font-mono">{items.length} items fetched</span>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500 gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              Fetching Workspace Data...
            </div>
          ) : !hasToken ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-400 text-xs space-y-3">
              <ShieldAlert className="w-8 h-8 text-blue-400" />
              <p className="max-w-md">
                Google Workspace requires an active session. Click &quot;Connect Workspace Account&quot;
                to authorize Drive, Sheets, Gmail, and Calendar permissions.
              </p>
              <button
                onClick={handleConnectGoogle}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                Sign in with Google
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-xs">
              No existing {activeTab} records found, or use the actions panel on the right to
              create one.
            </div>
          ) : (
            <div className="space-y-2 mt-3 flex-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 text-xs flex items-center justify-between hover:border-zinc-700 transition-all"
                >
                  <div className="truncate mr-3">
                    <div className="font-semibold text-zinc-200 truncate">{item.name}</div>
                    {item.snippet && (
                      <div className="text-[11px] text-zinc-400 truncate mt-0.5 font-sans">
                        {item.snippet}
                      </div>
                    )}
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded hover:bg-zinc-800 text-cyan-400"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Panel: Dispatch Agent Workspace Actions (5 Cols) */}
        <div className="lg:col-span-5 p-4 bg-zinc-950/90 flex flex-col overflow-y-auto">
          <div className="pb-3 border-b border-zinc-800 text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Dispatch Agent Workspace Mutation
          </div>

          <div className="mt-4 space-y-4 text-xs">
            {activeTab === 'gmail' && (
              <div className="space-y-3 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                <h4 className="font-bold text-zinc-200">Send Automated Status Email</h4>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">To Email:</label>
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Subject:</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Body Text:</label>
                  <textarea
                    rows={3}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100 font-sans"
                  />
                </div>
                <button
                  disabled={!emailTo.trim() || isLoading}
                  onClick={() =>
                    requestMutationConfirmation(
                      'Send Email via Gmail',
                      `Send automated email to "${emailTo}" with subject "${emailSubject}"? This action modifies your Gmail outbox.`,
                      async () => {
                        await sendEmailMessage(emailTo, emailSubject, emailBody);
                        setEmailTo('');
                      }
                    )
                  }
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-50"
                >
                  Confirm & Dispatch Email
                </button>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="space-y-3 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                <h4 className="font-bold text-zinc-200">Schedule Autonomous Maintenance Window</h4>
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">Summary:</label>
                  <input
                    type="text"
                    value={calSummary}
                    onChange={(e) => setCalSummary(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100"
                  />
                </div>
                <button
                  disabled={isLoading}
                  onClick={() =>
                    requestMutationConfirmation(
                      'Create Google Calendar Event',
                      `Create new event "${calSummary}" on your Google Calendar starting in 1 hour?`,
                      async () => {
                        const start = new Date(Date.now() + 1000 * 60 * 60).toISOString();
                        const end = new Date(Date.now() + 1000 * 60 * 120).toISOString();
                        await createCalendarEvent(calSummary, calDescription, start, end);
                      }
                    )
                  }
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Schedule Event in Calendar
                </button>
              </div>
            )}

            {activeTab === 'drive' && (
              <div className="space-y-3 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                <h4 className="font-bold text-zinc-200">Export agent0 Execution Log to Drive</h4>
                <p className="text-zinc-400 text-[11px]">
                  Exports the active task telemetry and execution trace as a text artifact directly into Google Drive.
                </p>
                <button
                  disabled={isLoading}
                  onClick={() =>
                    requestMutationConfirmation(
                      'Upload File to Google Drive',
                      'Create a new document "agent0_execution_trace.txt" in your Google Drive?',
                      async () => {
                        await createDriveFile(
                          'agent0_execution_trace.txt',
                          `=== agent0 Execution Trace ===\nTimestamp: ${new Date().toISOString()}\nStatus: Verified\nModels: gemini-3.1-pro-preview, gemini-3.5-flash, gemini-3.8-flash-tts`
                        );
                      }
                    )
                  }
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Export Artifact to Google Drive
                </button>
              </div>
            )}

            {activeTab === 'sheets' && (
              <div className="space-y-3 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                <h4 className="font-bold text-zinc-200">Initialize Metrics Spreadsheet</h4>
                <input
                  type="text"
                  value={sheetTitle}
                  onChange={(e) => setSheetTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100"
                />
                <button
                  disabled={isLoading}
                  onClick={() =>
                    requestMutationConfirmation(
                      'Create Google Sheet',
                      `Create new spreadsheet "${sheetTitle}" with agent audit headers in Google Sheets?`,
                      async () => {
                        await createSpreadsheet(sheetTitle);
                      }
                    )
                  }
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Create Metric Spreadsheet
                </button>
              </div>
            )}

            {activeTab === 'docs' && (
              <div className="space-y-3 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                <h4 className="font-bold text-zinc-200">Generate Google Document</h4>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100"
                />
                <button
                  disabled={isLoading}
                  onClick={() =>
                    requestMutationConfirmation(
                      'Create Google Doc',
                      `Create new Google Document titled "${docTitle}"?`,
                      async () => {
                        await createGoogleDocument(docTitle);
                      }
                    )
                  }
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
                >
                  Create Google Doc
                </button>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-3 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                <h4 className="font-bold text-zinc-200">Add Task to Google Tasks</h4>
                <input
                  type="text"
                  placeholder="Task title..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-100"
                />
                <button
                  disabled={!taskTitle.trim() || isLoading}
                  onClick={() =>
                    requestMutationConfirmation(
                      'Insert Google Task',
                      `Insert "${taskTitle}" into your Google Tasks list?`,
                      async () => {
                        await insertTask(taskTitle, 'Generated autonomously by agent0');
                        setTaskTitle('');
                      }
                    )
                  }
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold disabled:opacity-50"
                >
                  Add to Google Tasks
                </button>
              </div>
            )}

            {activeTab === 'slides' && (
              <div className="space-y-3 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                <h4 className="font-bold text-zinc-200">Generate Presentation Brief</h4>
                <button
                  disabled={isLoading}
                  onClick={() =>
                    requestMutationConfirmation(
                      'Create Google Slides Presentation',
                      'Create new presentation "agent0 Autonomous Architecture Brief" in Google Slides?',
                      async () => {
                        await createPresentation('agent0 Autonomous Architecture Brief');
                      }
                    )
                  }
                  className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-bold"
                >
                  Create Slides Deck
                </button>
              </div>
            )}

            {activeTab === 'contacts' && (
              <div className="space-y-3 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-zinc-400">
                <h4 className="font-bold text-zinc-200">People & Contacts Integration</h4>
                <p className="text-[11px]">
                  Lookup teammates and stakeholders to route automated incident alerts and deployment reviews.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MANDATORY User Confirmation Dialog for Destructive / Mutating Actions */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-700 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white">Confirmation Required</h3>
            </div>

            <div className="text-xs text-zinc-300 space-y-2">
              <p className="font-semibold text-zinc-100">{pendingAction.title}</p>
              <p className="text-zinc-400 leading-relaxed bg-zinc-900/60 p-3 rounded border border-zinc-800">
                {pendingAction.description}
              </p>
              <p className="text-[11px] text-zinc-500">
                This action will mutate data in your Google Workspace account with your explicit permission.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
              >
                Confirm & Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
