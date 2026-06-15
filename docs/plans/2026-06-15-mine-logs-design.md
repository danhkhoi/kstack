# Design: `/kstack-mine-logs` — extract reusable lessons from Claude Code logs

**Date:** 2026-06-15
**Status:** Approved, ready for implementation plan
**Owner:** khoi.nguyen@zalora.com

## Problem

Across many Claude Code sessions, the same errors get debugged, the same corrections get given, and the same gotchas get rediscovered. Logs at `~/.claude/projects/<proj>/*.jsonl` already contain the receipts — error trails, user corrections, fix patterns — but nothing harvests them.

Goal: turn those transcripts into a reviewed knowledge base so future sessions don't repeat the same mistakes.

## Non-goals

- Cross-project lesson mining (current project only for v1)
- Auto-applying lessons without review (user approves every keeper)
- Team-sharing infrastructure beyond "commit the MD file if you want"
- Scheduled / hook-driven runs (manual invocation only)
- Live in-session learning (this is retrospective mining)

## Lesson categories targeted

1. **Bug fix recipes** — error → root cause → fix patterns
2. **Corrections & redirects** — tool/command fixes, approach changes, anti-patterns
3. **Env & domain knowledge** — hidden config, business rules, project-specific constraints
4. **Repeated mistakes & false completions** — cross-session patterns; "claimed done but wasn't"

## Architecture

New skill at `mine-logs/` with template `SKILL.md.tmpl`, following the kstack skill pattern. Two phases invoked as subcommands:

```
/kstack-mine-logs extract   →  scan logs, write LESSON_CANDIDATES.md
/kstack-mine-logs promote   →  read ticked candidates, save to chosen destination
```

Scoped to the current project: resolves `~/.claude/projects/<cwd-as-dashes>/*.jsonl` (the same key the auto-memory system uses).

## Extraction pipeline

**Stage A — heuristic pre-filter (free, no LLM):**

Parses each JSONL session and flags candidate windows around these signals:

- Tool errors followed by 3+ tool calls (bug fix territory)
- User messages starting with `no`, `don't`, `stop`, `instead`, `actually` (corrections)
- User explanations after Claude tool failures (env / domain teaching)
- User pushback within 1–2 turns of Claude saying `done` / `complete` (false completions)
- Same correction phrase appearing across multiple sessions (repeated mistakes)

**Stage B — LLM extraction pass (Sonnet 4.6, ~$0.10/run):**

For each flagged window, prompt: *"Is this a reusable lesson? If yes, output `{title, type, context, lesson, confidence}`."*

- Drop confidence < 0.5
- Dedup against already-promoted lessons (hash by normalized title — compare against memory slugs and any in-repo lesson files)

## Candidates file format

Written to `./LESSON_CANDIDATES.md` in the current repo. **Not gitignored** — the user wants control over whether to commit it.

```markdown
# Lesson candidates — extracted 2026-06-15

14 candidates from 23 sessions. Tick `[x]` to keep, then run promote.

---

## 1. Don't claim "tests pass" without running them
- [ ] keep
**Type:** verification-failure  **Confidence:** 0.92
**Sources:** session abc123 (2026-06-12), session def456 (2026-06-14)
**What happened:** Claude said "all tests pass" but hadn't run `bun test`. User caught it both times.
**Lesson:** Run the actual test command and paste the output before claiming completion.

## 2. Use `bun test` not `npm test` in kstack
- [ ] keep
**Type:** tool-correction  **Confidence:** 0.88
...
```

## Promote flow

```
$ /kstack-mine-logs promote

Found 5 ticked lessons.
Where should they go?
  1. Auto-memory (~/.claude/projects/<proj>/memory/)
  2. A markdown file in this repo (you'll pick the path)
  3. Cancel
> 1

✓ Wrote memory/lesson_dont_claim_tests_pass.md (feedback)
✓ Wrote memory/lesson_use_bun_test.md (feedback)
✓ Updated MEMORY.md index
...

5 lessons promoted. LESSON_CANDIDATES.md kept (unticked items remain for next time).
```

- One destination per promote run (asked at runtime)
- Memory route: writes one file per lesson with proper frontmatter (`name`, `description`, `type`), updates `MEMORY.md` index
- MD-file route: appends to user-chosen path under a `## Lessons learned (mined YYYY-MM-DD)` header
- Dedup: skip + log if destination already has an entry with same normalized title
- Unticked items remain in `LESSON_CANDIDATES.md` for a later pass

## Data flow

```
~/.claude/projects/<proj>/*.jsonl
            │
            ▼
    [Stage A: heuristic filter]
            │
            ▼
    flagged windows (JSON)
            │
            ▼
    [Stage B: Sonnet 4.6 extraction]
            │
            ▼
    candidate lessons (JSON, confidence-scored)
            │
            ▼
    [dedup vs memory/ + existing LESSON_CANDIDATES.md]
            │
            ▼
    LESSON_CANDIDATES.md  ←  user ticks keepers
            │
            ▼
    [promote: ask destination]
            │
            ├──→ memory/*.md + MEMORY.md
            └──→ <user-chosen>.md
```

## Error handling

- **No logs found for current project** — exit gracefully with the resolved path, suggest the user verify cwd
- **Malformed JSONL line** — log + skip the line, continue session
- **LLM extraction returns invalid JSON** — retry once, then drop the candidate
- **Promote run with no `LESSON_CANDIDATES.md`** — tell user to run `extract` first
- **Promote run with zero ticked items** — exit, no-op
- **Destination write conflict** (file exists with same slug) — skip + log, do not overwrite

## Testing

- Unit: heuristic pre-filter against fixture JSONL transcripts (planted error/correction/completion patterns)
- Unit: candidates-file parser (round-trip tick state)
- Unit: promote dedup logic against fixture memory dir
- Integration: end-to-end extract → tick → promote against a small fixture transcript set
- No LLM eval needed for v1 — the LLM stage is the cheap-to-verify part (manually inspect output)

## Cost estimate

- Extract: ~$0.10 per run on a typical project (~20–30 sessions, Sonnet 4.6)
- Promote: free (no LLM)

## Open questions deferred to implementation

- Exact heuristic thresholds (tune against real transcripts)
- Whether to chunk Stage B by session or by candidate window (latency vs cost tradeoff)
- Whether memory entries should link to source session IDs (probably yes, in the body)

## Approved decisions log

| Question | Answer |
|---|---|
| Lesson categories | All four (bug fix, corrections, env/domain, repeated/false-completion) |
| Review UX | MD file with `[ ]` checkboxes, two-phase extract→promote |
| Destination prompt timing | Once per promote run |
| Log scope | Current project only |
| Gitignore candidates file? | No |
| Extraction model | Sonnet 4.6 |
