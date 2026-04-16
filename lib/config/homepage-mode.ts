export type HomepageMode = "default" | "app";

export function resolveHomepageMode(rawValue: string | undefined): HomepageMode {
  return rawValue === "default" ? "default" : "app";
}
