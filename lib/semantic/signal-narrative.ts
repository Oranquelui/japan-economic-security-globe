import type { SignalNarrativeViewModel } from "../../types/presentation";
import type { DependencyFlow, Observation, SemanticEntity, SourceDocument } from "../../types/semantic";

export function buildSignalNarrativeForFlow(flow: DependencyFlow): SignalNarrativeViewModel {
  if (flow.theme === "energy") {
    if (flow.id.includes("qatar") || flow.id.includes("saudi") || flow.routeIds.some((id) => id.includes("hormuz") || id.includes("malacca"))) {
      return {
        category: "海上ルート依存",
        severity: "高",
        status: "監視中",
        recommendedAction: flow.resourceId === "resource:lng" ? "LNG調達と電気料金の連動を確認" : "海上ルートと燃料供給の連動を確認",
        watchpoints: dedupeWatchpoints([
          flow.routeIds.includes("chokepoint:hormuz") ? "ホルムズ海峡" : null,
          flow.routeIds.includes("chokepoint:malacca") ? "マラッカ海峡" : null,
          flow.resourceId === "resource:lng" ? "電気料金" : "燃料価格",
          "国内着地点"
        ])
      };
    }

    return {
      category: "供給集中",
      severity: "中",
      status: "監視中",
      recommendedAction: "供給先の偏りと代替余地を確認",
      watchpoints: ["調達先集中", "国内受入拠点", "代替供給"]
    };
  }

  if (flow.theme === "rice") {
    return {
      category: "価格波及",
      severity: "高",
      status: "要確認",
      recommendedAction: "コメ価格と投入コストの波及を確認",
      watchpoints: ["肥料原料", "燃料価格", "生産地"]
    };
  }

  if (flow.theme === "defense") {
    return {
      category: "予算重点",
      severity: "中",
      status: "要確認",
      recommendedAction: "予算配分と能力領域のつながりを確認",
      watchpoints: ["能力領域", "予算額", "政策文書"]
    };
  }

  if (flow.theme === "semiconductors") {
    return {
      category: "供給網依存",
      severity: "中",
      status: "監視中",
      recommendedAction: "供給国と産業基盤の結びつきを確認",
      watchpoints: ["供給国", "装置依存", "政策連携"]
    };
  }

  return {
    category: "依存シグナル",
    severity: "中",
    status: "要確認",
    recommendedAction: "関係先と出典を確認",
    watchpoints: ["関連主体", "出典", "時点"]
  };
}

export function buildSignalNarrativeForObservation(observation: Observation): SignalNarrativeViewModel {
  if (observation.id === "observation:rice-price-signal-2026") {
    return {
      category: "価格圧力",
      severity: "高",
      status: "要確認",
      recommendedAction: "価格の持続性と家計への波及を確認",
      watchpoints: ["次月価格", "民間在庫", "政策介入"]
    };
  }

  if (observation.id === "observation:rice-private-inventory-feb-2026") {
    return {
      category: "在庫圧力",
      severity: "高",
      status: "要確認",
      recommendedAction: "在庫水準と放出判断を確認",
      watchpoints: ["民間在庫", "備蓄米", "流通量"]
    };
  }

  if (observation.id === "observation:rice-stockpile-policy-2026") {
    return {
      category: "政策注目",
      severity: "中",
      status: "要確認",
      recommendedAction: "備蓄政策と市場介入の条件を確認",
      watchpoints: ["備蓄放出", "制度改正", "国会論点"]
    };
  }

  if (observation.id === "observation:ogochi-reservoir-stress") {
    return {
      category: "貯水逼迫",
      severity: "高",
      status: "要確認",
      recommendedAction: "貯水率と節水局面への移行を確認",
      watchpoints: ["貯水率", "降水状況", "取水制限"]
    };
  }

  if (observation.id === "observation:lng-electricity-april-2026") {
    return {
      category: "家計コスト圧力",
      severity: "高",
      status: "監視中",
      recommendedAction: "LNG市況と電気料金の連動を確認",
      watchpoints: ["LNG調達", "電気料金", "燃料費調整"]
    };
  }

  if (observation.kind === "BudgetObservation") {
    return {
      category: "予算重点",
      severity: "中",
      status: "要確認",
      recommendedAction: "予算規模と能力領域の重点化を確認",
      watchpoints: ["予算額", "能力領域", "年度比較"]
    };
  }

  if (observation.kind === "PolicySignal") {
    return {
      category: "政策注目",
      severity: "中",
      status: "要確認",
      recommendedAction: "政策文書と制度変更の関連を確認",
      watchpoints: ["政策文書", "法令", "市場影響"]
    };
  }

  return {
    category: "観測シグナル",
    severity: "中",
    status: "要確認",
    recommendedAction: "観測値と周辺条件を確認",
    watchpoints: ["観測値", "時点", "出典"]
  };
}

export function buildSignalNarrativeForEntity(entity: SemanticEntity): SignalNarrativeViewModel {
  if (entity.kind === "Reservoir") {
    return {
      category: "水供給拠点",
      severity: "中",
      status: "表示対象",
      recommendedAction: "供給拠点と関連観測を確認",
      watchpoints: ["貯水率", "地域供給", "渇水兆候"]
    };
  }

  if (entity.kind === "Port" || entity.kind === "Terminal" || entity.kind === "Refinery") {
    return {
      category: "国内着地点",
      severity: "通常",
      status: "表示対象",
      recommendedAction: "どこで国内影響に変わるかを確認",
      watchpoints: ["着地点", "接続ルート", "国内影響"]
    };
  }

  return {
    category: "関連主体",
    severity: "通常",
    status: "表示対象",
    recommendedAction: "関連フローと出典を確認",
    watchpoints: ["関連フロー", "出典", "位置づけ"]
  };
}

export function buildSourceHighlightsFromObservation(observation: Observation, sources: SourceDocument[]) {
  const provenanceClaims = observation.provenance
    .filter((item) => item.claim)
    .map((item) => ({ sourceId: item.sourceId, claim: item.claim! }));

  if (provenanceClaims.length > 0) {
    return provenanceClaims;
  }

  return sources
    .filter((source) => source.description)
    .map((source) => ({ sourceId: source.id, claim: source.description! }));
}

export function buildSourceHighlightsFromFlow(flow: DependencyFlow, sources: SourceDocument[]) {
  const highlights = [
    flow.magnitudeLabel ? { sourceId: flow.sourceIds[0] ?? "source:unknown", claim: `規模の見立て: ${flow.magnitudeLabel}` } : null,
    flow.riskLabel ? { sourceId: flow.sourceIds[0] ?? "source:unknown", claim: `主なリスク: ${flow.riskLabel}` } : null,
    ...sources.filter((source) => source.description).map((source) => ({ sourceId: source.id, claim: source.description! }))
  ].filter(Boolean) as Array<{ sourceId: string; claim: string }>;

  return dedupeClaims(highlights);
}

export function buildSourceHighlightsFromEntity(entity: SemanticEntity, sources: SourceDocument[]) {
  const highlights = [
    entity.whyItMatters ? { sourceId: entity.sourceIds?.[0] ?? entity.provenance[0] ?? "source:unknown", claim: entity.whyItMatters } : null,
    ...sources.filter((source) => source.description).map((source) => ({ sourceId: source.id, claim: source.description! }))
  ].filter(Boolean) as Array<{ sourceId: string; claim: string }>;

  return dedupeClaims(highlights);
}

function dedupeWatchpoints(values: Array<string | null>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

function dedupeClaims(claims: Array<{ sourceId: string; claim: string }>) {
  const seen = new Set<string>();

  return claims.filter((claim) => {
    const key = `${claim.sourceId}:${claim.claim}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
