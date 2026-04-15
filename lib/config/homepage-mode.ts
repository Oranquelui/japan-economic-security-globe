export type HomepageMode = "default" | "app";

export function resolveHomepageMode(rawValue: string | undefined): HomepageMode {
  return rawValue === "app" ? "app" : "default";
}
