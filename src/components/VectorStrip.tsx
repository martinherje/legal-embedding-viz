import { useMemo } from "react";

interface Props {
  vec: number[];      // int8 values in [-127, 127]
  fullDim: number;    // original embedding dimensionality
  displayDim: number; // number of cells in `vec` (typically 256)
  height?: number;
}

/**
 * Renders the term's embedding as a horizontal heatmap strip — one cell per
 * sampled dimension, colored by value. The point: communicate that what you
 * see in 3D is a projection of a much larger vector; the strip is a glimpse
 * of the source object.
 */
export default function VectorStrip({ vec, fullDim, displayDim, height = 20 }: Props) {
  const cells = useMemo(
    () =>
      vec.map((v, i) => {
        const t = Math.max(-1, Math.min(1, v / 127));
        return { i, color: divergingColor(t) };
      }),
    [vec],
  );

  return (
    <div className="vec-strip-wrap">
      <div
        className="vec-strip"
        style={{ height, gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}
        aria-label={`Embedding strip, ${cells.length} sampled dims of ${fullDim}`}
      >
        {cells.map((c) => (
          <span
            key={c.i}
            className="vec-cell"
            style={{ background: c.color }}
            title={`dim ${c.i}: ${vec[c.i] / 127 >= 0 ? "+" : ""}${(vec[c.i] / 127).toFixed(2)}`}
          />
        ))}
      </div>
      <div className="vec-strip-meta">
        <span>
          <strong>{fullDim}</strong>-dimensional vector ·{" "}
          {fullDim > displayDim ? (
            <>showing <strong>{displayDim}</strong> sampled dims</>
          ) : (
            <>full vector shown</>
          )}
        </span>
        <span className="vec-strip-legend">
          <span className="legend-grad" />
          <span style={{ fontSize: 10, color: "var(--muted)" }}>−1</span>
          <span style={{ fontSize: 10, color: "var(--muted)" }}>0</span>
          <span style={{ fontSize: 10, color: "var(--muted)" }}>+1</span>
        </span>
      </div>
    </div>
  );
}

function divergingColor(t: number): string {
  // -1 = red, 0 = neutral panel-2 tone, +1 = blue
  // Use perceptually linear interpolation
  if (t >= 0) {
    // 0 → neutral; 1 → blue
    const a = Math.pow(t, 0.7);
    const r = Math.round(28 + (108 - 28) * (1 - a));
    const g = Math.round(31 + (171 - 31) * (1 - a) + 90 * a);
    const b = Math.round(38 + (255 - 38) * a);
    return `rgb(${r}, ${g}, ${b})`;
  }
  // -1 → red; 0 → neutral
  const a = Math.pow(-t, 0.7);
  const r = Math.round(28 + (230 - 28) * a);
  const g = Math.round(31 + (60 - 31) * a);
  const b = Math.round(38 + (70 - 38) * a);
  return `rgb(${r}, ${g}, ${b})`;
}
