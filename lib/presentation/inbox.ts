import type { OperationRow } from "./operations";

export type InboxSection = {
  id: "priority" | "watch" | "domestic";
  label: string;
  description: string;
  rows: OperationRow[];
};

export function buildInboxSections(rows: OperationRow[]): InboxSection[] {
  const priorityRows = sortRows(rows.filter((row) => row.urgency === "高" || row.status === "要確認"));
  const claimedIds = new Set(priorityRows.map((row) => row.id));

  const watchRows = sortRows(
    rows.filter((row) => row.status === "監視中" && !claimedIds.has(row.id))
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
    )
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
      label: "国内着地点",
      description: "日本国内で着地する港湾・基地・地域シグナル",
      rows: domesticRows
    }
  ];
}

function sortRows(rows: OperationRow[]) {
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

  return [...rows].sort((left, right) => {
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
