# kstack

This is my personal fork of [garrytan/gstack](https://github.com/garrytan/gstack) — customized with my own skills and tuned for my specific workflows.

**kstack** keeps everything from the upstream gstack (all 25+ slash commands, the browse binary, the full sprint process) with telemetry removed and skills prefixed as `kstack-*`.

**kstack** turns Claude Code into a virtual engineering team you actually manage — a CEO who rethinks the product, an eng manager who locks the architecture, a designer who catches AI slop, a paranoid reviewer who finds production bugs, a QA lead who opens a real browser and clicks through your app, and a release engineer who ships the PR. Eighteen specialists and seven power tools, all as slash commands, all Markdown, **all free, MIT license, available right now.**

**Who this is for:**
- **Founders and CEOs** — especially technical ones who still want to ship. This is how you build like a team of twenty.
- **First-time Claude Code users** — kstack is the best way to start. Structured roles instead of a blank prompt.
- **Tech leads and staff engineers** — bring rigorous review, QA, and release automation to every PR

## Quick start: your first 10 minutes

1. Install kstack (30 seconds — see below)
2. Run `/kstack-office-hours` — describe what you're building. It will reframe the problem before you write a line of code.
3. Run `/kstack-plan-ceo-review` on any feature idea
4. Run `/kstack-review` on any branch with changes
5. Run `/kstack-qa` on your staging URL
6. Stop there. You'll know if this is for you.

Expect first useful run in under 5 minutes on any repo with tests already set up.

**If you only read one more section, read this one.**

## Install — takes 30 seconds

**Requirements:** [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Git](https://git-scm.com/), [Bun](https://bun.sh/) v1.0+, [Node.js](https://nodejs.org/) (Windows only)

### Step 1: Install on your machine

Open Claude Code and paste this. Claude does the rest.

> Install kstack: run **`git clone https://github.com/danhkhoi/kstack.git ~/.claude/skills/kstack && cd ~/.claude/skills/kstack && ./setup`** then add a "kstack" section to CLAUDE.md that says to use the /kstack-browse skill for all web browsing, never use mcp\_\_claude-in-chrome\_\_\* tools, and lists the available skills: /kstack-office-hours, /kstack-plan-ceo-review, /kstack-plan-eng-review, /kstack-plan-design-review, /kstack-design-consultation, /kstack-review, /kstack-ship, /kstack-land-and-deploy, /kstack-canary, /kstack-benchmark, /kstack-browse, /kstack-qa, /kstack-qa-only, /kstack-design-review, /kstack-setup-browser-cookies, /kstack-setup-deploy, /kstack-retro, /kstack-investigate, /kstack-document-release, /kstack-codex, /kstack-careful, /kstack-freeze, /kstack-guard, /kstack-unfreeze, /kstack-upgrade. Then ask the user if they also want to add kstack to the current project so teammates get it.

### Step 2: Add to your repo so teammates get it (optional)

> Add kstack to this project: run **`cp -Rf ~/.claude/skills/kstack .claude/skills/kstack && rm -rf .claude/skills/kstack/.git && cd .claude/skills/kstack && ./setup`** then add a "kstack" section to this project's CLAUDE.md that says to use the /kstack-browse skill for all web browsing, never use mcp\_\_claude-in-chrome\_\_\* tools, lists the available skills: /kstack-office-hours, /kstack-plan-ceo-review, /kstack-plan-eng-review, /kstack-plan-design-review, /kstack-design-consultation, /kstack-review, /kstack-ship, /kstack-land-and-deploy, /kstack-canary, /kstack-benchmark, /kstack-browse, /kstack-qa, /kstack-qa-only, /kstack-design-review, /kstack-setup-browser-cookies, /kstack-setup-deploy, /kstack-retro, /kstack-investigate, /kstack-document-release, /kstack-codex, /kstack-careful, /kstack-freeze, /kstack-guard, /kstack-unfreeze, /kstack-upgrade, and tells Claude that if kstack skills aren't working, run `cd .claude/skills/kstack && ./setup` to build the binary and register skills.

Real files get committed to your repo (not a submodule), so `git clone` just works. Everything lives inside `.claude/`. Nothing touches your PATH or runs in the background.

### Codex, Gemini CLI, or Cursor

kstack works on any agent that supports the [SKILL.md standard](https://github.com/anthropics/claude-code). Skills live in `.agents/skills/` and are discovered automatically.

```bash
git clone https://github.com/danhkhoi/kstack.git ~/.codex/skills/kstack
cd ~/.codex/skills/kstack && ./setup --host codex
```

Or let setup auto-detect which agents you have installed:

```bash
git clone https://github.com/danhkhoi/kstack.git ~/kstack
cd ~/kstack && ./setup --host auto
```

This installs to `~/.claude/skills/kstack` and/or `~/.codex/skills/kstack` depending on what's available. All 25 skills work across all supported agents. Hook-based safety skills (careful, freeze, guard) use inline safety advisory prose on non-Claude hosts.

## See it work

```
You:    I want to build a daily briefing app for my calendar.
You:    /kstack-office-hours
Claude: [asks about the pain — specific examples, not hypotheticals]

You:    Multiple Google calendars, events with stale info, wrong locations.
        Prep takes forever and the results aren't good enough...

Claude: I'm going to push back on the framing. You said "daily briefing
        app." But what you actually described is a personal chief of
        staff AI.
        [extracts 5 capabilities you didn't realize you were describing]
        [challenges 4 premises — you agree, disagree, or adjust]
        [generates 3 implementation approaches with effort estimates]
        RECOMMENDATION: Ship the narrowest wedge tomorrow, learn from
        real usage. The full vision is a 3-month project — start with
        the daily briefing that actually works.
        [writes design doc → feeds into downstream skills automatically]

You:    /kstack-plan-ceo-review
        [reads the design doc, challenges scope, runs 10-section review]

You:    /kstack-plan-eng-review
        [ASCII diagrams for data flow, state machines, error paths]
        [test matrix, failure modes, security concerns]

You:    Approve plan. Exit plan mode.
        [writes 2,400 lines across 11 files. ~8 minutes.]

You:    /kstack-review
        [AUTO-FIXED] 2 issues. [ASK] Race condition → you approve fix.

You:    /kstack-qa https://staging.myapp.com
        [opens real browser, clicks through flows, finds and fixes a bug]

You:    /kstack-ship
        Tests: 42 → 51 (+9 new). PR: github.com/you/app/pull/42
```

You said "daily briefing app." The agent said "you're building a chief of staff AI" — because it listened to your pain, not your feature request. Then it challenged your premises, generated three approaches, recommended the narrowest wedge, and wrote a design doc that fed into every downstream skill. Eight commands. That is not a copilot. That is a team.

## The sprint

kstack is a process, not a collection of tools. The skills are ordered the way a sprint runs:

**Think → Plan → Build → Review → Test → Ship → Reflect**

Each skill feeds into the next. `/kstack-office-hours` writes a design doc that `/kstack-plan-ceo-review` reads. `/kstack-plan-eng-review` writes a test plan that `/kstack-qa` picks up. `/kstack-review` catches bugs that `/kstack-ship` verifies are fixed. Nothing falls through the cracks because every step knows what came before it.

One sprint, one person, one feature — that takes about 30 minutes with kstack. But here's what changes everything: you can run 10-15 of these sprints in parallel. Different features, different branches, different agents — all at the same time. That is how I ship 10,000+ lines of production code per day while doing my actual job.

| Skill | Your specialist | What they do |
|-------|----------------|--------------|
| `/kstack-office-hours` | **YC Office Hours** | Start here. Six forcing questions that reframe your product before you write code. Pushes back on your framing, challenges premises, generates implementation alternatives. Design doc feeds into every downstream skill. |
| `/kstack-plan-ceo-review` | **CEO / Founder** | Rethink the problem. Find the 10-star product hiding inside the request. Four modes: Expansion, Selective Expansion, Hold Scope, Reduction. |
| `/kstack-plan-eng-review` | **Eng Manager** | Lock in architecture, data flow, diagrams, edge cases, and tests. Forces hidden assumptions into the open. |
| `/kstack-plan-design-review` | **Senior Designer** | Rates each design dimension 0-10, explains what a 10 looks like, then edits the plan to get there. AI Slop detection. Interactive — one AskUserQuestion per design choice. |
| `/kstack-design-consultation` | **Design Partner** | Build a complete design system from scratch. Knows the landscape, proposes creative risks, generates realistic product mockups. Design at the heart of all other phases. |
| `/kstack-review` | **Staff Engineer** | Find the bugs that pass CI but blow up in production. Auto-fixes the obvious ones. Flags completeness gaps. |
| `/kstack-investigate` | **Debugger** | Systematic root-cause debugging. Iron Law: no fixes without investigation. Traces data flow, tests hypotheses, stops after 3 failed fixes. |
| `/kstack-design-review` | **Designer Who Codes** | Same audit as /kstack-plan-design-review, then fixes what it finds. Atomic commits, before/after screenshots. |
| `/kstack-qa` | **QA Lead** | Test your app, find bugs, fix them with atomic commits, re-verify. Auto-generates regression tests for every fix. |
| `/kstack-qa-only` | **QA Reporter** | Same methodology as /kstack-qa but report only. Use when you want a pure bug report without code changes. |
| `/kstack-ship` | **Release Engineer** | Sync main, run tests, audit coverage, push, open PR. Bootstraps test frameworks if you don't have one. One command. |
| `/kstack-land-and-deploy` | **Release Engineer** | Merge the PR, wait for CI and deploy, verify production health. Takes over after `/kstack-ship`. One command from "approved" to "verified in production." |
| `/kstack-canary` | **SRE** | Post-deploy monitoring loop. Watches for console errors, performance regressions, and page failures. Periodic screenshots and anomaly detection. |
| `/kstack-benchmark` | **Performance Engineer** | Baseline page load times, Core Web Vitals, and resource sizes. Compare before/after on every PR. Catch bundle size regressions before they ship. |
| `/kstack-document-release` | **Technical Writer** | Update all project docs to match what you just shipped. Catches stale READMEs automatically. |
| `/kstack-retro` | **Eng Manager** | Team-aware weekly retro. Per-person breakdowns, shipping streaks, test health trends, growth opportunities. |
| `/kstack-browse` | **QA Engineer** | Give the agent eyes. Real Chromium browser, real clicks, real screenshots. ~100ms per command. |
| `/kstack-setup-browser-cookies` | **Session Manager** | Import cookies from your real browser (Chrome, Arc, Brave, Edge) into the headless session. Test authenticated pages. |

### Power tools

| Skill | What it does |
|-------|-------------|
| `/kstack-codex` | **Second Opinion** — independent code review from OpenAI Codex CLI. Three modes: review (pass/fail gate), adversarial challenge, and open consultation. Cross-model analysis when both `/kstack-review` and `/kstack-codex` have run. |
| `/kstack-careful` | **Safety Guardrails** — warns before destructive commands (rm -rf, DROP TABLE, force-push). Say "be careful" to activate. Override any warning. |
| `/kstack-freeze` | **Edit Lock** — restrict file edits to one directory. Prevents accidental changes outside scope while debugging. |
| `/kstack-guard` | **Full Safety** — `/kstack-careful` + `/kstack-freeze` in one command. Maximum safety for prod work. |
| `/kstack-unfreeze` | **Unlock** — remove the `/kstack-freeze` boundary. |
| `/kstack-setup-deploy` | **Deploy Configurator** — one-time setup for `/kstack-land-and-deploy`. Detects your platform, production URL, and deploy commands. |
| `/kstack-upgrade` | **Self-Updater** — upgrade kstack to latest. Detects global vs vendored install, syncs both, shows what changed. |

**[Deep dives with examples and philosophy for every skill →](docs/skills.md)**

## What's new and why it matters

**`/kstack-office-hours` reframes your product before you write code.** You say "daily briefing app." It listens to your actual pain, pushes back on the framing, tells you you're really building a personal chief of staff AI, challenges your premises, and generates three implementation approaches with effort estimates. The design doc it writes feeds directly into `/kstack-plan-ceo-review` and `/kstack-plan-eng-review` — so every downstream skill starts with real clarity instead of a vague feature request.

**Design is at the heart.** `/kstack-design-consultation` doesn't just pick fonts. It researches what's out there in your space, proposes safe choices AND creative risks, generates realistic mockups of your actual product, and writes `DESIGN.md` — and then `/kstack-design-review` and `/kstack-plan-eng-review` read what you chose. Design decisions flow through the whole system.

**`/kstack-qa` was a massive unlock.** It let me go from 6 to 12 parallel workers. Claude Code saying *"I SEE THE ISSUE"* and then actually fixing it, generating a regression test, and verifying the fix — that changed how I work. The agent has eyes now.

**Smart review routing.** Just like at a well-run startup: CEO doesn't have to look at infra bug fixes, design review isn't needed for backend changes. kstack tracks what reviews are run, figures out what's appropriate, and just does the smart thing. The Review Readiness Dashboard tells you where you stand before you ship.

**Test everything.** `/kstack-ship` bootstraps test frameworks from scratch if your project doesn't have one. Every `/kstack-ship` run produces a coverage audit. Every `/kstack-qa` bug fix generates a regression test. 100% test coverage is the goal — tests make vibe coding safe instead of yolo coding.

**Ship to production in one command.** `/kstack-land-and-deploy` picks up where `/kstack-ship` left off — merges your PR, waits for CI and deploy, then runs canary verification on your production URL. Auto-detects Fly.io, Render, Vercel, Netlify, Heroku, or GitHub Actions. If something breaks, it offers a revert. Pair with `/kstack-canary` for extended post-deploy monitoring and `/kstack-benchmark` to catch performance regressions before they ship.

**`/kstack-document-release` is the engineer you never had.** It reads every doc file in your project, cross-references the diff, and updates everything that drifted. README, ARCHITECTURE, CONTRIBUTING, CLAUDE.md, TODOS — all kept current automatically. And now `/kstack-ship` auto-invokes it — docs stay current without an extra command.

**Browser handoff when the AI gets stuck.** Hit a CAPTCHA, auth wall, or MFA prompt? `$B handoff` opens a visible Chrome at the exact same page with all your cookies and tabs intact. Solve the problem, tell Claude you're done, `$B resume` picks up right where it left off. The agent even suggests it automatically after 3 consecutive failures.

**Multi-AI second opinion.** `/kstack-codex` gets an independent review from OpenAI's Codex CLI — a completely different AI looking at the same diff. Three modes: code review with a pass/fail gate, adversarial challenge that actively tries to break your code, and open consultation with session continuity. When both `/kstack-review` (Claude) and `/kstack-codex` (OpenAI) have reviewed the same branch, you get a cross-model analysis showing which findings overlap and which are unique to each.

**Safety guardrails on demand.** Say "be careful" and `/kstack-careful` warns before any destructive command — rm -rf, DROP TABLE, force-push, git reset --hard. `/kstack-freeze` locks edits to one directory while debugging so Claude can't accidentally "fix" unrelated code. `/kstack-guard` activates both. `/kstack-investigate` auto-freezes to the module being investigated.

**Proactive skill suggestions.** kstack notices what stage you're in — brainstorming, reviewing, debugging, testing — and suggests the right skill. Don't like it? Say "stop suggesting" and it remembers across sessions.

## 10-15 parallel sprints

kstack is powerful with one sprint. It is transformative with ten running at once.

[Conductor](https://conductor.build) runs multiple Claude Code sessions in parallel — each in its own isolated workspace. One session running `/office-hours` on a new idea, another doing `/review` on a PR, a third implementing a feature, a fourth running `/qa` on staging, and six more on other branches. All at the same time. I regularly run 10-15 parallel sprints — that's the practical max right now.

The sprint structure is what makes parallelism work. Without a process, ten agents is ten sources of chaos. With a process — think, plan, build, review, test, ship — each agent knows exactly what to do and when to stop. You manage them the way a CEO manages a team: check in on the decisions that matter, let the rest run.

---

Eighteen specialists and seven power tools. All slash commands. All Markdown. All free. **[github.com/danhkhoi/kstack](https://github.com/danhkhoi/kstack)** — MIT License

> Fork of [github.com/garrytan/gstack](https://github.com/garrytan/gstack). No telemetry. See [FORK_DIFF.md](FORK_DIFF.md) for what changed.

## Docs

| Doc | What it covers |
|-----|---------------|
| [Skill Deep Dives](docs/skills.md) | Philosophy, examples, and workflow for every skill (includes Greptile integration) |
| [Builder Ethos](ETHOS.md) | Builder philosophy: Boil the Lake, Search Before Building, three layers of knowledge |
| [Architecture](ARCHITECTURE.md) | Design decisions and system internals |
| [Browser Reference](BROWSER.md) | Full command reference for `/browse` |
| [Contributing](CONTRIBUTING.md) | Dev setup, testing, contributor mode, and dev mode |
| [Changelog](CHANGELOG.md) | What's new in every version |

## Privacy

kstack sends **no telemetry**. Nothing is phoned home. No Supabase, no analytics endpoints, no opt-in prompts. Local analytics are still available — run `kstack-analytics` to see your personal usage dashboard from the local JSONL file.

This is a fork of [garrytan/gstack](https://github.com/garrytan/gstack) with telemetry fully removed. See [FORK_DIFF.md](FORK_DIFF.md) for the full list of changes.

## Troubleshooting

**Skill not showing up?** `cd ~/.claude/skills/kstack && ./setup`

**`/kstack-browse` fails?** `cd ~/.claude/skills/kstack && bun install && bun run build`

**Stale install?** Run `/kstack-upgrade` — or set `auto_upgrade: true` in `~/.kstack/config.yaml`

**Windows users:** kstack works on Windows 11 via Git Bash or WSL. Node.js is required in addition to Bun — Bun has a known bug with Playwright's pipe transport on Windows ([bun#4253](https://github.com/oven-sh/bun/issues/4253)). The browse server automatically falls back to Node.js. Make sure both `bun` and `node` are on your PATH.

**Claude says it can't see the skills?** Make sure your project's `CLAUDE.md` has a kstack section. Add this:

```
## kstack
Use /kstack-browse for all web browsing. Never use mcp__claude-in-chrome__* tools.
Available skills: /kstack-office-hours, /kstack-plan-ceo-review, /kstack-plan-eng-review,
/kstack-plan-design-review, /kstack-design-consultation, /kstack-review, /kstack-ship,
/kstack-browse, /kstack-qa, /kstack-qa-only, /kstack-design-review,
/kstack-setup-browser-cookies, /kstack-retro, /kstack-investigate,
/kstack-document-release, /kstack-codex, /kstack-careful, /kstack-freeze,
/kstack-guard, /kstack-unfreeze, /kstack-upgrade.
```

## License

MIT. Free forever. Go build something.
