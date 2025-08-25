import type { Node, Edge } from 'reactflow'

export type Attrs = Record<string, string>

export type HandleInfo = {
  id: string
  angle?: number // degrees, clockwise from +X (right)
  label?: string
  color?: string
  opacity?: number
}

export type ComponentNodeData = {
  title?: string
  name?: string
  _originalName?: string
  attrs?: Attrs
  inputHandles?: HandleInfo[]
  outputHandles?: HandleInfo[]
  image?: string // data URL
  imageSrc?: string
  color?: string
  input_info?: Record<string, unknown>
  table_values?: Record<string, unknown>
  pin_info?: string[]
  view?: 'edit' | 'results'
  isNodeToolbar?: boolean
  fadde?: boolean
  onHandleUpdate?: (nodeId: string, handleId: string, angle: number) => void
  onHandleDragStop?: (nodeId: string, handleId: string, angle: number) => void
}

export type SavedState = {
  nodes: Node<ComponentNodeData>[]
  edges: Edge[]
}
