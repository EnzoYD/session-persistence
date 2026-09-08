# Session Persistence

An OpenCode agent skill for saving and resuming long-running work without losing computed IDs, mapping tables, decisions, progress, or exact resume instructions.

## Repository contents

- `SKILL.md` — the global `session-persistence` skill.
- `plugin/session-guard.ts` — optional OpenCode plugin that preserves non-empty `active.md` state through context compaction.

## Install

Clone the repository from your internal Git remote into OpenCode's global skills directory:

```sh
git clone "$SESSION_PERSISTENCE_REPOSITORY_URL" \
  ~/.config/opencode/skills/session-persistence
```

OpenCode discovers the root `SKILL.md` from that location.

### Enable compaction survival

Copy the companion plugin into OpenCode's auto-discovered global plugin directory:

```sh
mkdir -p ~/.config/opencode/plugins
cp ~/.config/opencode/skills/session-persistence/plugin/session-guard.ts \
  ~/.config/opencode/plugins/session-guard.ts
```

No `opencode.jsonc` entry is needed. Do not also list this file in the `plugin` array; loading the same hook twice can duplicate the injected context.

## Data safety

Session state is local and untracked by default. The skill instructs agents never to record credentials, tokens, cookies, private keys, secret environment values, or sensitive personal data in `active.md`.

Git archival is optional and requires explicit user consent plus suitable repository access controls. When enabled, only `.opencode/sessions/active.md` may be staged for a session-state commit; unrelated changes must remain untouched.

## Compatibility

The skill and plugin were verified with OpenCode 1.15.13. The plugin uses `experimental.session.compacting`, so future OpenCode releases may require an update.

## How it works

The skill writes resumable state to:

```text
<project-root>/.opencode/sessions/active.md
```

The file always uses the same path. It is deleted when the task completes. See `SKILL.md` for the full save, resume, safety, and cleanup protocol.

## Development

Run the plugin regression tests with:

```sh
bun test
```
