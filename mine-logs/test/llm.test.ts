import { describe, test, expect } from 'bun:test';
import { extractLesson } from '../src/llm';

const mockClientLesson = {
  messages: {
    create: async () => ({
      content: [{
        type: 'text',
        text: JSON.stringify({
          isLesson: true,
          title: 'Use bun test not npm test',
          type: 'tool-correction',
          context: 'Claude ran npm test; user corrected to bun test.',
          lesson: 'In kstack, always use `bun test` instead of `npm test`.',
          confidence: 0.9,
        }),
      }],
    }),
  },
} as any;

const mockClientNoLesson = {
  messages: {
    create: async () => ({
      content: [{ type: 'text', text: JSON.stringify({ isLesson: false }) }],
    }),
  },
} as any;

const mockClientInvalidJson = {
  messages: {
    create: async () => ({
      content: [{ type: 'text', text: 'not json at all' }],
    }),
  },
} as any;

const sampleWindow = {
  kind: 'correction' as const,
  startIdx: 0,
  endIdx: 1,
  entries: [
    { role: 'user', kind: 'text', text: 'stop using npm test', timestamp: undefined, sessionId: undefined, uuid: undefined },
  ],
};

describe('llm extraction', () => {
  test('returns a Lesson when LLM says isLesson:true', async () => {
    const result = await extractLesson(mockClientLesson, sampleWindow);
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Use bun test not npm test');
    expect(result!.confidence).toBe(0.9);
    expect(result!.type).toBe('tool-correction');
  });

  test('returns null when LLM says isLesson:false', async () => {
    const result = await extractLesson(mockClientNoLesson, sampleWindow);
    expect(result).toBeNull();
  });

  test('returns null on invalid JSON (retry-once-then-drop)', async () => {
    const result = await extractLesson(mockClientInvalidJson, sampleWindow);
    expect(result).toBeNull();
  });

  test('returns null when confidence < 0.5', async () => {
    const mockLowConf = {
      messages: {
        create: async () => ({
          content: [{ type: 'text', text: JSON.stringify({
            isLesson: true, title: 'Weak signal', type: 'tool-correction',
            context: 'ctx', lesson: 'lesson', confidence: 0.3,
          }) }],
        }),
      },
    } as any;
    const result = await extractLesson(mockLowConf, sampleWindow);
    expect(result).toBeNull();
  });
});
