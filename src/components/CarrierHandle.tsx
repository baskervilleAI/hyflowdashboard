import React, {
  useRef,
  useCallback,
  useMemo,
  useEffect,
  useState,
} from "react";
import { Handle } from "reactflow";

import {
  CarrierHandleProps,
  angleToPointOnPolygon,
  projectToAngleOnPolygon,
  angleToLogicalPosition,
} from "../helpers/net.helper";

const CarrierHandle: React.FC<CarrierHandleProps> = ({
  id,
  type,
  angle,
  onUpdate,
  onDragStop,
  color = "#555",
  opacity = 1,
}) => {
  const handleRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // --- SOLUTION 1: Use refs to store mutable state ---
  const stateRef = useRef({
    isDragging: false,
    lastAngle: angle,
    onUpdate,
    onDragStop,
  });

  useEffect(() => {
    stateRef.current.onUpdate = onUpdate;
    stateRef.current.onDragStop = onDragStop;
  }, [onUpdate, onDragStop]);

  useEffect(() => {
    stateRef.current.lastAngle = angle;
  }, [angle]);

  const position = useMemo(() => angleToPointOnPolygon(angle), [angle]);
  const logicalPosition = useMemo(() => angleToLogicalPosition(angle), [angle]);

  const handleMouseUp = useCallback(() => {
    if (stateRef.current.isDragging) {
      setIsDragging(false);
      stateRef.current.isDragging = false;
      stateRef.current.onDragStop?.(id, stateRef.current.lastAngle);
    }
  }, [id]);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!stateRef.current.isDragging || !nodeRef.current) return;

      const nodeRect = nodeRef.current.getBoundingClientRect();
      const localX = event.clientX - nodeRect.left;
      const localY = event.clientY - nodeRect.top;
      const newAngle = projectToAngleOnPolygon(localX, localY);

      stateRef.current.lastAngle = newAngle;
      stateRef.current.onUpdate(id, newAngle);
    },
    [id],
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      nodeRef.current = handleRef.current?.closest(
        ".react-flow__node",
      ) as HTMLDivElement;
      if (!nodeRef.current) {
        console.error("Unable to locate parent node (.react-flow__node)");
        return;
      }

      setIsDragging(true);
      stateRef.current.isDragging = true;

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <Handle
      ref={handleRef}
      id={id}
      type={type}
      position={logicalPosition}
      onMouseDown={handleMouseDown}
      title="Drag to reposition this connector"
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -50%)",
        width: 7,
        height: 7,
        backgroundColor: color,
        opacity,
        cursor: isDragging ? "grabbing" : "move",
        zIndex: 20,
      }}
    />
  );
};

export default CarrierHandle;
