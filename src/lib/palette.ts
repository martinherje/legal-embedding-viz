import type { Area, Lang } from "./types";

export const AREA_COLOR: Record<Area, string> = {
  criminal: "#ff5a6e",          // bright red
  procedure: "#b97afe",          // violet
  evidence: "#7e88ff",           // indigo
  contract: "#ffb066",            // warm orange
  tort: "#ff8c6b",               // coral
  property: "#d49aa3",            // dusty rose
  corporate: "#e58cff",           // pink-purple
  admin: "#3ed1bb",               // bright teal
  constitutional: "#5fb3e8",      // sky blue
  eu: "#6c8cff",                  // periwinkle
  international: "#5db3ff",       // azure
  hr: "#3fdcff",                  // cyan
  tax: "#ffd14d",                 // amber
  labour: "#9ed94a",              // lime
  family: "#ff8ab1",              // pink
  ip: "#ffb340",                  // gold
  bankruptcy: "#d4af8b",          // tan
  theory: "#b8b8e8",              // lavender
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
