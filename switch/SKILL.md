---
name: kstack-switch
version: 1.0.0
description: |
  Install kstack skills or revert to garrytan/gstack. Use when asked to
  "install kstack", "switch to kstack", "revert to gstack", or "check what skills are installed".
allowed-tools:
  - Bash
  - AskUserQuestion
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: bun run gen:skill-docs -->

# /kstack-switch — Install or Revert kstack Skills

Manages which skill set is active in `~/.claude/skills/`:
- **install** — switches from gstack → kstack (your fork, no telemetry, `kstack-*` prefixed skills)
- **revert** — removes kstack, installs fresh `garrytan/gstack`
- **status** — shows what is currently installed

## Step 1: Check current status

```bash
~/.claude/skills/kstack/bin/kstack-switch status
```

Show the user what is installed and which symlinks exist.

## Step 2: Ask what to do (if not already specified)

Use AskUserQuestion:
- Question: "What would you like to do with your skills installation?"
- Options:
  - A) Install kstack (your fork) — removes gstack symlinks, installs kstack-prefixed skills
  - B) Revert to garrytan/gstack — removes kstack, clones fresh gstack from Gary's repo
  - C) Just show me the status — done

## Step 3: Run the chosen action

**If A (install kstack):**
```bash
bash ~/.claude/skills/kstack/bin/kstack-switch install
```

**If B (revert to gstack):**
```bash
bash ~/.claude/skills/kstack/bin/kstack-switch revert
```

**If C:** Already done in Step 1.

## Step 4: Tell the user

After running, tell the user:
- What was done (which symlinks removed, which dir renamed/cloned)
- That they need to **restart Claude Code** for the new skills to take effect
- For install: skills are now `/kstack`, `/kstack-qa`, `/kstack-review`, etc.
- For revert: skills are now `/gstack`, `/qa`, `/review`, etc.
- For revert: their kstack backup is at `~/.claude/skills/kstack.bak`

---

## Running before kstack is installed (bootstrap)

If kstack is not yet installed as a skill, run the script directly:

```bash
# Install kstack
bash ~/path/to/kstack/bin/kstack-switch install

# Revert to gstack
bash ~/path/to/kstack/bin/kstack-switch revert

# Check status
bash ~/path/to/kstack/bin/kstack-switch status
```
