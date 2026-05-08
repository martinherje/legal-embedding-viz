export type Lang = "en" | "no" | "la";

export type Area =
  | "criminal"
  | "contract"
  | "tort"
  | "admin"
  | "constitutional"
  | "eu"
  | "hr"
  | "procedure"
  | "property"
  | "tax"
  | "labour"
  | "family"
  | "theory";

export interface Term {
  idx: number;
  term: string;
  lang: Lang;
  area: Area;
  short: string;
  pos2: [number, number];
  pos3: [number, number, number];
}

export interface Neighbor {
  idx: number;
  sim: number;
}

export interface EmbeddingsMeta {
  model_backend: string;
  model_name: string;
  embedding_dim: number;
  bare_term: boolean;
  computed_at: string;
  count: number;
  umap: {
    n_components: number;
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
