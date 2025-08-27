import React, { useState } from "react";
import { Edge, MarkerType, Node } from "reactflow";
import type { ComponentNodeData, EdgeType } from "../types";

interface EdgeConfiguratorProps {
  nodes: Node<ComponentNodeData>[];
  onAddEdge: (edge: Edge) => void;
}

const EdgeConfigurator: React.FC<EdgeConfiguratorProps> = ({
  nodes,
  onAddEdge,
}) => {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#555555");
  const [width, setWidth] = useState(2);
  const [dash, setDash] = useState("4 2");
  const [type, setType] = useState<EdgeType>("smoothstep");
  const [animated, setAnimated] = useState(false);

  const add = () => {
    if (!source || !target) return;
    const id = `${source}-${target}-${Date.now().toString(36)}`;
    const edge: Edge = {
      id,
      source,
      target,
      label,
      animated,
      type,
      style: {
        stroke: color,
        strokeWidth: width,
        strokeDasharray: dash,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
        width: 10,
        height: 10,
      },
      labelStyle: { fill: color, fontWeight: 500, fontSize: "8px" },
    };
    onAddEdge(edge);
    setSource("");
    setTarget("");
    setLabel("");
  };

  return (
    <div>
      <h4>Agregar arista</h4>
      <div className="field">
        <label>Source</label>
        <select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">Seleccione</option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.data?.title || n.id}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Target</label>
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">Seleccione</option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.data?.title || n.id}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Label</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <div className="field">
        <label>Color</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Grosor</label>
        <input
          type="number"
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
        />
      </div>
      <div className="field">
        <label>Dash</label>
        <input value={dash} onChange={(e) => setDash(e.target.value)} />
      </div>
      <div className="field">
        <label>Tipo</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as EdgeType)}
        >
          <option value="smoothstep">smoothstep</option>
          <option value="default">default</option>
          <option value="straight">straight</option>
          <option value="step">step</option>
          <option value="simplebezier">simplebezier</option>
        </select>
      </div>
      <div className="field">
        <label>
          <input
            type="checkbox"
            checked={animated}
            onChange={(e) => setAnimated(e.target.checked)}
          />
          Animada
        </label>
      </div>
      <button onClick={add}>Crear Arista</button>
    </div>
  );
};

export default EdgeConfigurator;
