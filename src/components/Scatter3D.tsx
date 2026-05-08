import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { AREA_COLOR } from "../lib/palette";
import type { EmbeddingsPayload } from "../lib/types";

interface Props {
  payload: EmbeddingsPayload;
  visibleIdx: Set<number>;
  selectedIdx: number | null;
  hoveredIdx: number | null;
  onHover: (idx: number | null) => void;
  onSelect: (idx: number | null) => void;
}

export default function Scatter3D(props: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; idx: number } | null>(
    null,
  );

  return (
    <>
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [2.6, 2.0, 2.6], fov: 50 }}
        onPointerMissed={() => props.onSelect(null)}
      >
        <PerspectiveCamera makeDefault position={[2.6, 2.0, 2.6]} fov={50} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[5, 7, 4]} intensity={0.9} />
        <directionalLight position={[-3, -2, -4]} intensity={0.35} />
        <Points
          {...props}
          onTooltipChange={(t) => setTooltip(t)}
        />
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
          zoomSpeed={0.6}
          minDistance={1.2}
          maxDistance={8}
        />
      </Canvas>
      {tooltip && <Tooltip {...tooltip} payload={props.payload} />}
    </>
  );
}

interface PointsProps extends Props {
  onTooltipChange: (t: { x: number; y: number; idx: number } | null) => void;
}

function Points({
  payload,
  visibleIdx,
  selectedIdx,
  hoveredIdx,
  onHover,
  onSelect,
  onTooltipChange,
}: PointsProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const baseColors = useMemo(() => {
    const arr = new Float32Array(payload.terms.length * 3);
    const c = new THREE.Color();
    for (let i = 0; i < payload.terms.length; i++) {
      const term = payload.terms[i];
      c.set(AREA_COLOR[term.area] ?? "#888");
      arr[i * 3 + 0] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, [payload]);

  // Apply per-instance transforms when filters/selection change.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const baseScale = 0.022;
    const selectedScale = 0.045;
    const hoveredScale = 0.038;

    for (let i = 0; i < payload.terms.length; i++) {
      const t = payload.terms[i];
      const visible = visibleIdx.has(i);
      const selected = selectedIdx === i;
      const hovered = hoveredIdx === i;
      const scale = visible
        ? selected
          ? selectedScale
          : hovered
            ? hoveredScale
            : baseScale
        : 0.0001;

      dummy.position.set(t.pos[0], t.pos[1], t.pos[2]);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [payload, visibleIdx, selectedIdx, hoveredIdx, dummy]);

  // Apply per-instance colors (dim filtered-out, brighten selected).
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !mesh.instanceColor) return;
    const tmp = new THREE.Color();
    for (let i = 0; i < payload.terms.length; i++) {
      const visible = visibleIdx.has(i);
      const r = baseColors[i * 3 + 0];
      const g = baseColors[i * 3 + 1];
      const b = baseColors[i * 3 + 2];
      if (!visible) {
        tmp.setRGB(r * 0.2, g * 0.2, b * 0.2);
      } else if (selectedIdx === i || hoveredIdx === i) {
        tmp.setRGB(Math.min(1, r * 1.4), Math.min(1, g * 1.4), Math.min(1, b * 1.4));
      } else {
        tmp.setRGB(r, g, b);
      }
      mesh.setColorAt(i, tmp);
    }
    mesh.instanceColor.needsUpdate = true;
  }, [payload, visibleIdx, selectedIdx, hoveredIdx, baseColors]);

  // Subtle auto-rotation; pause once user interacts (handled by OrbitControls.enableDamping).
  useFrame((state) => {
    if (state.controls && (state.controls as { active?: boolean }).active) return;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, payload.terms.length]}
      onPointerMove={(e) => {
        e.stopPropagation();
        const idx = e.instanceId;
        if (idx === undefined || !visibleIdx.has(idx)) {
          onHover(null);
          onTooltipChange(null);
          return;
        }
        onHover(idx);
        onTooltipChange({ x: e.clientX, y: e.clientY, idx });
      }}
      onPointerOut={() => {
        onHover(null);
        onTooltipChange(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        const idx = e.instanceId;
        if (idx === undefined || !visibleIdx.has(idx)) return;
        onSelect(idx);
      }}
    >
      <sphereGeometry args={[1, 18, 18]} />
      <meshStandardMaterial vertexColors metalness={0.1} roughness={0.55} />
    </instancedMesh>
  );
}

function Tooltip({
  x,
  y,
  idx,
  payload,
}: {
  x: number;
  y: number;
  idx: number;
  payload: EmbeddingsPayload;
}) {
  const term = payload.terms[idx];
  if (!term) return null;
  const offset = 14;
  return (
    <div
      className="tooltip"
      style={{
        left: x + offset,
        top: y + offset,
        borderColor: AREA_COLOR[term.area],
      }}
    >
      <div className="term">{term.term}</div>
      <div className="short">{term.short}</div>
    </div>
  );
}
