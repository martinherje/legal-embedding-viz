import { useState } from "react";
import { AREA_COLOR, AREA_LABEL } from "../lib/palette";
import type { EmbeddingsMeta, Term } from "../lib/types";

interface Props {
  meta: EmbeddingsMeta;
  selected: Term | null;
  hovered: Term | null;
  onClear: () => void;
}

/**
 * Pinned top-left model badge + status banner. The badge is always visible —
 * model name, dim, term count. Tap to expand for full meta.
 * The banner shows the focused or hovered term name; never covered by a finger.
 */
export default function HUD({ meta, selected, hovered, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const focus = selected ?? hovered;

  return (
    <>
      <div className={`hud-badge ${open ? "open" : ""}`}>
        <button
          className="hud-badge-toggle"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <span className="hud-model">{meta.model_name}</span>
          <span className="hud-sep">·</span>
          <span className="hud-dim">{meta.embedding_dim}d</span>
          <span className="hud-sep">·</span>
          <span className="hud-count">{meta.count} terms</span>
          <span className="hud-chevron">{open ? "▴" : "▾"}</span>
        </button>
        {open && (
          <div className="hud-meta-panel">
            <div className="hud-row">
              <span className="hud-label">Backend</span>
              <span>{meta.model_backend}</span>
            </div>
            <div className="hud-row">
              <span className="hud-label">Model</span>
              <span>{meta.model_name}</span>
            </div>
            <div className="hud-row">
              <span className="hud-label">Embedding dim</span>
              <span>{meta.embedding_dim}</span>
            </div>
            {meta.display_dim && (
              <div className="hud-row">
                <span className="hud-label">Display dim</span>
                <span>{meta.display_dim} (sampled)</span>
              </div>
            )}
            <div className="hud-row">
              <span className="hud-label">Terms</span>
              <span>{meta.count}</span>
            </div>
            <div className="hud-row">
              <span className="hud-label">Projection</span>
              <span>UMAP 3D, cosine, n=15, min_dist=0.12</span>
            </div>
            <div className="hud-row">
              <span className="hud-label">Computed</span>
              <span>{meta.computed_at.replace("T", " ").slice(0, 16)}Z</span>
            </div>
            <div className="hud-row">
              <span className="hud-label">Bare term</span>
              <span>{meta.bare_term ? "yes" : "no (definition + area context included)"}</span>
            </div>
          </div>
        )}
      </div>

      <div className="hud-banner">
        {focus ? (
          <>
            <span
              className="hud-dot"
              style={{ background: AREA_COLOR[focus.area] }}
            />
            <span className="hud-term">{focus.term}</span>
            <span className="hud-banner-meta">
              {AREA_LABEL[focus.area]}
              {!selected && hovered && hovered.short ? ` · ${hovered.short}` : ""}
            </span>
            {selected && (
              <button
                className="hud-clear"
                onClick={onClear}
                aria-label="Clear selection"
              >
                ✕
              </button>
            )}
          </>
        ) : (
          <span className="hud-banner-meta">
            Tap a point to inspect its neighbours, similarity, and embedding.
          </span>
        )}
      </div>
    </>
  );
}
