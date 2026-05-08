import type { Area, Lang } from "./types";

export const AREA_COLOR: Record<Area, string> = {
  criminal: "#e63946",
  contract: "#f4a261",
  tort: "#e76f51",
  admin: "#2a9d8f",
  constitutional: "#264653",
  eu: "#4361ee",
  hr: "#06aed5",
  procedure: "#9d4edd",
  property: "#b5838d",
  tax: "#ffba08",
  labour: "#80b918",
  family: "#ff6b9d",
  theory: "#6c757d",
};

export const AREA_LABEL: Record<Area, string> = {
  criminal: "Criminal",
  contract: "Contract",
  tort: "Tort",
  admin: "Administrative",
  constitutional: "Constitutional",
  eu: "EU",
  hr: "Human rights",
  procedure: "Procedure",
  property: "Property",
  tax: "Tax",
  labour: "Labour",
  family: "Family",
  theory: "Theory / AI",
};

export const LANG_LABEL: Record<Lang, string> = {
  en: "English",
  no: "Norwegian",
  la: "Latin",
};
