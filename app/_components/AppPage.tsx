import { AppShell } from "../../components/AppShell";
import { resolveHomepageMode } from "../../lib/config/homepage-mode";
import { loadSeedGraph, loadSeedRankingSignals } from "../../lib/data/seed-loader";
import { parseOperationsUrlState } from "../../lib/presentation/url-state";

interface AppPageProps {
  locale?: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function AppPage({ locale, searchParams }: AppPageProps) {
  const graph = loadSeedGraph();
  const rankingSignals = loadSeedRankingSignals();
  const resolvedSearchParams = await searchParams;
  const initialUrlState = parseOperationsUrlState(resolvedSearchParams);
  const hasExplicitUrlState = ["theme", "mode", "selected"].some((key) => {
    const value = resolvedSearchParams[key];

    return Array.isArray(value) ? value.some(Boolean) : Boolean(value);
  });
  const homepageMode = resolveHomepageMode(process.env.NEXT_PUBLIC_HOMEPAGE_MODE);
  const resolvedLocale = locale === "en" ? "en" : "ja";

  return (
    <AppShell
      graph={graph}
      hasExplicitUrlState={hasExplicitUrlState}
      homepageMode={homepageMode}
      initialUrlState={initialUrlState}
      locale={resolvedLocale}
      rankingSignals={rankingSignals}
    />
  );
}
