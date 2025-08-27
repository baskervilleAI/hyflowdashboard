import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  Position,
  NodeProps,
  NodeToolbar,
  useReactFlow,
  useUpdateNodeInternals,
} from "reactflow";
import UnitWithExponent from "./UnitWithExponent";
import styles from "./componentNode.module.scss";
import EyeIcon from "./EyeIcon";
import CarrierHandle from "./CarrierHandle";
import { ComponentNodeData, HandleInfo, NodeShape } from "../types";
import {
  DIMMED_OPACITY,
  FULL_OPACITY,
  clipPathForShape,
} from "../helpers/net.helper";

type ComponentNodeProps = NodeProps<ComponentNodeData>;

const ComponentNode: React.FC<ComponentNodeProps> = ({
  data,
  selected,
  dragging,
  id: nodeId,
}) => {
  const {
    name,
    _originalName,
    imageSrc,
    inputHandles = [],
    outputHandles = [],
    input_info,
    table_values,
    pin_info = [],
    view,
    isNodeToolbar,
    fadde,
    shape = { type: "polygon", sides: 6 } as NodeShape,
    onHandleUpdate,
    onHandleDragStop,
  } = data;

  const { setNodes, getNodes } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);

  const getDisplayValues = useMemo(() => {
    return view === "results" ? table_values || {} : input_info || {};
  }, [view, table_values, input_info]);

  const [pinnedAttributes, setPinnedAttributes] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const initialPins: Record<string, boolean> = {};
    Object.keys(getDisplayValues).forEach((key) => {
      initialPins[key] = pin_info.includes(key);
    });
    setPinnedAttributes(initialPins);
  }, [pin_info, getDisplayValues]);

  const togglePinAttribute = useCallback(
    (key: string) => {
      setPinnedAttributes((prev) => {
        const newState = { ...prev, [key]: !prev[key] };
        const newPinList = Object.entries(newState)
          .filter(([, pinned]) => pinned)
          .map(([k]) => k);

        const updatedNodes = getNodes().map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              data: {
                ...n.data,
                pin_info: newPinList,
              },
            };
          }
          return n;
        });

        setNodes(updatedNodes);
        return newState;
      });
    },
    [getNodes, setNodes, nodeId],
  );

  const handleUpdateFromChild = useCallback(
    (handleId: string, newAngle: number) => {
      onHandleUpdate?.(nodeId, handleId, newAngle);
      updateNodeInternals(nodeId);
    },
    [nodeId, onHandleUpdate, updateNodeInternals],
  );

  const handleDragStopFromChild = useCallback(
    (handleId: string, finalAngle: number) => {
      onHandleDragStop?.(nodeId, handleId, finalAngle);
    },
    [nodeId, onHandleDragStop],
  );

  const clipPath = useMemo(() => clipPathForShape(shape), [shape]);

  useEffect(() => {
    updateNodeInternals(nodeId);
  }, [shape, nodeId, updateNodeInternals]);

  const allHandlesToRender = useMemo(() => {
    const processHandles = (
      handles: HandleInfo[],
      type: "source" | "target",
    ) => {
      return handles.map((h) => ({
        ...h,
        type,
        angle: h.angle!,
        color: h.color || "#555",
      }));
    };
    return [
      ...processHandles(inputHandles, "target"),
      ...processHandles(outputHandles, "source"),
    ];
  }, [inputHandles, outputHandles]);

  const hasValues = Object.keys(getDisplayValues).length > 0;

  const handleMouseEnter = () => {
    setShowToolbar(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowToolbar(false);
      timeoutRef.current = null;
    }, 50);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className={styles["component-node"]}
      style={{
        opacity:
          fadde && !selected && view === "results"
            ? DIMMED_OPACITY
            : FULL_OPACITY,
      }}
    >
      <div
        className={`${styles["node-visual-wrapper"]} ${selected ? styles["selected"] : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-visual-wrapper="true"
        title={view === "edit" ? "Doble click to edit data" : undefined}
      >
        <div className={styles["component-background"]} style={{ clipPath }}>
          {imageSrc && (
            <img
              src={imageSrc}
              alt={name}
              className={styles["component-image"]}
            />
          )}
        </div>

        {allHandlesToRender.map((handle) => (
          <CarrierHandle
            key={handle.id}
            id={handle.id}
            type={handle.type as "source" | "target"}
            angle={handle.angle}
            onUpdate={handleUpdateFromChild}
            onDragStop={handleDragStopFromChild}
            color={handle.color}
            opacity={handle.opacity}
            shape={shape}
          />
        ))}

        {hasValues && (
          <NodeToolbar
            position={Position.Right}
            className={`${styles.nodeToolbar} nowheel`}
            isVisible={showToolbar && isNodeToolbar && !dragging}
          >
            <div className={styles.toolbarContent}>
              <table>
                <thead>
                  <tr className={styles.originalNameRow}>
                    <th colSpan={3}>{_originalName}</th>
                  </tr>
                  <tr>
                    <th>Attribute</th>
                    <th>Value</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(getDisplayValues).map(([key, val]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>
                        <UnitWithExponent unit={String(val)} />
                      </td>
                      <td className={styles.pinCell}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePinAttribute(key);
                          }}
                          className={`${styles.pinButton} ${
                            pinnedAttributes[key] ? styles.pinned : ""
                          }`}
                          title={pinnedAttributes[key] ? "Unpin" : "Pin"}
                        >
                          <EyeIcon isPinned={!!pinnedAttributes[key]} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </NodeToolbar>
        )}
      </div>

      <div className={styles["node-info-container"]}>
        <div className={styles["component-text"]}>{name}</div>
        <div className={styles.pinnedAttributesContainer}>
          {Object.entries(pinnedAttributes)
            .filter(
              ([k, pinned]) => pinned && getDisplayValues[k] !== undefined,
            )
            .map(([k]) => (
              <div key={`pinned-${k}`} className={styles.pinnedAttribute}>
                <span className={styles.pinnedKey}>{k}: </span>
                <UnitWithExponent unit={String(getDisplayValues[k])} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ComponentNode;
