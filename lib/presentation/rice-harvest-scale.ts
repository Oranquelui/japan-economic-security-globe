/** Absolute tonnage classes shared by the map and both legends. */
export const RICE_HARVEST_BINS = [
  { min: 0, color: "#4b493e", label: "10万トン未満" },
  { min: 100000, color: "#73623f", label: "10〜20万トン" },
  { min: 200000, color: "#a07f43", label: "20〜30万トン" },
  { min: 300000, color: "#c49c51", label: "30〜40万トン" },
  { min: 400000, color: "#edc873", label: "40万トン以上" }
] as const;
export const RICE_MISSING_COLOR = "#56616d";
