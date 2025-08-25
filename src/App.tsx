import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
  Node,
  OnSelectionChangeParams
} from 'reactflow'
import 'reactflow/dist/style.css'

import ComponentNode from './components/ComponentNode'
import type { ComponentNodeData, Attrs, SavedState } from './types'
import { saveState, loadState, clearState } from './storage'
import { MAX_IMAGE_DIMENSION, IMAGE_QUALITY, UNSPLASH_ACCESS_KEY, UNSPLASH_API_URL } from './constants'

const nodeTypes = { component: ComponentNode }

type Selected = { nodes: Node<ComponentNodeData>[]; edges: Edge[] }

const initialNodes: Node<ComponentNodeData>[] = [
  {
    id: 'A',
    type: 'component',
    position: { x: 100, y: 100 },
    data: {
      title: 'Source',
      outputHandles: [{ id: 'a-out-1', label: 'out' }],
      attrs: { kind: 'generator' }
    },
  },
  {
    id: 'B',
    type: 'component',
    position: { x: 420, y: 220 },
    data: {
      title: 'Sink',
      inputHandles: [{ id: 'b-in-1', label: 'in' }],
      attrs: { kind: 'consumer' }
    },
  },
]

const initialEdges: Edge[] = []

function downloadBlob(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<ComponentNodeData>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selected, setSelected] = useState<Selected>({ nodes: [], edges: [] })
  const [attrKey, setAttrKey] = useState('')
  const [attrValue, setAttrValue] = useState('')

  // Load state on first mount
  useEffect(() => {
    const loaded = loadState()
    if (loaded) {
      setNodes(loaded.nodes)
      setEdges(loaded.edges)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-save on change
  useEffect(() => {
    saveState({ nodes, edges })
  }, [nodes, edges])

  const onConnect = useCallback((c: Connection) => setEdges((eds) => addEdge(c, eds)), [setEdges])

  const addNode = () => {
    const id = `N${Date.now().toString(36)}`
    setNodes(nds => nds.concat({
      id,
      type: 'component',
      position: { x: 200 + Math.random() * 80, y: 120 + Math.random() * 140 },
      data: { title: 'Node', inputHandles: [{ id: id + '-in' }], outputHandles: [{ id: id + '-out' }], attrs: {} }
    }))
  }

  const addImageUrlNode = (url: string, title: string) => {
    const id = `IMG${Date.now().toString(36)}`
    setNodes(nds =>
      nds.concat({
        id,
        type: 'component',
        position: { x: 260 + Math.random() * 80, y: 160 + Math.random() * 140 },
        data: {
          title,
          imageSrc: url,
          inputHandles: [{ id: id + '-in' }],
          outputHandles: [{ id: id + '-out' }],
          attrs: { src: url }
        }
      })
    )
  }

  const addImageNode = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > height) {
          if (width > MAX_IMAGE_DIMENSION) {
            height = (height * MAX_IMAGE_DIMENSION) / width
            width = MAX_IMAGE_DIMENSION
          }
        } else if (height > MAX_IMAGE_DIMENSION) {
          width = (width * MAX_IMAGE_DIMENSION) / height
          height = MAX_IMAGE_DIMENSION
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY)
          addImageUrlNode(dataUrl, file.name)
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const searchImageNode = async () => {
    const query = prompt('Search images for:')
    if (!query) return
    if (!UNSPLASH_ACCESS_KEY) {
      alert('Missing Unsplash access key')
      return
    }
    try {
      const resp = await fetch(`${UNSPLASH_API_URL}?query=${encodeURIComponent(query)}&per_page=5&client_id=${UNSPLASH_ACCESS_KEY}`)
      const json = await resp.json()
      if (!json.results || json.results.length === 0) {
        alert('No results')
        return
      }
      const choice = prompt(
        json.results
          .map((r: any, i: number) => `${i + 1}: ${r.description || r.alt_description || 'Image ' + (i + 1)}`)
          .join('\n') +
          '\nEnter image number to add:'
      )
      const idx = Number(choice) - 1
      if (idx >= 0 && idx < json.results.length) {
        const img = json.results[idx]
        addImageUrlNode(img.urls.small, img.description || img.alt_description || query)
      }
    } catch (e) {
      alert('Image search failed')
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const onSelectionChange = useCallback(({ nodes: ns, edges: es }: OnSelectionChangeParams) => {
    setSelected({ nodes: ns as Node<ComponentNodeData>[], edges: es })
  }, [])

  // Dimming behavior for unrelated elements when something is selected
  useEffect(() => {
    const selectedIds = new Set(selected.nodes.map(n => n.id))
    const relatedIds = new Set<string>()
    selected.nodes.forEach(n => relatedIds.add(n.id))
    edges.forEach(e => {
      if (selectedIds.has(e.source) || selectedIds.has(e.target)) {
        relatedIds.add(e.source); relatedIds.add(e.target)
      }
    })

    setNodes(nds => nds.map(n => {
      const isRelated = relatedIds.size > 0 ? relatedIds.has(n.id) : true
      const opacity = relatedIds.size > 0 && !isRelated ? 0.25 : 1
      return { ...n, style: { ...(n.style || {}), opacity } }
    }))

    setEdges(eds => eds.map(e => {
      const isRelated = relatedIds.size > 0 && (relatedIds.has(e.source) && relatedIds.has(e.target))
      const opacity = relatedIds.size > 0 && !isRelated ? 0.25 : 1
      return { ...e, style: { ...(e.style || {}), opacity } }
    }))
  }, [selected, setNodes, setEdges, edges])

  const selectedNode: Node<ComponentNodeData> | null = selected.nodes.length === 1 ? selected.nodes[0] : null

  const addAttr = () => {
    if (!selectedNode || !attrKey) return
    const id = selectedNode.id
    setNodes(nds => nds.map(n => {
      if (n.id !== id) return n
      const attrs: Attrs = { ...(n.data?.attrs || {}) }
      attrs[attrKey] = attrValue
      return { ...n, data: { ...(n.data || {}), attrs } }
    }))
    setAttrKey(''); setAttrValue('')
  }

  const removeAttr = (k: string) => {
    if (!selectedNode) return
    const id = selectedNode.id
    setNodes(nds => nds.map(n => {
      if (n.id !== id) return n
      const attrs: Attrs = { ...(n.data?.attrs || {}) }
      delete attrs[k]
      return { ...n, data: { ...(n.data || {}), attrs } }
    }))
  }

  const saveJSON = () => downloadBlob('hyflow_state.json', JSON.stringify({ nodes, edges }, null, 2))

  const importJSON = (file: File) => {
    const rd = new FileReader()
    rd.onload = () => {
      try {
        const parsed = JSON.parse(rd.result as string) as SavedState
        setNodes(parsed.nodes)
        setEdges(parsed.edges)
      } catch (e) {
        alert('Invalid JSON')
      }
    }
    rd.readAsText(file)
  }

  const clearAll = () => {
    clearState()
    setNodes([])
    setEdges([])
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">HyFlowDashboard</div>
        <div className="actions">
          <button onClick={addNode}>+ Node</button>
          <button onClick={() => fileInputRef.current?.click()}>+ Image Node</button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) addImageNode(f); e.currentTarget.value = '' }} />
          <button onClick={searchImageNode}>Search Image</button>
          <button onClick={saveJSON}>Export JSON</button>
          <button onClick={() => importRef.current?.click()}>Import JSON</button>
          <input ref={importRef} type="file" accept="application/json" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importJSON(f); e.currentTarget.value = '' }} />
          <button onClick={clearAll}>Clear</button>
        </div>
      </header>

      <div className="content">
        <div className="canvas">
          <ReactFlow
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background gap={16} />
          </ReactFlow>
        </div>

        <aside className="inspector">
          <h3>Inspector</h3>
          {selectedNode ? (
            <>
              <div className="field">
                <label>Title</label>
                <input value={selectedNode.data?.title ?? ''} onChange={(e) => {
                  const v = e.target.value
                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? ({ ...n, data: { ...(n.data || {}), title: v } }) : n))
                }} />
              </div>

              <div className="field">
                <label>Add attribute</label>
                <div className="row">
                  <input placeholder="key" value={attrKey} onChange={e => setAttrKey(e.target.value)} />
                  <input placeholder="value" value={attrValue} onChange={e => setAttrValue(e.target.value)} />
                  <button onClick={addAttr}>Add</button>
                </div>
              </div>

              <div className="attrs-list">
                <h4>Attributes</h4>
                <ul>
                  {Object.entries(selectedNode.data?.attrs || {}).map(([k, v]) => (
                    <li key={k}><strong>{k}:</strong> {v} <button onClick={() => removeAttr(k)}>x</button></li>
                  ))}
                </ul>
              </div>

              <div className="handles">
                <h4>Ports</h4>
                <div className="row">
                  <button onClick={() => {
                    const id = selectedNode.id + '-in-' + Math.random().toString(36).slice(2,6)
                    setNodes(nds => nds.map(n => {
                      if (n.id !== selectedNode.id) return n
                      const inputHandles = [...(n.data?.inputHandles || []) , { id }]
                      return { ...n, data: { ...(n.data || {}), inputHandles } }
                    }))
                  }}>+ Input</button>
                  <button onClick={() => {
                    const id = selectedNode.id + '-out-' + Math.random().toString(36).slice(2,6)
                    setNodes(nds => nds.map(n => {
                      if (n.id !== selectedNode.id) return n
                      const outputHandles = [...(n.data?.outputHandles || []) , { id }]
                      return { ...n, data: { ...(n.data || {}), outputHandles } }
                    }))
                  }}>+ Output</button>
                </div>
              </div>
            </>
          ) : (
            <p>Select one node to edit.</p>
          )}
        </aside>
      </div>
    </div>
  )
}
