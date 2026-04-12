import type { ThemeId } from "../../types/semantic";
import type { OperationRow } from "./operations";
import { getDomesticImpactCopy } from "./domestic-copy";

export type InboxSection = {
  id: "priority" | "watch" | "domestic";
  label: string;
  description: string;
  rows: OperationRow[];
};

export function buildInboxSections(themeId: ThemeId, rows: OperationRow[]): InboxSection[] {
  const domesticCopy = getDomesticImpactCopy(themeId);
  const priorityRows = sortRows(rows.filter((row) => row.urgency === "高" || row.status === "要確認"), "priority");
  const claimedIds = new Set(priorityRows.map((row) => row.id));

  const watchRows = sortRows(
    rows.filter((row) => row.status === "監視中" && !claimedIds.has(row.id)),
    "watch"
  );
  for (const row of watchRows) {
    claimedIds.add(row.id);
  }

  const domesticRows = sortRows(
    rows.filter(
      (row) =>
        !claimedIds.has(row.id) &&
        (row.status === "表示対象" ||
          row.type.includes("国内") ||
          row.type.includes("拠点") ||
          row.subject.includes("国内"))
    ),
    "domestic"
  );

  return [
    {
      id: "priority",
      label: "優先監視",
      description: "まず確認すべき高リスクと要確認シグナル",
      rows: priorityRows
    },
    {
      id: "watch",
      label: "継続監視",
      description: "継続的に追うべき依存・価格・供給シグナル",
      rows: watchRows
    },
    {
      id: "domestic",
      label: domesticCopy.label,
      description: domesticCopy.description,
      rows: domesticRows
    }
  ];
}

function sortRows(rows: OperationRow[], sectionId: InboxSection["id"]) {
  const severityScore = (value: string) => {
    if (value === "高") return 3;
    if (value === "中") return 2;
    return 1;
  };

  const statusScore = (value: string) => {
    if (value === "要確認") return 3;
    if (value === "監視中") return 2;
    return 1;
  };

  const domesticScore = (row: OperationRow) => {
    const normalized = `${row.type} ${row.label}`;

    if (/(港湾|受入基地|基地|製油所|国内着地点|ターミナル)/.test(normalized)) {
      return 3;
    }

    if (/(貯水池|ダム|リザーバー)/.test(normalized)) {
      return 2;
    }

    if (/(都道府県|地域|県|府|道)/.test(normalized)) {
      return 1;
    }

    return 0;
  };

  return [...rows].sort((left, right) => {
    if (sectionId === "domestic") {
      const domesticDiff = domesticScore(right) - domesticScore(left);
      if (domesticDiff !== 0) {
        return domesticDiff;
      }

      const sortValueDiff = (right.sortValue ?? 0) - (left.sortValue ?? 0);
      if (sortValueDiff !== 0) {
        return sortValueDiff;
      }
    }

    const severityDiff = severityScore(right.urgency) - severityScore(left.urgency);
    if (severityDiff !== 0) {
      return severityDiff;
    }

    const statusDiff = statusScore(right.status) - statusScore(left.status);
    if (statusDiff !== 0) {
      return statusDiff;
    }

    return left.label.localeCompare(right.label, "ja");
  });
}
