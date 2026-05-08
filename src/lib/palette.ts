import type { Area, Lang } from "./types";

export const AREA_COLOR: Record<Area, string> = {
  criminal: "#e63946",
  procedure: "#9d4edd",
  evidence: "#7c4dff",
  contract: "#f4a261",
  tort: "#e76f51",
  property: "#b5838d",
  corporate: "#c77dff",
  admin: "#2a9d8f",
  constitutional: "#264653",
  eu: "#4361ee",
  international: "#3a86ff",
  hr: "#06aed5",
  tax: "#ffba08",
  labour: "#80b918",
  family: "#ff6b9d",
  ip: "#ff9e00",
  bankruptcy: "#a07c5b",
  theory: "#9aa0aa",
};

export const AREA_LABEL: Record<Area, string> = {
  criminal: "Criminal",
  procedure: "Procedure",
  evidence: "Evidence",
  contract: "Contract",
  tort: "Tort",
  property: "Property",
  corporate: "Corporate",
  admin: "Administrative",
  constitutional: "Constitutional",
  eu: "EU",
  international: "International",
  hr: "Human rights",
  tax: "Tax",
  labour: "Labour",
  family: "Family",
  ip: "IP",
  bankruptcy: "Bankruptcy",
  theory: "Theory & jurisprudence",
};

export const LANG_LABEL: Record<Lang, string> = {
  en: "English",
  la: "Latin",
};
