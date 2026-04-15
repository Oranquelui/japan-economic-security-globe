import { AppShell } from "../../components/AppShell";
import { resolveHomepageMode } from "../../lib/config/homepage-mode";
import { loadSeedGraph } from "../../lib/data/seed-loader";
import { parseOperationsUrlState } from "../../lib/presentation/url-state";

interface AppPageProps {
  locale?: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function AppPage({ locale, searchParams }: AppPageProps) {
  const graph = loadSeedGraph();
  const initialUrlState = parseOperationsUrlState(await searchParams);
  const homepageMode = resolveHomepageMode(process.env.NEXT_PUBLIC_HOMEPAGE_MODE);
  const resolvedLocale = locale === "en" ? "en" : "ja";

  return <AppShell graph={graph} homepageMode={homepageMode} initialUrlState={initialUrlState} locale={resolvedLocale} />;
}
