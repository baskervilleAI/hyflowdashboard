import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  OnSelectionChangeParams,
} from "reactflow";
import "reactflow/dist/style.css";

import ComponentNode from "./components/ComponentNode";
import EdgeConfigurator from "./components/EdgeConfigurator";
import ImageSearch from "./components/ImageSearch";
import type { ComponentNodeData, Attrs, SavedState, NodeShape } from "./types";
import { saveState, loadState, clearState } from "./storage";
import { fetchServerInfo } from "./api";

const nodeTypes = { component: ComponentNode };

type Selected = { nodes: Node<ComponentNodeData>[]; edges: Edge[] };

const initialNodes: Node<ComponentNodeData>[] = [
  {
    id: "A",
    type: "component",
    position: { x: 100, y: 100 },
    data: {
      title: "Source",
      shape: { type: "polygon", sides: 6 },
      outputHandles: [{ id: "a-out-1", label: "out", angle: 0 }],
      attrs: { kind: "generator" },
    },
  },
  {
    id: "B",
    type: "component",
    position: { x: 420, y: 220 },
    data: {
      title: "Sink",
      shape: { type: "circle" },
      inputHandles: [{ id: "b-in-1", label: "in", angle: 180 }],
      attrs: { kind: "consumer" },
    },
  },
];

const initialEdges: Edge[] = [];

function downloadBlob(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [nodes, setNodes, onNodesChange] =
    useNodesState<ComponentNodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selected, setSelected] = useState<Selected>({ nodes: [], edges: [] });
  const [attrKey, setAttrKey] = useState("");
  const [attrValue, setAttrValue] = useState("");
  const [serverInfo, setServerInfo] = useState<string>("");
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [carrierHandleAngles, setCarrierHandleAngles] = useState<Record<string, Record<string, number>>>({});
  const nodesRef = useRef(nodes);

  // Load state on first mount
  useEffect(() => {
    const loaded = loadState();
    if (loaded) {
      setNodes(loaded.nodes);
      setEdges(loaded.edges);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save on change
  useEffect(() => {
    saveState({ nodes, edges });
  }, [nodes, edges]);

  // Keep nodesRef current
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Fetch server info once on load
  useEffect(() => {
    fetchServerInfo()
      .then((data) => setServerInfo(JSON.stringify(data)))
      .catch(() => setServerInfo("Unavailable"));
  }, []);

  // Simplified handle update functions
  const handleHandleUpdate = useCallback((nodeId: string, handleId: string, newAngle: number) => {
    setNodes(nodes =>
      nodes.map(n =>
        n.id === nodeId && n.type === 'component'
          ? {
              ...n,
              data: {
                ...n.data,
                inputHandles: n.data.inputHandles?.map(h =>
                  h.id === handleId ? { ...h, angle: newAngle } : h
                ),
                outputHandles: n.data.outputHandles?.map(h =>
                  h.id === handleId ? { ...h, angle: newAngle } : h
                )
              }
            }
          : n
      )
    );
  }, [setNodes]);

  const handleNodeDragStop = useCallback((event: React.MouseEvent<HTMLDivElement>, node: Node) => {
    const cleanedNodes = nodes.map(n => ({
      ...n,
      data: {}, // se limpia data
      position: n.position ? { ...n.position } : undefined // copia defensiva de position
    }));

    // onNodesChanged?.(cleanedNodes); // Commented out as onNodesChanged is not defined
  }, [nodes]);

  const handleHandleDragStop = useCallback((nodeId: string, handleId: string, finalAngle: number) => {
    // Actualiza la representación visual del handle
    handleHandleUpdate(nodeId, handleId, finalAngle);

    // Persiste la configuración del ángulo
    setCarrierHandleAngles(prev => {
      const updated = {
        ...prev,
        [nodeId]: {
          ...(prev[nodeId] || {}),
          [handleId]: finalAngle
        }
      };
      // onNetConfigChange?.('initialCarrierHandleAngles', updated); // Commented out as onNetConfigChange is not defined
      return updated;
    });

    const currentNodes = nodesRef.current; 
    
    const cleanedNodes = currentNodes.map(n => ({
      ...n,
      data: {}, // se limpia data
      position: n.position ? { ...n.position } : undefined // copia defensiva
    }));

    // onNodesChanged?.(cleanedNodes); // Commented out as onNodesChanged is not defined
  }, [handleHandleUpdate, setCarrierHandleAngles]);

  // Add callback functions to all nodes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onHandleUpdate: handleHandleUpdate,
          onHandleDragStop: handleHandleDragStop,
        },
      }))
    );
  }, [handleHandleUpdate, handleHandleDragStop]);

  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge(c, eds)),
    [setEdges],
  );

  const addNode = () => {
    const id = `N${Date.now().toString(36)}`;
    setNodes((nds) =>
      nds.concat({
        id,
        type: "component",
        position: { x: 200 + Math.random() * 80, y: 120 + Math.random() * 140 },
        data: {
          title: "Node",
          shape: { type: "polygon", sides: 6 },
          inputHandles: [{ id: id + "-in", angle: 180 }],
          outputHandles: [{ id: id + "-out", angle: 0 }],
          attrs: {},
          onHandleUpdate: handleHandleUpdate,
          onHandleDragStop: handleHandleDragStop,
        },
      }),
    );
  };

  const addImageNode = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const id = `IMG${Date.now().toString(36)}`;
      setNodes((nds) =>
        nds.concat({
          id,
          type: "component",
          position: {
            x: 260 + Math.random() * 80,
            y: 160 + Math.random() * 140,
          },
          data: {
            title: file.name,
            imageSrc: dataUrl,
            shape: { type: "polygon", sides: 6 },
            inputHandles: [{ id: id + "-in", angle: 180 }],
            outputHandles: [{ id: id + "-out", angle: 0 }],
            attrs: { file: file.name },
            onHandleUpdate: handleHandleUpdate,
            onHandleDragStop: handleHandleDragStop,
          },
        }),
      );
    };
    reader.readAsDataURL(file);
  };

  const addImageNodeFromUrl = (src: string, label: string) => {
    const id = `IMG${Date.now().toString(36)}`;
    setNodes((nds) =>
      nds.concat({
        id,
        type: "component",
        position: {
          x: 260 + Math.random() * 80,
          y: 160 + Math.random() * 140,
        },
        data: {
          title: label,
          imageSrc: src,
          shape: { type: "polygon", sides: 6 },
          inputHandles: [{ id: id + "-in", angle: 180 }],
          outputHandles: [{ id: id + "-out", angle: 0 }],
          attrs: {},
          onHandleUpdate: handleHandleUpdate,
          onHandleDragStop: handleHandleDragStop,
        },
      }),
    );
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const onSelectionChange = useCallback(
    ({ nodes: ns, edges: es }: OnSelectionChangeParams) => {
      setSelected({ nodes: ns as Node<ComponentNodeData>[], edges: es });
    },
    [],
  );

  // Dimming behavior for unrelated elements when something is selected
  useEffect(() => {
    const selectedIds = new Set(selected.nodes.map((n) => n.id));
    const relatedIds = new Set<string>();
    selected.nodes.forEach((n) => relatedIds.add(n.id));
    edges.forEach((e) => {
      if (selectedIds.has(e.source) || selectedIds.has(e.target)) {
        relatedIds.add(e.source);
        relatedIds.add(e.target);
      }
    });

    setNodes((nds) =>
      nds.map((n) => {
        const isRelated = relatedIds.size > 0 ? relatedIds.has(n.id) : true;
        const opacity = relatedIds.size > 0 && !isRelated ? 0.25 : 1;
        return { ...n, style: { ...(n.style || {}), opacity } };
      }),
    );

    setEdges((eds) =>
      eds.map((e) => {
        const isRelated =
          relatedIds.size > 0 &&
          relatedIds.has(e.source) &&
          relatedIds.has(e.target);
        const opacity = relatedIds.size > 0 && !isRelated ? 0.25 : 1;
        return { ...e, style: { ...(e.style || {}), opacity } };
      }),
    );
  }, [selected, setNodes, setEdges, edges]);

  const selectedNode: Node<ComponentNodeData> | null =
    selected.nodes.length === 1 ? selected.nodes[0] : null;

  const addAttr = () => {
    if (!selectedNode || !attrKey) return;
    const id = selectedNode.id;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== id) return n;
        const attrs: Attrs = { ...(n.data?.attrs || {}) };
        attrs[attrKey] = attrValue;
        return { ...n, data: { ...(n.data || {}), attrs } };
      }),
    );
    setAttrKey("");
    setAttrValue("");
  };

  const removeAttr = (k: string) => {
    if (!selectedNode) return;
    const id = selectedNode.id;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== id) return n;
        const attrs: Attrs = { ...(n.data?.attrs || {}) };
        delete attrs[k];
        return { ...n, data: { ...(n.data || {}), attrs } };
      }),
    );
  };

  const saveJSON = () =>
    downloadBlob(
      "hyflow_state.json",
      JSON.stringify({ nodes, edges }, null, 2),
    );

  const importJSON = (file: File) => {
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const parsed = JSON.parse(rd.result as string) as SavedState;
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
      } catch (e) {
        alert("Invalid JSON");
      }
    };
    rd.readAsText(file);
  };

  const clearAll = () => {
    clearState();
    setNodes([]);
    setEdges([]);
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">HyFlowDashboard</div>
        <div className="actions">
          <span className="server-info">
            {serverInfo ? `Server: ${serverInfo}` : "Server: ..."}
          </span>
          <button onClick={addNode}>+ Node</button>
          <button onClick={() => fileInputRef.current?.click()}>
            + Image Node
          </button>
          <button onClick={() => setShowImageSearch((s) => !s)}>
            Search Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) addImageNode(f);
              e.currentTarget.value = "";
            }}
          />
          <button onClick={saveJSON}>Export JSON</button>
          <button onClick={() => importRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJSON(f);
              e.currentTarget.value = "";
            }}
          />
          <button onClick={clearAll}>Clear</button>
        </div>
      </header>

      {showImageSearch && (
        <ImageSearch
          onSelect={(url, label) => {
            addImageNodeFromUrl(url, label);
            setShowImageSearch(false);
          }}
        />
      )}

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
          <EdgeConfigurator
            nodes={nodes}
            onAddEdge={(edge) => setEdges((eds) => eds.concat(edge))}
          />
          {selectedNode ? (
            <>
              <div className="field">
                <label>Title</label>
                <input
                  value={selectedNode.data?.title ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setNodes((nds) =>
                      nds.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, data: { ...(n.data || {}), title: v } }
                          : n,
                      ),
                    );
                  }}
                />
              </div>

              <div className="field">
                <label>Shape</label>
                <div className="row">
                  <select
                    value={selectedNode.data?.shape?.type || "polygon"}
                    onChange={(e) => {
                      const type = e.target.value as "circle" | "polygon";
                      setNodes((nds) =>
                        nds.map((n) => {
                          if (n.id !== selectedNode.id) return n;
                          const shape: NodeShape =
                            type === "circle"
                              ? { type: "circle" }
                              : {
                                  type: "polygon",
                                  sides:
                                    n.data?.shape?.type === "polygon"
                                      ? n.data.shape.sides
                                      : 6,
                                };
                          return { ...n, data: { ...(n.data || {}), shape } };
                        }),
                      );
                    }}
                  >
                    <option value="circle">Circle</option>
                    <option value="polygon">Polygon</option>
                  </select>
                  {(selectedNode.data?.shape?.type || "polygon") ===
                    "polygon" && (
                    <input
                      type="number"
                      min={3}
                      value={
                        selectedNode.data?.shape?.type === "polygon"
                          ? selectedNode.data.shape.sides
                          : 6
                      }
                      onChange={(e) => {
                        const sides = Math.max(
                          3,
                          parseInt(e.target.value) || 3,
                        );
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === selectedNode.id
                              ? {
                                  ...n,
                                  data: {
                                    ...(n.data || {}),
                                    shape: { type: "polygon", sides },
                                  },
                                }
                              : n,
                          ),
                        );
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="field">
                <label>Add attribute</label>
                <div className="row">
                  <input
                    placeholder="key"
                    value={attrKey}
                    onChange={(e) => setAttrKey(e.target.value)}
                  />
                  <input
                    placeholder="value"
                    value={attrValue}
                    onChange={(e) => setAttrValue(e.target.value)}
                  />
                  <button onClick={addAttr}>Add</button>
                </div>
              </div>

              <div className="attrs-list">
                <h4>Attributes</h4>
                <ul>
                  {Object.entries(selectedNode.data?.attrs || {}).map(
                    ([k, v]) => (
                      <li key={k}>
                        <strong>{k}:</strong> {v}{" "}
                        <button onClick={() => removeAttr(k)}>x</button>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div className="handles">
                <h4>Ports</h4>
                <p style={{fontSize: '12px', color: '#666', margin: '4px 0'}}>
                  Tip: Ctrl+click and drag handles to reposition them
                </p>
                <div className="row">
                  <button
                    onClick={() => {
                      const id =
                        selectedNode.id +
                        "-in-" +
                        Math.random().toString(36).slice(2, 6);
                      setNodes((nds) =>
                        nds.map((n) => {
                          if (n.id !== selectedNode.id) return n;
                          const inputHandles = [
                            ...(n.data?.inputHandles || []),
                            { id, angle: 180 },
                          ];
                          return {
                            ...n,
                            data: { ...(n.data || {}), inputHandles },
                          };
                        }),
                      );
                    }}
                  >
                    + Input
                  </button>
                  <button
                    onClick={() => {
                      const id =
                        selectedNode.id +
                        "-out-" +
                        Math.random().toString(36).slice(2, 6);
                      setNodes((nds) =>
                        nds.map((n) => {
                          if (n.id !== selectedNode.id) return n;
                          const outputHandles = [
                            ...(n.data?.outputHandles || []),
                            { id, angle: 0 },
                          ];
                          return {
                            ...n,
                            data: { ...(n.data || {}), outputHandles },
                          };
                        }),
                      );
                    }}
                  >
                    + Output
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p>Select one node to edit.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
