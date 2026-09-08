---
name: session-persistence
description: Use when quitting a session to resume later, resuming a prior session, or after completing a major milestone in a multi-session task. Triggered by "save session", "quit", "pause", "pick up later", "resume", "continue where we left off", or detecting .opencode/sessions/active.md exists at session start.
---

# Session Persistence

Save and resume long-running multi-session work without losing computed state, decisions, or context.

## When to Use

- User says "quit", "pause", "save progress", "pick up later"
- You complete a major milestone (audit done, phase complete, decision made)
- Starting a session and `.opencode/sessions/active.md` exists
- Session has >5 tool calls and accumulated non-trivial state

## When NOT to Use

- Single-shot tasks that complete in one session
- Pure Q&A / informational conversations
- Task has no computed state worth preserving

## Core Protocol

```dot
digraph session_persistence {
  "Trigger detected" [shape=doublecircle];
  "Save or Resume?" [shape=diamond];
  "Read active.md" [shape=box];
  "Present status to user" [shape=box];
  "Ask pending decisions" [shape=box];
  "Continue from in-progress tasks" [shape=box];
  "Write active.md" [shape=box];
  "Commit to git" [shape=box];
  "Confirm to user" [shape=doublecircle];

  "Trigger detected" -> "Save or Resume?";
  "Save or Resume?" -> "Read active.md" [label="resume"];
  "Save or Resume?" -> "Write active.md" [label="save"];
  "Read active.md" -> "Present status to user";
  "Present status to user" -> "Ask pending decisions";
  "Ask pending decisions" -> "Continue from in-progress tasks";
  "Write active.md" -> "Commit to git";
  "Commit to git" -> "Confirm to user";
}
```

## File Location

```
<project-root>/.opencode/sessions/
└── active.md    # Current session (always this name)
```

**Always `active.md`** — no ambiguity about which file to read on resume. Git history serves as the archive; no separate archived/ folder needed.

## Save Protocol

### Auto-Save Triggers

Save automatically (without user asking) after:
- Any completed phase/milestone
- User answers a blocking decision
- Expensive audit/search completes (>5 API calls of results)
- Before executing destructive operations

### What to Capture

**MANDATORY — these are the failures that occur without this skill:**

1. **All computed keys/IDs** — every API-derived identifier, variable key, component key, library key. These cost API calls to re-derive. Capture ALL of them, not just "the important ones."

2. **Full mapping tables** — if you built a mapping (A→B), save the COMPLETE table. Partial tables are useless. If the full table exists in an external file, reference that file in Relevant Files AND verify it's up-to-date. If it only exists in conversation context, inline it entirely in Key Data — even if it's 200+ rows.

3. **Page/scope breakdown** — which pages/files to process, which to skip, current progress per-page.

4. **Decisions with FULL context** — not just "Approach A or B?" but the complete explanation of what A and B mean, their tradeoffs, and what information the user needs to decide.

5. **Resume instructions** — specific, actionable first steps. Not "continue migration" but "Run script X on pages Y-Z using keys from the Key Data section."

6. **Relevant file paths** — every file that contains important context for this work. This means OTHER files (plans, specs, mapping tables, configs), not just self-referencing `active.md`. A fresh session needs to know what else to read.

### File Format

```markdown
---
goal: <one-line objective>
started: 2026-05-19
last-saved: 2026-05-19T14:30:00
status: paused | blocked | completed
blocked-by: <what's needed before resuming — omit if not blocked>
---

# Session: <Descriptive Name>

## Goal
<2-3 sentences describing the overall objective>

## Constraints
<Bullet list of rules/preferences governing the work>

## Decisions Made
| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | ... | ... | ... |

## Decisions Pending
<!-- FULL context for each — a fresh session must be able to present these
     to the user without re-deriving anything -->
### Decision N: <Title>
**Question:** ...
**Options:**
- A: <full explanation>
- B: <full explanation>
**Context:** <why this matters, what depends on it>
**Relevant data:** <any keys/values needed to understand the options>

## Progress
### Completed
- [x] Task (outcome, artifact location if any)

### In Progress
- [ ] Task (current state, what remains)

### Not Started
- [ ] Task

## Key Data
<!-- EVERY expensive-to-derive value goes here -->
<!-- Use YAML code blocks for structured data -->
```yaml
file_key: "re4FnhqStNUMwogNpySy3h"
library_keys:
  ds25_foundations: "lk-ef923..."
  ds25_core: "lk-2818..."
variable_keys:
  foreground/ghost/hover: "ed13a66e..."
  foreground/ghost/active: "1a2e4f5c..."
  # ... ALL of them, not a subset
component_keys:
  ds25_button: "key..."
  ds25_badge: "key..."
audit_totals:
  variables: 209
  bindings: 52718
  pages_to_process: 34
```

## Relevant Files
- `path/to/file` — what it contains, why it matters for resuming

## Resume Instructions
<!-- Specific, actionable steps — not vague descriptions -->
1. Read this file
2. Read `<specific file>` for the full mapping table
3. Present Decisions Pending to user
4. After decisions: execute <specific action> using keys from Key Data
5. ...
```

## Resume Protocol

When starting a session and `.opencode/sessions/active.md` exists:

1. **Read it fully** — do not skim
2. **Read referenced files** from the Relevant Files section
3. **Present status** — tell user: "Resuming session: <name>. Status: <status>. Last saved: <date>."
4. **If pending decisions exist** — present them immediately with full context (they're already written in the file)
5. **If no decisions pending** — state the next action from Resume Instructions and begin

**Do NOT re-run audits or searches if the data exists in Key Data.** That section exists specifically to avoid redundant API calls.

## Compaction Survival

The `session-guard` plugin (installed globally at `~/.config/opencode/plugins/session-guard.ts`)
automatically injects `active.md` contents into the compaction prompt and enables auto-continue.

**Expected post-compaction behavior:**

1. Re-read `.opencode/sessions/active.md` fully
2. Re-read files listed in the "Relevant Files" section
3. Continue from the last in-progress task without announcing compaction to the user
4. Do NOT re-derive state that exists in Key Data — use it directly

## Archiving

When a task completes: delete `active.md`. Git history retains all prior versions.
When starting a NEW task on a project that already has `active.md`: overwrite it. The old version lives in git.
When RESUMING an existing session: read and continue — do not overwrite.

## Red Flags — You're About to Lose State

| Thought | Reality |
|---------|---------|
| "I'll remember this" | You won't. Next session is a blank slate. Save it. |
| "Just the important keys" | ALL keys. You don't know which you'll need. |
| "The mapping table is too long" | Length doesn't matter. Completeness matters. |
| "I'll re-search if needed" | Re-searching wastes user time and API calls. Save now. |
| "This decision context is obvious" | Obvious to you NOW. Not to a fresh session. Write full context. |
| "Auto-save is overkill here" | If you've done >5 API calls, auto-save. No exceptions. |
| "I'll save at the end" | Sessions crash. Save after each milestone. |

## Common Mistakes

1. **Saving only a summary** — summaries lose detail. Save the actual data (keys, counts, mappings).
2. **Omitting decision context** — "A or B?" is useless without explanation. Include full options and tradeoffs.
3. **Vague resume instructions** — "continue the work" helps nobody. Specify exact commands/actions.
4. **Not committing to git** — local file can be lost. Always `git add + commit` after saving.
5. **Waiting for explicit "save"** — auto-save on milestones. Don't wait for the user to ask.
