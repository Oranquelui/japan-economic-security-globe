import { AppShell } from "../components/AppShell";
import { loadSeedGraph } from "../lib/data/seed-loader";

export default function Page() {
  const graph = loadSeedGraph();

  return <AppShell graph={graph} />;
}
