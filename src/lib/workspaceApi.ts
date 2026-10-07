import { getAccessToken } from './firebase.ts';

export interface WorkspaceItem {
  id: string;
  name: string;
  type: 'drive' | 'sheets' | 'gmail' | 'calendar' | 'docs' | 'slides' | 'tasks' | 'chat' | 'forms' | 'contacts' | 'meet';
  snippet?: string;
  url?: string;
  updatedAt?: string;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No Google Workspace access token available. Please sign in with Google to grant access.');
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// 1. Google Drive
export async function listDriveFiles(): Promise<WorkspaceItem[]> {
  try {
    const data = await fetchWithAuth('https://www.googleapis.com/drive/v3/files?pageSize=15&fields=files(id,name,mimeType,webViewLink,modifiedTime)');
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      type: 'drive',
      snippet: f.mimeType,
      url: f.webViewLink,
      updatedAt: f.modifiedTime,
    }));
  } catch (err: any) {
    console.warn('Drive fetch error:', err.message);
    return [];
  }
}

export async function createDriveFile(name: string, content: string): Promise<any> {
  const metadata = { name, mimeType: 'text/plain' };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: 'text/plain' }));

  return fetchWithAuth('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    body: form,
  });
}

// 2. Google Calendar
export async function listCalendarEvents(): Promise<WorkspaceItem[]> {
  try {
    const data = await fetchWithAuth('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true&timeMin=' + new Date().toISOString());
    return (data.items || []).map((e: any) => ({
      id: e.id,
      name: e.summary || '(Untitled Event)',
      type: 'calendar',
      snippet: `${e.start?.dateTime || e.start?.date} - ${e.description || 'No description'}`,
      url: e.htmlLink,
      updatedAt: e.updated,
    }));
  } catch (err: any) {
    console.warn('Calendar fetch error:', err.message);
    return [];
  }
}

export async function createCalendarEvent(summary: string, description: string, startIso: string, endIso: string) {
  const payload = {
    summary,
    description,
    start: { dateTime: startIso },
    end: { dateTime: endIso },
  };
  return fetchWithAuth('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// 3. Gmail
export async function listRecentEmails(): Promise<WorkspaceItem[]> {
  try {
    const list = await fetchWithAuth('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8');
    const messages = list.messages || [];
    const items: WorkspaceItem[] = [];

    for (const m of messages.slice(0, 5)) {
      try {
        const detail = await fetchWithAuth(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`);
        const headers = detail.payload?.headers || [];
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
        const from = headers.find((h: any) => h.name === 'From')?.value || '';
        items.push({
          id: m.id,
          name: subject,
          type: 'gmail',
          snippet: `From: ${from}`,
          updatedAt: new Date(Number(detail.internalDate)).toISOString(),
        });
      } catch (e) {
        // Continue loop
      }
    }
    return items;
  } catch (err: any) {
    console.warn('Gmail fetch error:', err.message);
    return [];
  }
}

export async function sendEmailMessage(to: string, subject: string, bodyText: string) {
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    bodyText,
  ];
  const rawEmail = btoa(unescape(encodeURIComponent(emailLines.join('\r\n'))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return fetchWithAuth('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: rawEmail }),
  });
}

// 4. Google Sheets
export async function createSpreadsheet(title: string, headers: string[] = ['Timestamp', 'Task', 'Status', 'Result']) {
  const payload = {
    properties: { title },
    sheets: [
      {
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: headers.map((h) => ({ userEnteredValue: { stringValue: h } })),
              },
            ],
          },
        ],
      },
    ],
  };

  return fetchWithAuth('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// 5. Google Docs
export async function createGoogleDocument(title: string) {
  return fetchWithAuth('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
}

// 6. Google Slides
export async function createPresentation(title: string) {
  return fetchWithAuth('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
}

// 7. Google Tasks
export async function listTasks(): Promise<WorkspaceItem[]> {
  try {
    const data = await fetchWithAuth('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?maxResults=15');
    return (data.items || []).map((t: any) => ({
      id: t.id,
      name: t.title || '(Untitled Task)',
      type: 'tasks',
      snippet: t.notes || (t.status === 'completed' ? 'Done' : 'Pending'),
      updatedAt: t.updated,
    }));
  } catch (err: any) {
    console.warn('Tasks fetch error:', err.message);
    return [];
  }
}

export async function insertTask(title: string, notes?: string) {
  return fetchWithAuth('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, notes }),
  });
}

// 8. Contacts / People API
export async function listContacts(): Promise<WorkspaceItem[]> {
  try {
    const data = await fetchWithAuth('https://people.googleapis.com/v1/people/me/connections?pageSize=15&personFields=names,emailAddresses');
    return (data.connections || []).map((c: any) => ({
      id: c.resourceName,
      name: c.names?.[0]?.displayName || 'Unnamed Contact',
      type: 'contacts',
      snippet: c.emailAddresses?.[0]?.value || 'No email',
    }));
  } catch (err: any) {
    console.warn('Contacts fetch error:', err.message);
    return [];
  }
}
