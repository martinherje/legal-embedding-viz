export type Lang = "en" | "la";

export type Area =
  | "criminal"
  | "contract"
  | "tort"
  | "admin"
  | "constitutional"
  | "eu"
  | "international"
  | "hr"
  | "procedure"
  | "evidence"
  | "property"
  | "corporate"
  | "tax"
  | "labour"
  | "family"
  | "ip"
  | "bankruptcy"
  | "theory";

export interface Term {
  idx: number;
  term: string;
  lang: Lang;
  area: Area;
  short: string;
  pos2: [number, number];
  pos3: [number, number, number];
  /** Down-sampled embedding for visual display (length DISPLAY_DIM, int8 quantized to [-1, 1]). */
  vec: number[];
}

export interface Neighbor {
  idx: number;
  sim: number;
}

export interface EmbeddingsMeta {
  model_backend: string;
  model_name: string;
  embedding_dim: number;
  display_dim?: number;
  bare_term: boolean;
  computed_at: string;
  count: number;
  umap: {
    n_neighbors: number;
    min_dist: number;
    metric: string;
  };
}

export interface EmbeddingsPayload {
  meta: EmbeddingsMeta;
  terms: Term[];
  neighbors: Neighbor[][];
}
