"""Compute embeddings + UMAP-3D projection for the legal-term vocabulary.

Reads `../data/terms.json` and writes `../public/data/embeddings.json` with
3D coordinates and pre-computed nearest neighbors. Designed to be model-agnostic:
swap the embedding backend with --model.

Usage:
    python compute_embeddings.py                      # default: gemini-embedding-001
    python compute_embeddings.py --model openai       # text-embedding-3-large
    python compute_embeddings.py --model voyage       # voyage-3-large
    python compute_embeddings.py --model local        # sentence-transformers (offline)
    python compute_embeddings.py --bare-term          # embed only the term, no definition

Required env vars (depending on backend):
    GEMINI_API_KEY      for gemini
    OPENAI_API_KEY      for openai
    VOYAGE_API_KEY      for voyage
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
TERMS_PATH = ROOT / "data" / "terms.json"
OUT_PATH = ROOT / "public" / "data" / "embeddings.json"


def batched(seq: list, size: int) -> Iterable[list]:
    for i in range(0, len(seq), size):
        yield seq[i : i + size]


def build_embed_text(term: dict, bare_term: bool) -> str:
    if bare_term:
        return term["term"]
    # Including the short definition gives meaningful disambiguation —
    # the homonym "intent" embeds differently in criminal vs contract context.
    return f'{term["term"]} ({term["area"]}): {term["short"]}'


def embed_gemini(texts: list[str], model: str) -> np.ndarray:
    from google import genai

    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        sys.exit("Set GEMINI_API_KEY (or GOOGLE_API_KEY) for the gemini backend.")
    client = genai.Client(api_key=api_key)

    out: list[list[float]] = []
    for chunk in batched(texts, 100):
        resp = client.models.embed_content(
            model=model,
            contents=chunk,
            config={"task_type": "SEMANTIC_SIMILARITY"},
        )
        out.extend(e.values for e in resp.embeddings)
        time.sleep(0.1)
    return np.asarray(out, dtype=np.float32)


def embed_openai(texts: list[str], model: str) -> np.ndarray:
    from openai import OpenAI

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        sys.exit("Set OPENAI_API_KEY for the openai backend.")
    client = OpenAI(api_key=api_key)

    out: list[list[float]] = []
    for chunk in batched(texts, 256):
        resp = client.embeddings.create(input=chunk, model=model)
        out.extend(d.embedding for d in resp.data)
    return np.asarray(out, dtype=np.float32)


def embed_voyage(texts: list[str], model: str) -> np.ndarray:
    import voyageai

    api_key = os.environ.get("VOYAGE_API_KEY")
    if not api_key:
        sys.exit("Set VOYAGE_API_KEY for the voyage backend.")
    client = voyageai.Client(api_key=api_key)

    out: list[list[float]] = []
    for chunk in batched(texts, 128):
        resp = client.embed(chunk, model=model, input_type="document")
        out.extend(resp.embeddings)
    return np.asarray(out, dtype=np.float32)


def embed_local(texts: list[str], model: str) -> np.ndarray:
    """Offline fallback. sentence-transformers with a multilingual model.

    Default `intfloat/multilingual-e5-small` is ~470MB and quite good on
    multilingual semantic similarity — strong CI/Pages-friendly default.
    Override with --model-name to use a heavier model (e.g. BAAI/bge-m3)."""
    from sentence_transformers import SentenceTransformer

    st = SentenceTransformer(model)
    # multilingual-e5-* expects "passage: " prefix for documents
    if "e5" in model.lower():
        prefixed = [f"passage: {t}" for t in texts]
    else:
        prefixed = texts
    return np.asarray(st.encode(prefixed, normalize_embeddings=False), dtype=np.float32)


BACKENDS = {
    "gemini": ("gemini-embedding-001", embed_gemini),
    "openai": ("text-embedding-3-large", embed_openai),
    "voyage": ("voyage-3-large", embed_voyage),
    "local": ("intfloat/multilingual-e5-small", embed_local),
}


def reduce_umap(embeddings: np.ndarray, n_components: int, seed: int) -> np.ndarray:
    import umap

    reducer = umap.UMAP(
        n_components=n_components,
        n_neighbors=min(15, max(2, len(embeddings) - 1)),
        min_dist=0.12,
        metric="cosine",
        random_state=seed,
    )
    coords = reducer.fit_transform(embeddings).astype(np.float32)

    # Center and scale so the cloud sits in a unit-ish box for the viewer.
    coords -= coords.mean(axis=0, keepdims=True)
    radius = float(np.linalg.norm(coords, axis=1).max())
    if radius > 0:
        coords /= radius
    return coords


def topk_neighbors(embeddings: np.ndarray, k: int) -> list[list[dict]]:
    """Cosine similarity, top-k excluding self."""
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    normed = embeddings / norms
    sims = normed @ normed.T
    np.fill_diagonal(sims, -np.inf)
    idxs = np.argsort(-sims, axis=1)[:, :k]
    out: list[list[dict]] = []
    for row, neigh in enumerate(idxs):
        out.append(
            [{"idx": int(j), "sim": round(float(sims[row, j]), 4)} for j in neigh]
        )
    return out


DISPLAY_DIM = 256


def display_features(embeddings: np.ndarray, dim: int = DISPLAY_DIM) -> np.ndarray:
    """Standardised [n_terms, dim] feature matrix in roughly [-1, 1].

    Used by the frontend to render each term's vector as a coloured strip.
    The point is *visual* communication of the high-dimensional source object —
    we standardise per-dim across the corpus so most values sit in [-1, 1] and
    the strip looks visually distinct per term."""
    if embeddings.shape[1] <= dim:
        v = embeddings.astype(np.float32)
    else:
        idx = np.linspace(0, embeddings.shape[1] - 1, dim).astype(int)
        v = embeddings[:, idx].astype(np.float32)
    mean = v.mean(axis=0, keepdims=True)
    std = v.std(axis=0, keepdims=True) + 1e-8
    v = (v - mean) / std / 2.5
    return np.clip(v, -1, 1)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", choices=list(BACKENDS), default="gemini")
    parser.add_argument(
        "--model-name",
        default=None,
        help="Override the model identifier passed to the backend.",
    )
    parser.add_argument("--bare-term", action="store_true", help="Embed term only, no definition.")
    parser.add_argument("--seed", type=int, default=42, help="UMAP random_state.")
    parser.add_argument("--neighbors", type=int, default=10, help="Top-k neighbors to precompute.")
    args = parser.parse_args()

    terms_data = json.loads(TERMS_PATH.read_text(encoding="utf-8"))
    terms: list[dict] = terms_data["terms"]
    print(f"Loaded {len(terms)} terms from {TERMS_PATH.name}")

    default_model_name, embed_fn = BACKENDS[args.model]
    model_name = args.model_name or default_model_name
    print(f"Embedding with backend={args.model} model={model_name} bare_term={args.bare_term}")

    texts = [build_embed_text(t, args.bare_term) for t in terms]
    embeddings = embed_fn(texts, model_name)
    assert embeddings.shape[0] == len(terms), "Embedding row count mismatch"
    dim = int(embeddings.shape[1])
    print(f"Embedded -> shape {embeddings.shape}")

    print("Running UMAP -> 2D...")
    xy = reduce_umap(embeddings, n_components=2, seed=args.seed)
    print("Running UMAP -> 3D...")
    xyz = reduce_umap(embeddings, n_components=3, seed=args.seed)

    print(f"Computing top-{args.neighbors} neighbors...")
    neighbors = topk_neighbors(embeddings, args.neighbors)

    print(f"Building display vectors (dim={DISPLAY_DIM})...")
    display = display_features(embeddings)
    display_int8 = np.round(display * 127).astype(int)

    out = {
        "meta": {
            "model_backend": args.model,
            "model_name": model_name,
            "embedding_dim": dim,
            "display_dim": DISPLAY_DIM,
            "bare_term": args.bare_term,
            "umap": {"n_neighbors": 15, "min_dist": 0.12, "metric": "cosine"},
            "computed_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "count": len(terms),
        },
        "terms": [
            {
                "idx": i,
                "term": t["term"],
                "lang": t["lang"],
                "area": t["area"],
                "short": t["short"],
                "pos2": [float(xy[i][0]), float(xy[i][1])],
                "pos3": [float(xyz[i][0]), float(xyz[i][1]), float(xyz[i][2])],
                "vec": display_int8[i].tolist(),
            }
            for i, t in enumerate(terms)
        ],
        "neighbors": neighbors,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {OUT_PATH.relative_to(ROOT)} ({OUT_PATH.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
