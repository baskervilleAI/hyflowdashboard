import { Position } from "reactflow";
import { NodeShape } from "../types";

// --- Geometry Constants ---
export const NODE_WIDTH = 50;
export const NODE_HEIGHT = 50;
export const NODE_CENTER = { x: NODE_WIDTH / 2, y: NODE_HEIGHT / 2 };
export const POLYGON_VERTICES = [
    { x: 0.50 * NODE_WIDTH, y: 0.00 * NODE_HEIGHT }, { x: 0.95 * NODE_WIDTH, y: 0.25 * NODE_HEIGHT },
    { x: 0.95 * NODE_WIDTH, y: 0.75 * NODE_HEIGHT }, { x: 0.50 * NODE_WIDTH, y: 1.00 * NODE_HEIGHT },
    { x: 0.05 * NODE_WIDTH, y: 0.75 * NODE_HEIGHT }, { x: 0.05 * NODE_WIDTH, y: 0.25 * NODE_HEIGHT },
];
export const EDGE_PADDING_RATIO = 0.15;

export const DIMMED_OPACITY = 0.4;
export const FULL_OPACITY = 1;

// --- Merged Handle Information Interface ---
// This is the single source of truth for a handle's data and visual properties.
export interface HandleInfo {
    id: string;           // Unique ID for the handle (e.g., "output-nodeA-electricity")
    name: string;         // The underlying commodity or carrier name (e.g., "electricity")
    description?: string; // Tooltip or extra info
    factor?: number;      // e.g., commodity_factor

    // Visual & Positional Properties
    type: 'source' | 'target';
    color?: string;       // Color for the handle and connecting edge
    opacity?: number;
    side?: number;        // Default side for initial placement (0-5)
    angle?: number;       // The precise position in radians, can be overridden by user dragging
}

export interface CarrierHandleProps {
  id: string;
  type: "source" | "target";
  angle: number;
  shape: NodeShape;
  onUpdate: (id: string, angle: number) => void;
  onDragStop?: (id: string, angle: number) => void;
  color?: string;
  opacity?: number;
}

// --- Geometry Functions ---
export function angleToPointOnPolygon(angle: number): { x: number; y: number } {
    const RADIUS = 25; // Puedes ajustar esto según el tamaño de tu polígono o nodo
    return {
        x: NODE_CENTER.x + RADIUS * Math.cos(angle),
        y: NODE_CENTER.y + RADIUS * Math.sin(angle),
    };
}

export function projectToAngleOnPolygon(x: number, y: number): number {
    const dx = x - NODE_CENTER.x;
    const dy = y - NODE_CENTER.y;
    const rayDir = { x: dx, y: dy };
    const len = Math.hypot(rayDir.x, rayDir.y);
    if (len === 0) return 0;
    rayDir.x /= len;
    rayDir.y /= len;

    let closestT = Infinity;
    let found = false;
    let intersection = { x: 0, y: 0 };

    for (let i = 0; i < POLYGON_VERTICES.length; i++) {
        const v1 = POLYGON_VERTICES[i];
        const v2 = POLYGON_VERTICES[(i + 1) % POLYGON_VERTICES.length];
        const edgeDir = { x: v2.x - v1.x, y: v2.y - v1.y };

        const det = rayDir.x * edgeDir.y - rayDir.y * edgeDir.x;
        if (Math.abs(det) < 1e-6) continue;

        const dx = v1.x - NODE_CENTER.x;
        const dy = v1.y - NODE_CENTER.y;

        const t = (dx * edgeDir.y - dy * edgeDir.x) / det;
        const u = (dx * rayDir.y - dy * rayDir.x) / det;

        if (t >= 0 && u >= 0 && u <= 1 && t < closestT) {
            closestT = t;
            intersection = {
                x: NODE_CENTER.x + t * rayDir.x,
                y: NODE_CENTER.y + t * rayDir.y,
            };
            found = true;
        }
    }

    if (!found) {
        return 0; // fallback
    }

    const finalDx = intersection.x - NODE_CENTER.x;
    const finalDy = intersection.y - NODE_CENTER.y;
    let angle = Math.atan2(finalDy, finalDx);
    if (angle < 0) angle += 2 * Math.PI;
    return angle;
}

// Generate vertices for different polygon types based on NodeShape
export function generatePolygonVertices(shape: NodeShape): { x: number; y: number }[] {
  if (shape.type === "circle") {
    // For circle, generate a high-resolution polygon
    const sides = 32;
    const radius = Math.min(NODE_WIDTH, NODE_HEIGHT) / 2;
    const vertices: { x: number; y: number }[] = [];
    const step = (2 * Math.PI) / sides;
    for (let i = 0; i < sides; i++) {
      const angle = -Math.PI / 2 + i * step;
      vertices.push({
        x: NODE_CENTER.x + radius * Math.cos(angle),
        y: NODE_CENTER.y + radius * Math.sin(angle),
      });
    }
    return vertices;
  } else {
    // For polygon, generate vertices based on sides
    const sides = shape.sides;
    const radius = Math.min(NODE_WIDTH, NODE_HEIGHT) / 2;
    const vertices: { x: number; y: number }[] = [];
    const step = (2 * Math.PI) / sides;
    for (let i = 0; i < sides; i++) {
      const angle = -Math.PI / 2 + i * step;
      vertices.push({
        x: NODE_CENTER.x + radius * Math.cos(angle),
        y: NODE_CENTER.y + radius * Math.sin(angle),
      });
    }
    return vertices;
  }
}

// Convert an angle to a point on the shape boundary
export function angleToPointOnShape(angle: number, shape: NodeShape): { x: number; y: number } {
  if (shape.type === "circle") {
    const radius = Math.min(NODE_WIDTH, NODE_HEIGHT) / 2;
    return {
      x: NODE_CENTER.x + radius * Math.cos(angle),
      y: NODE_CENTER.y + radius * Math.sin(angle),
    };
  }
  
  const dir = { x: Math.cos(angle), y: Math.sin(angle) };
  const vertices = generatePolygonVertices(shape);

  let closestT = Infinity;
  let point = { x: 0, y: 0 };
  let found = false;

  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    const edgeDir = { x: v2.x - v1.x, y: v2.y - v1.y };

    const det = dir.x * edgeDir.y - dir.y * edgeDir.x;
    if (Math.abs(det) < 1e-6) continue;

    const dx = v1.x - NODE_CENTER.x;
    const dy = v1.y - NODE_CENTER.y;

    const t = (dx * edgeDir.y - dy * edgeDir.x) / det;
    const u = (dx * dir.y - dy * dir.x) / det;

    if (t >= 0 && u >= 0 && u <= 1 && t < closestT) {
      closestT = t;
      point = {
        x: NODE_CENTER.x + t * dir.x,
        y: NODE_CENTER.y + t * dir.y,
      };
      found = true;
    }
  }
  
  if (!found) {
    // Fallback to circle approximation
    const radius = Math.min(NODE_WIDTH, NODE_HEIGHT) / 2;
    return {
      x: NODE_CENTER.x + radius * Math.cos(angle),
      y: NODE_CENTER.y + radius * Math.sin(angle),
    };
  }
  
  return point;
}

// Project a point to the closest angle on the shape boundary
export function projectToAngleOnShape(x: number, y: number, shape: NodeShape): number {
  if (shape.type === "circle") {
    const dx = x - NODE_CENTER.x;
    const dy = y - NODE_CENTER.y;
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI;
    return angle;
  }

  const dx = x - NODE_CENTER.x;
  const dy = y - NODE_CENTER.y;
  const rayDir = { x: dx, y: dy };
  const len = Math.hypot(rayDir.x, rayDir.y);
  if (len === 0) return 0;
  rayDir.x /= len;
  rayDir.y /= len;

  const vertices = generatePolygonVertices(shape);

  let closestT = Infinity;
  let intersection = { x: 0, y: 0 };
  let found = false;

  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];
    const edgeDir = { x: v2.x - v1.x, y: v2.y - v1.y };

    const det = rayDir.x * edgeDir.y - rayDir.y * edgeDir.x;
    if (Math.abs(det) < 1e-6) continue;

    const dx = v1.x - NODE_CENTER.x;
    const dy = v1.y - NODE_CENTER.y;

    const t = (dx * edgeDir.y - dy * edgeDir.x) / det;
    const u = (dx * rayDir.y - dy * rayDir.x) / det;

    if (t >= 0 && u >= 0 && u <= 1 && t < closestT) {
      closestT = t;
      intersection = {
        x: NODE_CENTER.x + t * rayDir.x,
        y: NODE_CENTER.y + t * rayDir.y,
      };
      found = true;
    }
  }

  if (!found) {
    // Fallback to simple angle calculation
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI;
    return angle;
  }

  const finalDx = intersection.x - NODE_CENTER.x;
  const finalDy = intersection.y - NODE_CENTER.y;
  let angle = Math.atan2(finalDy, finalDx);
  if (angle < 0) angle += 2 * Math.PI;
  return angle;
}

export function angleToLogicalPosition(angle: number): Position {
  const deg = (angle * 180) / Math.PI;
  if (deg >= 315 || deg < 45) return Position.Right;
  if (deg >= 45 && deg < 135) return Position.Bottom;
  if (deg >= 135 && deg < 225) return Position.Left;
  return Position.Top;
}

export function getAngleForSide(sideIndex: number, indexOnSide: number, totalOnSide: number, shape: NodeShape): number {
  if (shape.type === "circle") {
    const step = (2 * Math.PI) / totalOnSide;
    return indexOnSide * step;
  }

  const vertices = generatePolygonVertices(shape);
  const v1 = vertices[sideIndex % vertices.length];
  const v2 = vertices[(sideIndex + 1) % vertices.length];
  let ratio: number = 0.5;
  if (totalOnSide > 1) {
    const availableRange = 1.0 - (2 * EDGE_PADDING_RATIO);
    const step = availableRange / (totalOnSide - 1);
    ratio = EDGE_PADDING_RATIO + (indexOnSide * step);
  }
  const x = v1.x + ratio * (v2.x - v1.x);
  const y = v1.y + ratio * (v2.y - v1.y);
  const dx = x - NODE_CENTER.x;
  const dy = y - NODE_CENTER.y;
  let angle = Math.atan2(dy, dx);
  if (angle < 0) angle += 2 * Math.PI;
  return angle;
}

// Build CSS clip-path for a given shape
export function clipPathForShape(shape: NodeShape): string {
  if (shape.type === "circle") {
    return "circle(50%)";
  }
  const sides = shape.sides;
  const step = (2 * Math.PI) / sides;
  const points: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = -Math.PI / 2 + i * step;
    const x = 50 + 50 * Math.cos(angle);
    const y = 50 + 50 * Math.sin(angle);
    points.push(`${x}% ${y}%`);
  }
  return `polygon(${points.join(", ")})`;
}
