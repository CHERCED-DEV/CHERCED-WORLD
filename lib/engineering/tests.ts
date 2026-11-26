import { idsIn, type RequirementId } from './specs'

export const TEST_KINDS = ['unit', 'contract', 'e2e'] as const

export type TestKind = (typeof TEST_KINDS)[number]

export type TestCounts = Record<TestKind, number>

export type IdIndex = ReadonlyMap<RequirementId, readonly string[]>

export type RequirementTrace = { tested: Array<{ id: RequirementId; files: readonly string[] }>; untested: RequirementId[] }

const SEARCHABLE = /\.(ts|tsx|mts|mjs|js)$/

export function testKind(file: string): TestKind | null {
  if (/^tests\/unit\/.+\.test\.tsx?$/.test(file)) return 'unit'
  if (/^tests\/contract\/.+\.test\.tsx?$/.test(file)) return 'contract'
  if (/^tests\/e2e\/.+\.spec\.tsx?$/.test(file)) return 'e2e'
  return null
}

export function countByKind(files: readonly string[]): TestCounts {
  const counts: TestCounts = { unit: 0, contract: 0, e2e: 0 }
  for (const file of files) {
    const kind = testKind(file)
    if (kind) counts[kind] += 1
  }
  return counts
}

export function idIndex(files: readonly string[], read: (file: string) => string | null): Map<RequirementId, string[]> {
  const index = new Map<RequirementId, string[]>()
  for (const file of files) {
    if (!file.startsWith('tests/') || !SEARCHABLE.test(file)) continue
    const text = read(file)
    if (!text) continue
    for (const id of idsIn(text)) {
      const list = index.get(id) ?? []
      list.push(file)
      index.set(id, list)
    }
  }
  for (const list of index.values()) list.sort()
  return index
}

export function traceRequirements(ids: readonly RequirementId[], index: IdIndex): RequirementTrace {
  const tested: RequirementTrace['tested'] = []
  const untested: RequirementId[] = []
  for (const id of ids) {
    const files = index.get(id)
    if (files?.length) tested.push({ id, files })
    else untested.push(id)
  }
  return { tested, untested }
}
