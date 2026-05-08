import { useMemo } from "react";
import { AREA_COLOR, AREA_LABEL, LANG_LABEL } from "../lib/palette";
import type { Area, EmbeddingsPayload, Lang } from "../lib/types";
import TermPanel from "./TermPanel";

type LoadState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; payload: EmbeddingsPayload };

interface Props {
  load: LoadState;
  query: string;
  setQuery: (q: string) => void;
  selectedIdx: number | null;
  setSelectedIdx: (idx: number | null) => void;
  hoveredIdx: number | null;
  disabledAreas: Set<Area>;
  disabledLangs: Set<Lang>;
  toggleArea: (a: Area) => void;
  toggleLang: (l: Lang) => void;
  visibleIdx: Set<number>;
  drawerExpanded: boolean;
  setDrawerExpanded: (b: boolean) => void;
}

export default function Sidebar(props: Props) {
  const { load, query, setQuery, selectedIdx, setSelectedIdx, visibleIdx } = props;

  const counts = useMemo(() => {
    if (load.status !== "ready") return { areas: {}, langs: {} } as {
      areas: Partial<Record<Area, number>>;
      langs: Partial<Record<Lang, number>>;
    };
    const areas: Partial<Record<Area, number>> = {};
    const langs: Partial<Record<Lang, number>> = {};
    for (const t of load.payload.terms) {
      areas[t.area] = (areas[t.area] ?? 0) + 1;
      langs[t.lang] = (langs[t.lang] ?? 0) + 1;
    }
    return { areas, langs };
  }, [load]);

  const matches = useMemo(() => {
    if (load.status !== "ready" || !query.trim()) return [];
    return load.payload.terms
      .filter((t) => visibleIdx.has(t.idx))
      .slice(0, 12);
  }, [load, query, visibleIdx]);

  const drawerClass = `sidebar ${props.drawerExpanded ? "expanded" : "collapsed"}`;

  return (
    <aside className={drawerClass}>
      <button
        className="drawer-handle"
        onClick={() => props.setDrawerExpanded(!props.drawerExpanded)}
        aria-label={props.drawerExpanded ? "Collapse panel" : "Expand panel"}
      >
        <span className="drawer-grip" />
        {props.drawerExpanded ? "Hide" : selectedIdx !== null ? "Show details" : "Filters"}
      </button>

      <header className="sidebar-header">
        <h1>Embedding Atlas</h1>
        <div className="meta">
          {load.status === "ready" ? (
            <>
              {load.payload.meta.count} terms · {load.payload.meta.embedding_dim}d ·{" "}
              {load.payload.meta.model_name}
            </>
          ) : (
            <>Where similarity in language sits in vector space.</>
          )}
        </div>
      </header>

      <div className="search">
        <input
          type="search"
          placeholder="Search term or definition…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="scroll">
        {load.status === "ready" && selectedIdx !== null ? (
          <TermPanel
            payload={load.payload}
            idx={selectedIdx}
            onSelect={setSelectedIdx}
          />
        ) : null}

        {load.status === "ready" && selectedIdx === null && query.trim() ? (
          <div className="section">
            <h2>Matches ({matches.length})</h2>
            {matches.length === 0 ? (
              <p className="empty">No matches.</p>
            ) : (
              matches.map((t) => (
                <div
                  key={t.idx}
                  className="neighbor-row"
                  onClick={() => setSelectedIdx(t.idx)}
                >
                  <div className="nb-term">
                    <span
                      className="dot"
                      style={{ background: AREA_COLOR[t.area] }}
                    />
                    <span className="nb-name">{t.term}</span>
                  </div>
                  <div className="nb-sim">{t.lang}</div>
                </div>
              ))
            )}
          </div>
        ) : null}

        {load.status === "ready" && selectedIdx === null && !query.trim() ? (
          <div className="empty" style={{ marginBottom: 16 }}>
            Tap a point on the map. Or search above to find a term.
          </div>
        ) : null}

        {load.status === "ready" && (
          <>
            <div className="section">
              <h2>Area</h2>
              <div className="chip-row">
                {(Object.keys(AREA_LABEL) as Area[]).map((a) => (
                  <button
                    key={a}
                    className={`chip ${props.disabledAreas.has(a) ? "off" : ""}`}
                    onClick={() => props.toggleArea(a)}
                    style={{
                      borderColor: props.disabledAreas.has(a)
                        ? "var(--border)"
                        : AREA_COLOR[a],
                    }}
                  >
                    <span className="dot" style={{ background: AREA_COLOR[a] }} />
                    {AREA_LABEL[a]}
                    <span className="chip-count">{counts.areas[a] ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="section">
              <h2>Language</h2>
              <div className="chip-row">
                {(Object.keys(LANG_LABEL) as Lang[]).map((l) => (
                  <button
                    key={l}
                    className={`chip ${props.disabledLangs.has(l) ? "off" : ""}`}
                    onClick={() => props.toggleLang(l)}
                  >
                    {LANG_LABEL[l]}
                    <span className="chip-count">{counts.langs[l] ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="section">
              <h2>Tips</h2>
              <p className="empty" style={{ paddingLeft: 0 }}>
                Tap a point → see top-5 nearest neighbors with cosine similarity.
                Try the term <code>intent</code> — criminal-law and contract-law senses
                sit at different points if the model disambiguates them.
              </p>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
