import { AREA_COLOR, AREA_LABEL, LANG_LABEL } from "../lib/palette";
import type { EmbeddingsPayload } from "../lib/types";
import VectorStrip from "./VectorStrip";

interface Props {
  payload: EmbeddingsPayload;
  idx: number;
  onSelect: (idx: number | null) => void;
}

export default function TermPanel({ payload, idx, onSelect }: Props) {
  const term = payload.terms[idx];
  const neighbors = payload.neighbors[idx] ?? [];
  if (!term) return null;

  const maxSim = neighbors.length > 0
    ? Math.max(...neighbors.map((n) => n.sim), 0.001)
    : 1;

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

        {term.vec && (
          <div style={{ marginTop: 14 }}>
            <h3 className="panel-h3">Embedding</h3>
            <VectorStrip
              vec={term.vec}
              fullDim={payload.meta.embedding_dim}
              displayDim={payload.meta.display_dim ?? term.vec.length}
            />
          </div>
        )}

        <div className="neighbors">
          <h3 className="panel-h3">Cosine similarity to nearest neighbours</h3>
          {neighbors.length === 0 ? (
            <p className="empty">No neighbour data.</p>
          ) : (
            neighbors.map((n) => {
              const nt = payload.terms[n.idx];
              if (!nt) return null;
              const widthPct = (n.sim / maxSim) * 100;
              return (
                <div
                  key={n.idx}
                  className="sim-row"
                  onClick={() => onSelect(n.idx)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="sim-name">
                    <span
                      className="dot"
                      style={{ background: AREA_COLOR[nt.area] }}
                    />
                    <span>{nt.term}</span>
                  </div>
                  <div className="sim-track">
                    <div
                      className="sim-bar"
                      style={{
                        width: `${widthPct}%`,
                        background: AREA_COLOR[nt.area],
                      }}
                    />
                  </div>
                  <div className="sim-value">{n.sim.toFixed(3)}</div>
                </div>
              );
            })
          )}
        </div>

        <button onClick={() => onSelect(null)} className="clear-btn">
          Clear selection (Esc)
        </button>
      </div>
    </div>
  );
}
