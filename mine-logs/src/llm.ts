import type { CandidateWindow } from './heuristics';

export type Lesson = {
  title: string;
  type: string;
  context: string;
  lesson: string;
  confidence: number;
  sourceSessionIds: string[];
};

const SYSTEM = `You analyze excerpts from Claude Code transcripts and decide whether they contain a reusable lesson worth saving to a knowledge base. A reusable lesson is one a future engineer (or future Claude) would benefit from knowing BEFORE making the same mistake again.

Output STRICT JSON only. Schema:
  { "isLesson": false }
  OR
  { "isLesson": true, "title": string (under 80 chars), "type": "bug-fix-recipe" | "tool-correction" | "approach-redirect" | "env-gotcha" | "domain-rule" | "anti-pattern" | "verification-failure", "context": string (what happened, 1-3 sentences), "lesson": string (the takeaway as a directive, 1-3 sentences), "confidence": number 0-1 }

Be strict. If the excerpt is a one-off, unclear, or trivially obvious, return isLesson:false.`;

export async function extractLesson(
  client: any,
  window: CandidateWindow
): Promise<Lesson | null> {
  const transcript = renderWindow(window);

  // Attempt with retry-once on JSON parse failure
  for (let attempt = 0; attempt < 2; attempt++) {
    let response: any;
    try {
      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM,
        messages: [{ role: 'user', content: `Window kind: ${window.kind}\n\nTranscript:\n${transcript}` }],
      });
    } catch {
      return null;
    }

    const text = (response.content as any[])
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text)
      .join('\n')
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(extractJson(text));
    } catch {
      if (attempt === 0) continue; // retry once
      return null;
    }

    if (!parsed.isLesson) return null;
    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0.5) return null;

    return {
      title: parsed.title,
      type: parsed.type,
      context: parsed.context,
      lesson: parsed.lesson,
      confidence: parsed.confidence,
      sourceSessionIds: [],
    };
  }
  return null;
}

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]+?)```/);
  if (fence) return fence[1].trim();
  return text;
}

function renderWindow(w: CandidateWindow): string {
  return w.entries
    .map((e, i) => `[${i}] ${e.role ?? 'unknown'} (${e.kind}): ${JSON.stringify(e.text ?? e.toolName ?? '').slice(0, 500)}`)
    .join('\n');
}
