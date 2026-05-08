import { useEffect, useMemo, useState } from "react";
import Scatter2D from "./components/Scatter2D";
import Sidebar from "./components/Sidebar";
import type { Area, EmbeddingsPayload, Lang } from "./lib/types";

type LoadState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "error"; message: string }
  | { status: "ready"; payload: EmbeddingsPayload };

export default function App() {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [disabledAreas, setDisabledAreas] = useState<Set<Area>>(new Set());
  const [disabledLangs, setDisabledLangs] = useState<Set<Lang>>(new Set());
  const [drawerExpanded, setDrawerExpanded] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIdx(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Auto-expand drawer when something is selected (phone)
  useEffect(() => {
    if (selectedIdx !== null) setDrawerExpanded(true);
  }, [selectedIdx]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/embeddings.json`)
      .then(async (r) => {
        if (r.status === 404) {
          setLoad({ status: "missing" });
          return;
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const payload = (await r.json()) as EmbeddingsPayload;
        setLoad({ status: "ready", payload });
      })
      .catch((err) => {
        setLoad({
          status: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      });
  }, []);

  const visibleIdx = useMemo(() => {
    if (load.status !== "ready") return new Set<number>();
    const q = query.trim().toLowerCase();
    const set = new Set<number>();
    for (const t of load.payload.terms) {
      if (disabledAreas.has(t.area)) continue;
      if (disabledLangs.has(t.lang)) continue;
      if (q && !t.term.toLowerCase().includes(q) && !t.short.toLowerCase().includes(q)) {
        continue;
      }
      set.add(t.idx);
    }
    return set;
  }, [load, query, disabledAreas, disabledLangs]);

  const toggleArea = (a: Area) => {
    setDisabledAreas((prev) => {
      const next = new Set(prev);
      if (next.has(a)) next.delete(a);
      else next.add(a);
      return next;
    });
  };

  const toggleLang = (l: Lang) => {
    setDisabledLangs((prev) => {
      const next = new Set(prev);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      return next;
    });
  };

  return (
    <div className="app">
      <div className="canvas-wrap">
        {load.status === "ready" ? (
          <Scatter2D
            payload={load.payload}
            visibleIdx={visibleIdx}
            selectedIdx={selectedIdx}
            hoveredIdx={hoveredIdx}
            onHover={setHoveredIdx}
            onSelect={setSelectedIdx}
          />
        ) : (
          <div className="banner">
            {load.status === "loading" && <p>Loading embeddings…</p>}
            {load.status === "missing" && (
              <>
                <h2>No embeddings yet</h2>
                <p>
                  Run the pipeline to generate{" "}
                  <code>public/data/embeddings.json</code>:
                </p>
                <p style={{ marginTop: 8 }}>
                  <code>cd pipeline &amp;&amp; pip install -r requirements.txt</code>
                  <br />
                  <code>export GEMINI_API_KEY=…</code>
                  <br />
                  <code>python compute_embeddings.py</code>
                </p>
                <p style={{ marginTop: 8 }}>
                  See <code>pipeline/README.md</code> for OpenAI / Voyage / local
                  alternatives.
                </p>
              </>
            )}
            {load.status === "error" && (
              <>
                <h2>Could not load embeddings</h2>
                <p>{load.message}</p>
              </>
            )}
          </div>
        )}
      </div>
      <Sidebar
        load={load}
        query={query}
        setQuery={setQuery}
        selectedIdx={selectedIdx}
        setSelectedIdx={setSelectedIdx}
        hoveredIdx={hoveredIdx}
        disabledAreas={disabledAreas}
        disabledLangs={disabledLangs}
        toggleArea={toggleArea}
        toggleLang={toggleLang}
        visibleIdx={visibleIdx}
        drawerExpanded={drawerExpanded}
        setDrawerExpanded={setDrawerExpanded}
      />
    </div>
  );
}
