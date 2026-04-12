import type { SourceDocument } from "../../types/semantic";

export interface SourcesLicenseGroupItem {
  id: string;
  label: string;
  publisher: string;
  url: string;
  accessModeLabel: string;
  tierLabel: string | null;
  official: boolean;
  description: string | null;
}

export interface SourcesLicenseGroup {
  id: "official" | "private";
  title: string;
  description: string;
  items: SourcesLicenseGroupItem[];
}

export interface SourcesLicenseCatalog {
  policySummary: string;
  sourceSummary: string;
  licenseSummary: string;
  groups: SourcesLicenseGroup[];
}

const ACCESS_MODE_LABELS: Record<NonNullable<SourceDocument["accessMode"]>, string> = {
  api: "API",
  sparql: "SPARQL",
  csv: "CSV",
  excel: "Excel",
  pdf: "PDF",
  html: "HTML"
};

function getAccessModeLabel(accessMode?: SourceDocument["accessMode"]): string {
  return accessMode ? ACCESS_MODE_LABELS[accessMode] : "参照";
}

function toGroupItem(source: SourceDocument): SourcesLicenseGroupItem {
  return {
    id: source.id,
    label: source.label,
    publisher: source.publisher,
    url: source.url,
    accessModeLabel: getAccessModeLabel(source.accessMode),
    tierLabel: source.tier ? `Tier ${source.tier}` : null,
    official: source.official !== false,
    description: source.description ?? null
  };
}

export function buildSourcesLicenseCatalog(sources: SourceDocument[]): SourcesLicenseCatalog {
  const officialItems = sources
    .filter((source) => source.official !== false)
    .sort((left, right) => left.label.localeCompare(right.label, "ja"))
    .map(toGroupItem);

  const privateItems = sources
    .filter((source) => source.official === false)
    .sort((left, right) => left.label.localeCompare(right.label, "ja"))
    .map(toGroupItem);

  return {
    policySummary:
      "このサイトは、政府・公的機関の一次ソースを出典明記前提で参照し、民間ソースは事実記述・要約・リンク中心で扱います。",
    sourceSummary:
      "出典は政府・公的機関ソースと民間企業ソースに分けて掲載し、公開ページから参照できる根拠だけを表示します。",
    licenseSummary:
      "コードのライセンスと、参照しているソース資料の権利処理は同一ではありません。コードは別途ライセンス管理し、データは出典別条件で扱います。",
    groups: [
      {
        id: "official",
        title: "政府・公的機関ソース",
        description: "政府標準利用規約や各機関の公開条件に従って、出典明記を前提に参照しているソースです。",
        items: officialItems
      },
      {
        id: "private",
        title: "民間企業ソース",
        description: "民間ソースは原文転載や再配布ではなく、事実記述・要約・リンクを中心に扱います。",
        items: privateItems
      }
    ]
  };
}
