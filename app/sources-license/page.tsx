import type { Metadata } from "next";

import { SourcesLicensePage } from "../../components/SourcesLicensePage";
import { loadSeedGraph } from "../../lib/data/seed-loader";

export const metadata: Metadata = {
  title: "Sources / License | 日本経済安全保障マップ",
  description: "出典ソース、利用方針、ライセンス情報。"
};

export default function Page() {
  return <SourcesLicensePage sources={loadSeedGraph().sources} />;
}
