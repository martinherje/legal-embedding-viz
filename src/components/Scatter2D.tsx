import { useEffect, useMemo, useRef, useState } from "react";
import { AREA_COLOR } from "../lib/palette";
import type { EmbeddingsPayload, Term } from "../lib/types";

interface Props {
  payload: EmbeddingsPayload;
  visibleIdx: Set<number>;
  selectedIdx: number | null;
  hoveredIdx: number | null;
  onHover: (idx: number | null) => void;
  onSelect: (idx: number | null) => void;
}

// Logical viewBox; positions arrive normalized to [-1, 1].
const PAD = 0.18;
const VIEW_MIN = -1 - PAD;
const VIEW_SIZE = 2 + 2 * PAD;

const NEIGHBOR_LINKS = 5;

export default function Scatter2D({
  payload,
  visibleIdx,
  selectedIdx,
  hoveredIdx,
  onHover,
  onSelect,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const r = e.contentRect;
        setSize({ w: Math.max(320, r.width), h: Math.max(280, r.height) });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const selected = selectedIdx !== null ? payload.terms[selectedIdx] : null;
  const hovered = hoveredIdx !== null ? payload.terms[hoveredIdx] : null;

  // Compute neighbor edges for the selected term.
  const neighborEdges = useMemo(() => {
    if (!selected) return [];
    const list = payload.neighbors[selected.idx] ?? [];
    return list.slice(0, NEIGHBOR_LINKS).map((n) => ({
      from: selected,
      to: payload.terms[n.idx],
      sim: n.sim,
    }));
  }, [selected, payload]);

  // Project from logical [-1, 1] coordinates to viewport pixels.
  // Use the smaller dimension for square aspect with letterboxing.
  const scale = Math.min(size.w, size.h) / VIEW_SIZE;
  const offsetX = (size.w - VIEW_SIZE * scale) / 2;
  const offsetY = (size.h - VIEW_SIZE * scale) / 2;
  const project = (p: [number, number]): [number, number] => [
    offsetX + (p[0] - VIEW_MIN) * scale,
    offsetY + (p[1] - VIEW_MIN) * scale,
  ];

  return (
    <div className="scatter-wrap">
      {/* Top status banner — always visible, never covered by a finger */}
      <div className="hud">
        {selected ? (
          <>
            <span
              className="hud-dot"
              style={{ background: AREA_COLOR[selected.area] }}
            />
            <span className="hud-term">{selected.term}</span>
            <span className="hud-meta">{selected.area} · {selected.lang}</span>
            <button
              className="hud-clear"
              onClick={() => onSelect(null)}
              aria-label="Clear selection"
            >
              ✕
            </button>
          </>
        ) : hovered ? (
          <>
            <span
              className="hud-dot"
              style={{ background: AREA_COLOR[hovered.area] }}
            />
            <span className="hud-term">{hovered.term}</span>
            <span className="hud-meta">{hovered.short}</span>
          </>
        ) : (
          <span className="hud-meta">Tap a point to see its nearest neighbors and similarity scores.</span>
        )}
      </div>

      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        onPointerDown={(e) => {
          if (e.target === svgRef.current) onSelect(null);
        }}
      >
        {/* Edges to neighbors of the selected term */}
        {neighborEdges.map((edge, i) => {
          const [x1, y1] = project(edge.from.pos2);
          const [x2, y2] = project(edge.to.pos2);
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          return (
            <g key={`edge-${i}`} className="edge">
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={AREA_COLOR[edge.from.area]}
                strokeWidth={1.4}
                strokeOpacity={0.55}
                strokeLinecap="round"
              />
              <g transform={`translate(${mx},${my})`}>
                <rect
                  x={-22}
                  y={-9}
                  width={44}
                  height={18}
                  rx={9}
                  fill="rgba(20,22,28,0.92)"
                  stroke="var(--border-bright, #3a3f4a)"
                />
                <text
                  className="edge-label"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {edge.sim.toFixed(2)}
                </text>
              </g>
            </g>
          );
        })}

        {/* Points */}
        {payload.terms.map((t) => (
          <Point
            key={t.idx}
            term={t}
            project={project}
            visible={visibleIdx.has(t.idx)}
            selected={selectedIdx === t.idx}
            hovered={hoveredIdx === t.idx}
            isNeighborOfSelected={neighborEdges.some((e) => e.to.idx === t.idx)}
            onHover={onHover}
            onSelect={onSelect}
          />
        ))}

        {/* Term label for the selected node, drawn last so it sits on top */}
        {selected && (
          <PointLabel term={selected} project={project} primary />
        )}

        {/* Term labels for the selected neighbors */}
        {neighborEdges.map((e, i) => (
          <PointLabel key={`lbl-${i}`} term={e.to} project={project} />
        ))}
      </svg>
    </div>
  );
}

interface PointProps {
  term: Term;
  project: (p: [number, number]) => [number, number];
  visible: boolean;
  selected: boolean;
  hovered: boolean;
  isNeighborOfSelected: boolean;
  onHover: (idx: number | null) => void;
  onSelect: (idx: number | null) => void;
}

function Point({
  term,
  project,
  visible,
  selected,
  hovered,
  isNeighborOfSelected,
  onHover,
  onSelect,
}: PointProps) {
  const [cx, cy] = project(term.pos2);
  const baseR = 6;
  const r = selected ? 10 : isNeighborOfSelected ? 8 : hovered ? 8 : baseR;
  const fill = AREA_COLOR[term.area];
  const opacity = visible ? 1 : 0.18;

  return (
    <g
      style={{ cursor: visible ? "pointer" : "default" }}
      onPointerEnter={() => visible && onHover(term.idx)}
      onPointerLeave={() => onHover(null)}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (visible) onSelect(term.idx);
      }}
    >
      {selected && (
        <circle cx={cx} cy={cy} r={18} fill={fill} fillOpacity={0.18} />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={r + 6}
        fill="transparent"
        // Larger transparent hit-target for touch — easy 24px+ tap area
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        fillOpacity={opacity}
        stroke={selected ? "#fff" : isNeighborOfSelected ? "#fff" : "transparent"}
        strokeOpacity={selected ? 0.95 : isNeighborOfSelected ? 0.6 : 0}
        strokeWidth={selected ? 2 : 1.5}
      />
    </g>
  );
}

function PointLabel({
  term,
  project,
  primary = false,
}: {
  term: Term;
  project: (p: [number, number]) => [number, number];
  primary?: boolean;
}) {
  const [cx, cy] = project(term.pos2);
  const dy = primary ? -18 : -14;
  const w = Math.min(180, Math.max(52, term.term.length * 7 + 14));
  return (
    <g transform={`translate(${cx},${cy + dy})`} pointerEvents="none">
      <rect
        x={-w / 2}
        y={-13}
        width={w}
        height={primary ? 22 : 18}
        rx={6}
        fill="rgba(20,22,28,0.95)"
        stroke={primary ? "#fff" : "var(--border-bright, #3a3f4a)"}
        strokeOpacity={primary ? 0.85 : 0.6}
      />
      <text
        x={0}
        y={primary ? -1 : 0}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#e6e8ec"
        fontSize={primary ? 12 : 11}
        fontWeight={primary ? 600 : 500}
      >
        {term.term}
      </text>
    </g>
  );
}
