# Legal Embedding Atlas

Interactive 3D visualization of legal-term embeddings (English + Norwegian + Latin) using current state-of-the-art embedding models.

The premise: embedding models compress meaning into geometry. Where do *legal* terms land? Do they cluster by area of law? Does the model distinguish *intent* in criminal law from *intent* in contract law, or collapse them onto the same point? Where do Norwegian and English equivalents sit relative to each other? This is a tool for looking.

![sketch](docs/preview.png)

---

## Stack

- **Frontend:** Vite + React + TypeScript + [react-three-fiber](https://github.com/pmndrs/react-three-fiber) (Three.js).
- **Pipeline:** Python — calls a model-agnostic embedding backend (Gemini / OpenAI / Voyage / sentence-transformers), runs UMAP to 3D, precomputes top-K cosine neighbors, ships a single `embeddings.json`.
- **Default embedding model:** `gemini-embedding-001` — top of English MTEB (May 2026), strong multilingual. Swap with `--model openai|voyage|local`.

## Quick start

### 1. Install

```bash
npm install
cd pipeline && pip install -r requirements.txt && cd ..
```

### 2. Compute embeddings

```bash
export GEMINI_API_KEY=...
cd pipeline
python compute_embeddings.py
cd ..
```

Pipeline writes `public/data/embeddings.json` (~250 KB for the default vocabulary). One run costs cents — the default 165-term vocabulary is ~2k tokens.

See [`pipeline/README.md`](pipeline/README.md) for OpenAI / Voyage / fully-offline alternatives.

### 3. Run the app

```bash
npm run dev
```

Open `http://localhost:5173`. Drag to rotate, scroll to zoom, click a point.

## Add or edit terms

The vocabulary is curated by hand in [`data/terms.json`](data/terms.json). Schema:

```jsonc
{
  "term": "mens rea",
  "lang": "en|no|la",
  "area": "criminal|contract|tort|admin|constitutional|eu|hr|procedure|property|tax|labour|family|theory",
  "short": "3-15 word definition shown in tooltip"
}
```

Re-run `python compute_embeddings.py` after editing. UMAP is seeded (`--seed 42`) so the layout is stable across runs unless the vocabulary changes.

## What you can see

- **Cluster by area of law.** Criminal terms (red) vs contract terms (orange) vs administrative terms (teal) — does the model carve along legal-doctrinal lines or along surface lexical features?
- **Cross-lingual proximity.** *grunngjevingsplikt* (Norwegian) and *duty to give reasons* (English) are translation pairs. How close are they in vector space?
- **Homonym disambiguation.** *intent* appears once in `criminal` and once in `contract`. With definitions included (default mode), they should be pulled apart by context. Re-run with `--bare-term` and they collapse.
- **Latin maxims** (`mens rea`, `pacta sunt servanda`, `nullum crimen sine lege`) — do they sit near their English glosses or float in their own region?
- **Norwegian admin-law cluster.** *forvaltningsskjønn*, *grunngjevingsplikt*, *enkeltvedtak*, *Sivilombodet* should form a tight neighborhood; check whether *forholdsmessighet* sits closer to its Norwegian neighbors or to the English *proportionality*.

## Project structure

```
legal-embedding-viz/
├── data/
│   └── terms.json             # source vocabulary (edit this)
├── pipeline/
│   ├── compute_embeddings.py  # embed → UMAP → neighbors → embeddings.json
│   ├── requirements.txt
│   └── README.md
├── public/
│   └── data/
│       └── embeddings.json    # generated (gitignored)
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── styles.css
│   ├── components/
│   │   ├── Scatter3D.tsx
│   │   ├── Sidebar.tsx
│   │   └── TermPanel.tsx
│   └── lib/
│       ├── types.ts
│       └── palette.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Deploy

Static site — `npm run build` produces `dist/`. Deploy anywhere (Vercel, Netlify, GitHub Pages, plain S3). Make sure `public/data/embeddings.json` is committed *or* generated as part of CI before build, since the frontend fetches it at runtime.

## Roadmap

- [ ] Toggle between *bare-term* and *term + definition* embedding modes (re-run pipeline twice, ship both, switch in UI).
- [ ] User-supplied terms — text-input that calls the embedding API client-side and projects into the existing UMAP space (requires saving the trained UMAP transform).
- [ ] Compare runs — load two `embeddings.json` files (e.g. Gemini vs OpenAI) side-by-side; lines connect each term across the two layouts.
- [ ] 2D fallback for mobile (tSNE-2D in pipeline, alt route in app).
- [ ] Curate the vocabulary further — current 165 terms is a starting set; the conflation findings are sharper with more homonyms (*party*, *consideration*, *interest*, *security*).

## License

MIT — see [LICENSE](LICENSE).

## Why this exists

Built as part of a PhD on AI and legal justification at the University of Bergen. The embedding-space view is one way of asking: when a language model "knows" a legal concept, *what kind of object* does it know? A point in a manifold. Looking at the manifold is a small but real form of interpretability.
