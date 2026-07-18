import type { SourceCategory, SourceDocument, SourceRights } from "../../types/semantic";

export interface SourcesLicenseGroupItem {
  id: string;
  label: string;
  publisher: string;
  url: string;
  accessModeLabel: string;
  tierLabel: string | null;
  official: boolean;
  description: string | null;
  rights: SourceRights | null;
}

export interface SourcesLicenseGroup {
  id: SourceCategory;
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
  ckan: "CKAN",
  csv: "CSV",
  excel: "Excel",
  geojson: "GeoJSON",
  tile: "Tile",
  pdf: "PDF",
  html: "HTML"
};

function getAccessModeLabel(accessMode?: SourceDocument["accessMode"]): string {
  return accessMode ? ACCESS_MODE_LABELS[accessMode] : "参照";
}

export function resolveSourceCategory(
  source: Pick<SourceDocument, "official" | "sourceCategory">
): SourceCategory {
  return source.sourceCategory ?? (source.official === false ? "private" : "official");
}

function toGroupItem(source: SourceDocument): SourcesLicenseGroupItem {
  const sourceCategory = resolveSourceCategory(source);

  return {
    id: source.id,
    label: source.label,
    publisher: source.publisher,
    url: source.url,
    accessModeLabel: getAccessModeLabel(source.accessMode),
    tierLabel: source.tier ? `Tier ${source.tier}` : null,
    official: sourceCategory === "official",
    description: source.description ?? null,
    rights: source.rights ?? null
  };
}

export function buildSourcesLicenseCatalog(sources: SourceDocument[]): SourcesLicenseCatalog {
  const itemsByCategory: Record<SourceCategory, SourcesLicenseGroupItem[]> = {
    official: [],
    "open-data": [],
    private: []
  };

  for (const source of [...sources].sort((left, right) => left.label.localeCompare(right.label, "ja"))) {
    itemsByCategory[resolveSourceCategory(source)].push(toGroupItem(source));
  }

  return {
    policySummary:
      "このサイトは、政府・公的機関の一次ソースを出典明記前提で参照し、公開・オープンデータは各ソース固有の公開利用条件に従って再利用し、民間ソースは事実記述・要約・リンク中心で扱います。",
    sourceSummary:
      "出典は政府・公的機関ソース、公開・オープンデータ、民間企業ソースに分けて掲載し、公開ページから参照できる根拠だけを表示します。",
    licenseSummary:
      "コードのライセンスと、政府・公的機関資料、公開・オープンデータ、民間企業資料それぞれの権利処理は同一ではありません。コードは別途ライセンス管理し、データは出典別条件で扱います。",
    groups: [
      {
        id: "official",
        title: "政府・公的機関ソース",
        description: "政府・公的機関が公表する一次資料を、政府標準利用規約や各機関の公開条件に従い、出典明記を前提に参照しています。",
        items: itemsByCategory.official
      },
      {
        id: "open-data",
        title: "公開・オープンデータ",
        description: "再利用可能な公開データを、各ソース固有の利用条件と出典表記に従って加工・掲載しています。",
        items: itemsByCategory["open-data"]
      },
      {
        id: "private",
        title: "民間企業ソース",
        description: "民間企業が公表する資料は、原文転載やデータ再配布ではなく、事実記述・要約・リンクを中心に扱います。",
        items: itemsByCategory.private
      }
    ]
  };
}
