import type { Plugin } from "@opencode-ai/plugin"
import { readFileSync } from "node:fs"
import { join } from "node:path"

export default (async ({ directory }) => {
  const sessionFile = join(directory, ".opencode", "sessions", "active.md")

  return {
    "experimental.session.compacting": async (_input, output) => {
      let contents: string
      try {
        contents = readFileSync(sessionFile, "utf-8")
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          return
        }
        throw error
      }
      if (!contents.trim()) return

      output.context.push(
        `CRITICAL SESSION STATE — The following is the complete session state from .opencode/sessions/active.md.\n` +
          `Preserve ALL safe, non-sensitive state from the file in the compaction summary:\n` +
          `- Every non-secret key, ID, and variable reference needed to resume\n` +
          `- All decisions made and their rationale\n` +
          `- Current progress (what's done, what's in progress, what's pending)\n` +
          `- Resume instructions\n\n` +
          `After compaction, the model MUST re-read .opencode/sessions/active.md and all files listed in its "Relevant Files" section, then continue from the last in-progress task.\n\n` +
          `---\n\n` +
          contents,
      )
    },
  }
}) satisfies Plugin
