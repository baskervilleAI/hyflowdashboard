import React, { useMemo, useState } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import type { ComponentNodeData, HandleInfo } from '../types'

// Convert angle (deg) to normalized [top,left] within a rectangle (0..1 range)
function angleToTopLeft(angle: number): { top: string; left: string } {
  // Place handle around a circle mapped into the node's bounding box
  const rad = (angle * Math.PI) / 180
  // Range [-1,1]
  const x = Math.cos(rad)
  const y = Math.sin(rad)
  // Map to [0,1] and clamp a bit to avoid clipping
  const pad = 0.06
  const left = ((x + 1) / 2) * (1 - 2 * pad) + pad
  const top = ((y + 1) / 2) * (1 - 2 * pad) + pad
  return { top: `${(top * 100).toFixed(2)}%`, left: `${(left * 100).toFixed(2)}%` }
}

function getDefaultAngles(n: number, side: 'left' | 'right'): number[] {
  const start = side === 'left' ? 180 : 0
  const span = 160 // fan
  const offset = (180 - span) / 2
  const res: number[] = []
  for (let i = 0; i < n; i++) {
    const frac = n > 1 ? i / (n - 1) : 0.5
    const a = start + (side === 'left' ? 1 : 1) * (frac * span - offset)
    res.push(a)
  }
  return res
}

export default function ComponentNode({ data, selected }: NodeProps<ComponentNodeData>) {
  const [hover, setHover] = useState(false)

  const inputs: HandleInfo[] = useMemo(() => {
    const arr = data.inputHandles ?? [{ id: 'in-1' }]
    const missing = arr.filter(h => h.angle == null)
    if (missing.length) {
      const angles = getDefaultAngles(arr.length, 'left')
      return arr.map((h, i) => ({ ...h, angle: h.angle ?? angles[i] }))
    }
    return arr
  }, [data.inputHandles])

  const outputs: HandleInfo[] = useMemo(() => {
    const arr = data.outputHandles ?? [{ id: 'out-1' }]
    const missing = arr.filter(h => h.angle == null)
    if (missing.length) {
      const angles = getDefaultAngles(arr.length, 'right')
      return arr.map((h, i) => ({ ...h, angle: h.angle ?? angles[i] }))
    }
    return arr
  }, [data.outputHandles])

  return (
    <div
      className={`component-node ${selected ? 'selected' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {data.image && <img className="node-thumb" src={data.image} alt={data.title ?? 'node'} />}
      <div className="node-title">{data.title ?? 'Node'}</div>

      {/* Hover card with attributes */}
      {hover && data.attrs && Object.keys(data.attrs).length > 0 && (
        <div className="hover-card">
          <table>
            <thead>
              <tr><th colSpan={2}>Attributes</th></tr>
            </thead>
            <tbody>
              {Object.entries(data.attrs).map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Render input handles */}
      {inputs.map((h) => {
        const a = h.angle ?? 180
        const pos = angleToTopLeft(a)
        return (
          <Handle
            key={h.id}
            id={h.id}
            type="target"
            position={Position.Left}
            style={{ top: pos.top, left: pos.left, borderColor: h.color ?? '#444' }}
            isConnectable
          />
        )
      })}

      {/* Render output handles */}
      {outputs.map((h) => {
        const a = h.angle ?? 0
        const pos = angleToTopLeft(a)
        return (
          <Handle
            key={h.id}
            id={h.id}
            type="source"
            position={Position.Right}
            style={{ top: pos.top, left: pos.left, borderColor: h.color ?? '#444' }}
            isConnectable
          />
        )
      })}
    </div>
  )
}
