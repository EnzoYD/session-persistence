# Session Persistence

An OpenCode agent skill for saving and resuming long-running work without losing computed IDs, mapping tables, decisions, progress, or exact resume instructions.

## Repository contents

- `SKILL.md` — the global `session-persistence` skill.
- `plugin/session-guard.ts` — optional OpenCode plugin that preserves `active.md` through context compaction and enables auto-continue.

## Install

Clone the repository into OpenCode's global skills directory:

```sh
git clone <repository-url> ~/.config/opencode/skills/session-persistence
```

OpenCode discovers the root `SKILL.md` from that location.

### Enable compaction survival

Copy the companion plugin:

```sh
mkdir -p ~/.config/opencode/plugins
cp ~/.config/opencode/skills/session-persistence/plugin/session-guard.ts \
  ~/.config/opencode/plugins/session-guard.ts
```

Add the plugin to `~/.config/opencode/opencode.jsonc` while preserving any existing plugins:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["./plugins/session-guard.ts"]
}
```

The host OpenCode configuration must provide `@opencode-ai/plugin`; OpenCode normally installs this dependency in its configuration directory.

## How it works

The skill writes resumable state to:

```text
<project-root>/.opencode/sessions/active.md
```

The file always uses the same path. Git history provides the archive. See `SKILL.md` for the full save, resume, and cleanup protocol.
