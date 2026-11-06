export type TreeNodeKind = 'folder' | 'file'

export type TreeNode = {
  id: string
  name: string
  kind: TreeNodeKind
  level: number
  parent: string | null
  children: string[]
}

export type FileTree = { roots: string[]; nodes: ReadonlyMap<string, TreeNode> }

export type TreeMove = { focus?: string; toggle?: string; expand?: string; collapse?: string; select?: string }

export function buildTree(root: string, paths: readonly string[]): FileTree {
  const nodes = new Map<string, TreeNode>()
  nodes.set(root, { id: root, name: root, kind: 'folder', level: 1, parent: null, children: [] })
  for (const path of paths) {
    const parts = path.split('/').filter(Boolean)
    let parent = root
    parts.forEach((name, index) => {
      const id = `${parent}/${name}`
      if (!nodes.has(id)) {
        const kind: TreeNodeKind = index === parts.length - 1 ? 'file' : 'folder'
        nodes.set(id, { id, name, kind, level: index + 2, parent, children: [] })
        nodes.get(parent)!.children.push(id)
      }
      parent = id
    })
  }
  return { roots: [root], nodes }
}

export function folderIds(tree: FileTree): string[] {
  return [...tree.nodes.values()].filter((node) => node.kind === 'folder').map((node) => node.id)
}

export function fileIds(tree: FileTree): string[] {
  return [...tree.nodes.values()].filter((node) => node.kind === 'file').map((node) => node.id)
}

export function visibleIds(tree: FileTree, expanded: ReadonlySet<string>): string[] {
  const out: string[] = []
  const walk = (ids: readonly string[]) => {
    for (const id of ids) {
      out.push(id)
      const node = tree.nodes.get(id)!
      if (node.kind === 'folder' && expanded.has(id)) walk(node.children)
    }
  }
  walk(tree.roots)
  return out
}

export function siblingsOf(tree: FileTree, id: string): string[] {
  const parent = tree.nodes.get(id)?.parent
  return parent ? tree.nodes.get(parent)!.children : tree.roots
}

export function typeAhead(tree: FileTree, expanded: ReadonlySet<string>, current: string, char: string): string | null {
  const visible = visibleIds(tree, expanded)
  const start = visible.indexOf(current)
  const wanted = char.toLocaleLowerCase()
  for (let step = 1; step <= visible.length; step += 1) {
    const id = visible[(start + step) % visible.length]!
    const name = tree.nodes.get(id)!.name.replace(/^\./, '')
    if (name.toLocaleLowerCase().startsWith(wanted)) return id
  }
  return null
}

export function treeKey(tree: FileTree, expanded: ReadonlySet<string>, current: string, key: string): TreeMove | null {
  const node = tree.nodes.get(current)
  if (!node) return null
  const visible = visibleIds(tree, expanded)
  const index = visible.indexOf(current)
  const open = node.kind === 'folder' && expanded.has(current)
  switch (key) {
    case 'ArrowDown':
      return index < visible.length - 1 ? { focus: visible[index + 1]! } : {}
    case 'ArrowUp':
      return index > 0 ? { focus: visible[index - 1]! } : {}
    case 'ArrowRight':
      if (node.kind === 'file') return {}
      if (!open) return { expand: current }
      return node.children.length > 0 ? { focus: node.children[0]! } : {}
    case 'ArrowLeft':
      if (open) return { collapse: current }
      return node.parent ? { focus: node.parent } : {}
    case 'Home':
      return { focus: visible[0]! }
    case 'End':
      return { focus: visible.at(-1)! }
    case 'Enter':
    case ' ':
      return node.kind === 'folder' ? { toggle: current } : { select: current }
    default:
      if (key.length === 1 && /\S/.test(key)) {
        const found = typeAhead(tree, expanded, current, key)
        return found ? { focus: found } : {}
      }
      return null
  }
}
