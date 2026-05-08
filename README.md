# Legal Embedding Atlas

Interactive 3D visualization of legal-term embeddings, computed with current state-of-the-art embedding models.

**[Live demo →](https://martinherje.github.io/legal-embedding-viz/)**

## Stack

- Vite + React + TypeScript
- Three.js (via react-three-fiber) for the 3D scatter
- UMAP for the dimensionality reduction
- Embedding backends: Gemini Embedding 001 (default), OpenAI `text-embedding-3-large`, Voyage `voyage-3-large`, or sentence-transformers (offline)

## Quick start

```bash
npm install
cd pipeline && pip install -r requirements.txt && cd ..

# Set one of these (or none — pipeline falls back to a local model)
export GEMINI_API_KEY=...

python pipeline/compute_embeddings.py
npm run dev
```

Output of the pipeline is `public/data/embeddings.json`. The frontend fetches it at runtime.

## Adding terms

Vocabulary lives in [`data/terms.json`](data/terms.json). Each entry:

```json
{
  "term": "mens rea",
  "lang": "en|la",
  "area": "criminal|contract|tort|admin|constitutional|eu|hr|procedure|property|tax|labour|family|theory",
  "short": "Brief definition shown in the tooltip"
}
```

Re-run `python pipeline/compute_embeddings.py` after editing.

## Pipeline backends

| Flag | Model | Notes |
|---|---|---|
| `--model gemini` (default) | `gemini-embedding-001` | Top of English MTEB at writing. Needs `GEMINI_API_KEY`. |
| `--model openai` | `text-embedding-3-large` | 3072d. Needs `OPENAI_API_KEY`. |
| `--model voyage` | `voyage-3-large` | Strong multilingual. Needs `VOYAGE_API_KEY`. |
| `--model local` | `intfloat/multilingual-e5-small` | Offline, ~470 MB. No API key. |

Other flags: `--bare-term` (embed the term only, no definition), `--seed N` (UMAP `random_state`), `--neighbors K` (precompute top-K neighbors).

## Deploy

GitHub Pages workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Runs on every push to `main`. Computes embeddings (Gemini if `GEMINI_API_KEY` repo secret is set, otherwise sentence-transformers fallback), builds the Vite app, deploys.

## License

MIT — see [LICENSE](LICENSE).
