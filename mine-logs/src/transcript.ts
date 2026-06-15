import * as fs from 'fs/promises';

export type TranscriptEntry = {
  role: 'user' | 'assistant';
  kind: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  toolName?: string;
  toolUseId?: string;
  toolInput?: unknown;
  toolResultContent?: unknown;
  isError?: boolean;
  timestamp?: string;
  sessionId?: string;
  uuid?: string;
};

const SKIP_TYPES = new Set([
  'last-prompt',
  'mode',
  'permission-mode',
  'bridge-session',
  'ai-title',
  'file-history-snapshot',
  'system',
]);

export async function parseTranscript(filePath: string): Promise<TranscriptEntry[]> {
  const text = await fs.readFile(filePath, 'utf8');
  const out: TranscriptEntry[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    let raw: any;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (raw && typeof raw === 'object' && SKIP_TYPES.has(raw.type)) continue;
    out.push(...flatten(raw));
  }
  return out;
}

function flatten(raw: any): TranscriptEntry[] {
  if (!raw || typeof raw !== 'object') return [];

  const role =
    raw.message?.role ??
    raw.role ??
    (raw.type === 'user' ? 'user' : raw.type === 'assistant' ? 'assistant' : null);
  if (role !== 'user' && role !== 'assistant') return [];

  const common = {
    role: role as 'user' | 'assistant',
    timestamp: raw.timestamp,
    sessionId: raw.sessionId,
    uuid: raw.uuid,
  };

  const content = raw.message?.content;

  // user message with string content → single text entry
  if (typeof content === 'string') {
    return [{ ...common, kind: 'text', text: content }];
  }

  if (!Array.isArray(content)) return [];

  const entries: TranscriptEntry[] = [];
  for (const item of content) {
    if (!item || typeof item !== 'object') continue;
    switch (item.type) {
      case 'text':
        entries.push({ ...common, kind: 'text', text: item.text });
        break;
      case 'tool_use':
        entries.push({
          ...common,
          kind: 'tool_use',
          toolName: item.name,
          toolUseId: item.id,
          toolInput: item.input,
        });
        break;
      case 'tool_result':
        entries.push({
          ...common,
          kind: 'tool_result',
          toolUseId: item.tool_use_id,
          toolResultContent: item.content,
          isError: item.is_error === true,
        });
        break;
      // skip 'thinking' and other unknown content types
    }
  }
  return entries;
}
