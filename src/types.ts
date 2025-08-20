import type { Node, Edge } from 'reactflow'

export type Attrs = Record<string, string>

export type HandleInfo = {
  id: string
  angle?: number // degrees, clockwise from +X (right)
  label?: string
  color?: string
}

export type ComponentNodeData = {
  title?: string
  attrs?: Attrs
  inputHandles?: HandleInfo[]
  outputHandles?: HandleInfo[]
  image?: string // data URL
  color?: string
}

export type SavedState = {
  nodes: Node<ComponentNodeData>[]
  edges: Edge[]
}
