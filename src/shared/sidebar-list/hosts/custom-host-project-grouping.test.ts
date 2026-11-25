import { describe, expect, it } from 'vitest'
import type { Repo } from '../../repository/repo-types'
import type { GroupHeaderRow } from '../row-types'
import { addHostSectionRows, shouldGroupSidebarByHost, type HostSectionOption } from './host-section-rows'

const local: Repo = {
  id: 'same-repo',
  path: '/local/project',
  displayName: 'Project',
  badgeColor: '#ffffff',
  addedAt: 0,
  executionHostId: 'local'
}
const remote: Repo = { ...local, path: '/remote/project', executionHostId: 'runtime:remote' }

const hostOptions: HostSectionOption[] = [
  { id: 'local', kind: 'local', label: 'Local', detail: '', health: 'local' },
  { id: 'runtime:remote', kind: 'runtime', label: 'Remote', detail: '', health: 'available' }
]
const header: GroupHeaderRow = {
  type: 'header',
  key: 'repo:same-repo',
  count: 2,
  icon: { kind: 'project' },
  repo: local,
  hostRepos: new Map([['local', local], ['runtime:remote', remote]]),
  hostWorktreeCounts: new Map([['local', 1], ['runtime:remote', 1]]),
  hostWorktreeIds: new Map([['local', ['local-workspace']], ['runtime:remote', ['remote-workspace']]])
}

describe('custom host-first Project view', () => {
  it('groups All hosts by host only in Project mode', () => {
    expect(shouldGroupSidebarByHost('repo', 'all', null)).toBe(true)
    for (const mode of ['none', 'workspace-status', 'pr-status'] as const) {
      expect(shouldGroupSidebarByHost(mode, 'all', null)).toBe(false)
      expect(shouldGroupSidebarByHost(mode, 'all', ['local', 'runtime:remote'])).toBe(true)
    }
    expect(shouldGroupSidebarByHost('repo', 'runtime:remote', null)).toBe(true)
  })

  it('renders the same logical project with the correct registration under each host', () => {
    const rows = addHostSectionRows({
      rows: [header],
      hostOptions,
      workspaceHostScope: 'all',
      visibleWorkspaceHostIds: null,
      defaultHostId: 'local',
      localHostLabel: 'Local',
      preferProjectGrouping: !shouldGroupSidebarByHost('repo', 'all', null)
    })
    expect(rows.map((row) => [row.type, 'hostId' in row ? row.hostId : null])).toEqual([
      ['host-header', 'local'],
      ['header', 'local'],
      ['host-header', 'runtime:remote'],
      ['header', 'runtime:remote']
    ])
    const projects = rows.filter((row): row is GroupHeaderRow => row.type === 'header')
    expect(projects.map((row) => [row.repo?.path, row.count, row.worktreeIds])).toEqual([
      ['/local/project', 1, ['local-workspace']],
      ['/remote/project', 1, ['remote-workspace']]
    ])
  })

  it('retains the existing flat view outside Project mode', () => {
    const rows = addHostSectionRows({
      rows: [header],
      hostOptions,
      workspaceHostScope: 'all',
      visibleWorkspaceHostIds: null,
      defaultHostId: 'local',
      localHostLabel: 'Local',
      preferProjectGrouping: !shouldGroupSidebarByHost('none', 'all', null)
    })
    expect(rows).toEqual([header])
  })
})
