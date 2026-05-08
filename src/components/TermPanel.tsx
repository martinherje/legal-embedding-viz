import { AREA_COLOR, AREA_LABEL, LANG_LABEL } from "../lib/palette";
import type { EmbeddingsPayload } from "../lib/types";

interface Props {
  payload: EmbeddingsPayload;
  idx: number;
  onSelect: (idx: number | null) => void;
}

export default function TermPanel({ payload, idx, onSelect }: Props) {
  const term = payload.terms[idx];
  const neighbors = payload.neighbors[idx] ?? [];
  if (!term) return null;
  return (
    <div className="section">
      <div
        className="term-card"
        style={{ borderColor: AREA_COLOR[term.area] + "55" }}
      >
        <div className="header-row">
          <div className="term-name">{term.term}</div>
          <span
            className="badge"
            style={{
              background: AREA_COLOR[term.area] + "30",
              color: AREA_COLOR[term.area],
            }}
          >
            {LANG_LABEL[term.lang]}
          </span>
        </div>
        <div className="area-line">
          <span
            className="legend-swatch"
            style={{ background: AREA_COLOR[term.area] }}
          />
          {AREA_LABEL[term.area]}
        </div>
        <div className="short">{term.short}</div>

        <div className="neighbors">
          <h3>Nearest in vector space</h3>
          {neighbors.length === 0 ? (
            <p className="empty">No neighbor data.</p>
          ) : (
            neighbors.map((n) => {
              const nt = payload.terms[n.idx];
              if (!nt) return null;
              return (
                <div
                  key={n.idx}
                  className="neighbor-row"
                  onClick={() => onSelect(n.idx)}
                >
                  <div className="nb-term">
                    <span
                      className="dot"
                      style={{ background: AREA_COLOR[nt.area] }}
                    />
                    <span className="nb-name">{nt.term}</span>
                  </div>
                  <div className="nb-sim">{n.sim.toFixed(2)}</div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ marginTop: 14, fontSize: 11, color: "var(--muted)" }}>
          UMAP coords:{" "}
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            ({term.pos[0].toFixed(2)}, {term.pos[1].toFixed(2)},{" "}
            {term.pos[2].toFixed(2)})
          </span>
          <br />
          <button
            onClick={() => onSelect(null)}
            style={{
              marginTop: 6,
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "2px 8px",
              cursor: "pointer",
              fontSize: 11,
              color: "var(--muted)",
            }}
          >
            Clear selection
          </button>
        </div>
      </div>
    </div>
  );
}
