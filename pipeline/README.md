# Embedding pipeline

Pre-computes embeddings + UMAP-3D coordinates for the legal-term vocabulary.
Output: `../public/data/embeddings.json`, served as a static asset by the Vite app.

## One-time setup

```bash
python -m venv .venv
source .venv/bin/activate     # on Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
# Default: Gemini Embedding 001 (top of English MTEB, May 2026)
export GEMINI_API_KEY=...
python compute_embeddings.py

# Alternatives
export OPENAI_API_KEY=...
python compute_embeddings.py --model openai          # text-embedding-3-large

export VOYAGE_API_KEY=...
python compute_embeddings.py --model voyage          # voyage-3-large

# Offline / no API key — sentence-transformers + BAAI/bge-m3 (multilingual)
python compute_embeddings.py --model local
```

## Flags

| Flag | Purpose |
|---|---|
| `--model {gemini,openai,voyage,local}` | Backend choice. |
| `--model-name <id>` | Override the default model id for the chosen backend. |
| `--bare-term` | Embed only the bare term string (no definition / area context). Surfaces homonym conflation. |
| `--seed N` | UMAP `random_state`. Re-run with the same seed for stable layouts. |
| `--neighbors K` | Precompute top-K cosine neighbors per term (default 10). |

## Output schema

```jsonc
{
  "meta": { "model_backend": "...", "model_name": "...", "embedding_dim": 3072, ... },
  "terms": [
    { "idx": 0, "term": "mens rea", "lang": "la", "area": "criminal",
      "short": "Guilty mind; the mental element of a crime.",
      "pos": [0.12, -0.31, 0.05] }
  ],
  "neighbors": [
    [ { "idx": 12, "sim": 0.91 }, { "idx": 7, "sim": 0.88 } ]
  ]
}
```

`pos` is the centered + max-radius-normalised UMAP-3D position (cloud sits inside a unit ball).
`neighbors[i]` is the top-K cosine-similarity neighbors of term `i` in the original
high-dimensional space — UMAP positions are visual, not authoritative for nearest-neighbour queries.
