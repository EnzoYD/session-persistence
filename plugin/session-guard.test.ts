import { afterEach, describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import sessionGuard from "./session-guard"

const temporaryProjects: string[] = []

async function createProject(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "session-persistence-"))
  temporaryProjects.push(directory)
  return directory
}

async function loadHooks(directory: string) {
  return sessionGuard({ directory } as never)
}

afterEach(async () => {
  await Promise.all(
    temporaryProjects.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  )
})

describe("session guard", () => {
  test("injects a non-empty active session into compaction context", async () => {
    const directory = await createProject()
    const sessionDirectory = join(directory, ".opencode", "sessions")
    await mkdir(sessionDirectory, { recursive: true })
    await Bun.write(
      join(sessionDirectory, "active.md"),
      "# Session: Test\nkey: preserved\n",
    )

    const hooks = await loadHooks(directory)
    const output = { context: [] as string[] }
    await hooks["experimental.session.compacting"]?.(
      { sessionID: "test" },
      output,
    )

    expect(output.context).toHaveLength(1)
    expect(output.context[0]).toContain("key: preserved")
    expect("experimental.compaction.autocontinue" in hooks).toBe(false)
  })

  test("ignores a missing active session", async () => {
    const directory = await createProject()
    const hooks = await loadHooks(directory)
    const output = { context: [] as string[] }

    await hooks["experimental.session.compacting"]?.(
      { sessionID: "test" },
      output,
    )

    expect(output.context).toEqual([])
  })

  test("ignores an empty active session", async () => {
    const directory = await createProject()
    const sessionDirectory = join(directory, ".opencode", "sessions")
    await mkdir(sessionDirectory, { recursive: true })
    await Bun.write(join(sessionDirectory, "active.md"), " \n\t")

    const hooks = await loadHooks(directory)
    const output = { context: [] as string[] }
    await hooks["experimental.session.compacting"]?.(
      { sessionID: "test" },
      output,
    )

    expect(output.context).toEqual([])
  })

  test("surfaces active session read failures other than absence", async () => {
    const directory = await createProject()
    const sessionPath = join(directory, ".opencode", "sessions", "active.md")
    await mkdir(sessionPath, { recursive: true })

    const hooks = await loadHooks(directory)
    const output = { context: [] as string[] }

    await expect(
      hooks["experimental.session.compacting"]?.(
        { sessionID: "test" },
        output,
      ),
    ).rejects.toThrow()
  })
})
