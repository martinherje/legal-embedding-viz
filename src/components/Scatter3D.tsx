import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
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

const NEIGHBOR_LINKS = 5;

export default function Scatter3D(props: Props) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [2.4, 1.6, 2.4], fov: 50 }}
      onPointerMissed={() => props.onSelect(null)}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[5, 7, 4]} intensity={0.85} />
      <directionalLight position={[-3, -2, -4]} intensity={0.35} />
      <Scene {...props} />
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.6}
        zoomSpeed={0.6}
        minDistance={1.1}
        maxDistance={8}
        enablePan={false}
        // Touch: one-finger rotate, two-finger pinch zoom
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
    </Canvas>
  );
}

function Scene({
  payload,
  visibleIdx,
  selectedIdx,
  hoveredIdx,
  onHover,
  onSelect,
}: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const { gl } = useThree();
  // Remove the default canvas pointer-event handling that interferes with
  // OrbitControls + raycasting on touch.
  useEffect(() => {
    gl.domElement.style.touchAction = "none";
  }, [gl]);

  const baseColors = useMemo(() => {
    const arr = new Float32Array(payload.terms.length * 3);
    const c = new THREE.Color();
    for (let i = 0; i < payload.terms.length; i++) {
      c.set(AREA_COLOR[payload.terms[i].area] ?? "#888");
      arr[i * 3 + 0] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, [payload]);

  // Compute neighbor edges (selected → top-K) for the line segments.
  const edges = useMemo(() => {
    if (selectedIdx === null) return null;
    const list = (payload.neighbors[selectedIdx] ?? []).slice(0, NEIGHBOR_LINKS);
    return list.map((n) => ({
      from: payload.terms[selectedIdx].pos3,
      to: payload.terms[n.idx].pos3,
      sim: n.sim,
      idx: n.idx,
    }));
  }, [selectedIdx, payload]);

  // Update instance transforms when filters/selection change.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const baseScale = 0.025;
    const selScale = 0.05;
    const hovScale = 0.04;
    const neighborScale = 0.04;
    const neighborSet = new Set(edges?.map((e) => e.idx) ?? []);

    for (let i = 0; i < payload.terms.length; i++) {
      const t = payload.terms[i];
      const visible = visibleIdx.has(i);
      const selected = selectedIdx === i;
      const hovered = hoveredIdx === i;
      const neighbor = neighborSet.has(i);
      const scale = !visible
        ? 0.0001
        : selected
          ? selScale
          : neighbor
            ? neighborScale
            : hovered
              ? hovScale
              : baseScale;

      dummy.position.set(t.pos3[0], t.pos3[1], t.pos3[2]);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [payload, visibleIdx, selectedIdx, hoveredIdx, edges, dummy]);

  // Update instance colors.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || !mesh.instanceColor) return;
    const tmp = new THREE.Color();
    const neighborSet = new Set(edges?.map((e) => e.idx) ?? []);
    for (let i = 0; i < payload.terms.length; i++) {
      const visible = visibleIdx.has(i);
      const r = baseColors[i * 3 + 0];
      const g = baseColors[i * 3 + 1];
      const b = baseColors[i * 3 + 2];
      if (!visible) {
        tmp.setRGB(r * 0.18, g * 0.18, b * 0.18);
      } else if (selectedIdx === i || neighborSet.has(i)) {
        tmp.setRGB(Math.min(1, r * 1.3), Math.min(1, g * 1.3), Math.min(1, b * 1.3));
      } else if (selectedIdx !== null) {
        // Dim non-neighbors when something is selected
        tmp.setRGB(r * 0.5, g * 0.5, b * 0.5);
      } else {
        tmp.setRGB(r, g, b);
      }
      mesh.setColorAt(i, tmp);
    }
    mesh.instanceColor.needsUpdate = true;
  }, [payload, visibleIdx, selectedIdx, edges, baseColors]);

  // Slow auto-rotation when nothing selected — adds to the "alive" feel.
  useFrame((_state, delta) => {
    if (selectedIdx !== null) return;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.045;
    }
  });

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, payload.terms.length]}
        onPointerOver={(e) => {
          e.stopPropagation();
          const idx = e.instanceId;
          if (idx === undefined || !visibleIdx.has(idx)) {
            onHover(null);
            return;
          }
          onHover(idx);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          const idx = e.instanceId;
          if (idx === undefined || !visibleIdx.has(idx)) return;
          onSelect(idx);
        }}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial vertexColors metalness={0.05} roughness={0.55} />
      </instancedMesh>

      {/* Edges to selected term's nearest neighbors */}
      {edges && edges.map((edge, i) => (
        <Edge key={`edge-${i}`} from={edge.from} to={edge.to} sim={edge.sim} color={AREA_COLOR[payload.terms[selectedIdx!].area]} />
      ))}
    </>
  );
}

function Edge({
  from,
  to,
  sim,
  color,
}: {
  from: [number, number, number];
  to: [number, number, number];
  sim: number;
  color: string;
}) {
  const ref = useRef<THREE.BufferGeometry>(null);
  useEffect(() => {
    if (!ref.current) return;
    const positions = new Float32Array([
      from[0], from[1], from[2],
      to[0], to[1], to[2],
    ]);
    ref.current.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  }, [from, to]);
  // Render the similarity number near the midpoint (faded so it doesn't overwhelm)
  const opacity = 0.35 + sim * 0.55;
  return (
    <line>
      <bufferGeometry ref={ref} />
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  );
}
