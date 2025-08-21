import { Position } from "reactflow";

// Basic polygon geometry helpers for handle positioning
export const NODE_CENTER = { x: 0, y: 0 };

// Default square polygon around the node centre
export const POLYGON_VERTICES = [
  { x: -25, y: -25 },
  { x: 25, y: -25 },
  { x: 25, y: 25 },
  { x: -25, y: 25 },
];

export const EDGE_PADDING_RATIO = 0.1;

export interface CarrierHandleProps {
  id: string;
  type: "source" | "target";
  angle: number;
  onUpdate: (id: string, angle: number) => void;
  onDragStop?: (id: string, angle: number) => void;
  color?: string;
  opacity?: number;
}

// --- Geometry Functions ---
// Convert an angle to a point on a polygon approximated circle
export function angleToPointOnPolygon(angle: number): { x: number; y: number } {
  const RADIUS = 25; // adjust according to polygon or node size
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

export function angleToLogicalPosition(angle: number): Position {
  const deg = (angle * 180) / Math.PI;
  if (deg >= 315 || deg < 45) return Position.Right;
  if (deg >= 45 && deg < 135) return Position.Bottom;
  if (deg >= 135 && deg < 225) return Position.Left;
  return Position.Top;
}

export function getAngleForSide(
  sideIndex: number,
  indexOnSide: number,
  totalOnSide: number,
): number {
  const v1 = POLYGON_VERTICES[sideIndex];
  const v2 = POLYGON_VERTICES[(sideIndex + 1) % POLYGON_VERTICES.length];
  let ratio: number = 0.5;
  if (totalOnSide > 1) {
    const availableRange = 1.0 - 2 * EDGE_PADDING_RATIO;
    const step = availableRange / (totalOnSide - 1);
    ratio = EDGE_PADDING_RATIO + indexOnSide * step;
  }
  const x = v1.x + ratio * (v2.x - v1.x);
  const y = v1.y + ratio * (v2.y - v1.y);
  const dx = x - NODE_CENTER.x;
  const dy = y - NODE_CENTER.y;
  let angle = Math.atan2(dy, dx);
  if (angle < 0) angle += 2 * Math.PI;
  return angle;
}
