import { AppShell } from "../components/AppShell";
import { loadSeedGraph } from "../lib/data/seed-loader";
import { parseOperationsUrlState } from "../lib/presentation/url-state";

export default async function Page({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const graph = loadSeedGraph();
  const initialUrlState = parseOperationsUrlState(await searchParams);

  return <AppShell graph={graph} initialUrlState={initialUrlState} />;
}
