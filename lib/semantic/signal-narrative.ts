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
      recommendedAction: "石炭調達の偏りと国内着地点の代替余地を確認",
      watchpoints: ["調達先集中", "国内着地点", "代替供給"]
    };
  }

  if (flow.theme === "rice") {
    return {
      category: "投入コスト波及",
      severity: "高",
      status: "要確認",
      recommendedAction: "肥料原料と燃料価格が相対取引価格へどう波及するか確認",
      watchpoints: ["肥料原料", "相対取引価格", "民間在庫"]
    };
  }

  if (flow.theme === "defense") {
    if (flow.id === "flow:defense-budget-standoff") {
      return {
        category: "能力優先配分",
        severity: "中",
        status: "要確認",
        recommendedAction: "スタンド・オフ能力に配分された予算規模と継続性を確認",
        watchpoints: ["予算額", "能力領域", "継続性"]
      };
    }

    if (flow.id === "flow:defense-budget-integrated-air-missile") {
      return {
        category: "能力優先配分",
        severity: "中",
        status: "要確認",
        recommendedAction: "防空・ミサイル防衛の重点配分と継続性を確認",
        watchpoints: ["予算額", "能力領域", "継続性"]
      };
    }

    if (flow.id === "flow:defense-budget-unmanned") {
      return {
        category: "能力優先配分",
        severity: "中",
        status: "要確認",
        recommendedAction: "無人防衛能力の重点配分と継続性を確認",
        watchpoints: ["予算額", "能力領域", "継続性"]
      };
    }

    return {
      category: "能力優先配分",
      severity: "中",
      status: "要確認",
      recommendedAction: "予算配分と能力領域のつながりを確認",
      watchpoints: ["能力領域", "予算額", "政策文書"]
    };
  }

  if (flow.theme === "semiconductors") {
    if (flow.id === "flow:netherlands-equipment-japan") {
      return {
        category: "装置依存",
        severity: "中",
        status: "監視中",
        recommendedAction: "先端装置の供給継続性と代替調達を確認",
        watchpoints: ["装置供給", "代替調達", "国内製造"]
      };
    }

    if (flow.id === "flow:taiwan-semiconductors-japan") {
      return {
        category: "先端製造依存",
        severity: "高",
        status: "監視中",
        recommendedAction: "台湾の先端製造依存と国内代替余地を確認",
        watchpoints: ["先端製造", "台湾海峡", "国内代替"]
      };
    }

    if (flow.id === "flow:china-semiconductor-risk-japan") {
      return {
        category: "近隣リスク露出",
        severity: "高",
        status: "要確認",
        recommendedAction: "中国関連の供給網露出と代替調達を確認",
        watchpoints: ["近隣供給網", "輸出規制", "代替調達"]
      };
    }

    if (flow.id === "flow:us-semiconductor-policy-japan") {
      return {
        category: "政策協調",
        severity: "中",
        status: "監視中",
        recommendedAction: "政策協調と国内投資の接続を確認",
        watchpoints: ["政策協調", "輸出管理", "国内投資"]
      };
    }

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
      category: "備蓄政策注目",
      severity: "中",
      status: "要確認",
      recommendedAction: "備蓄政策と市場介入の条件を確認",
      watchpoints: ["備蓄放出", "制度改正", "流通量"]
    };
  }

  if (observation.id === "observation:ogochi-reservoir-stress") {
    return {
      category: "貯水逼迫",
      severity: "高",
      status: "要確認",
      recommendedAction: "貯水率34%と節水局面への移行条件を確認",
      watchpoints: ["貯水率", "降水状況", "節水要請"]
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
      category: "能力予算観測",
      severity: "中",
      status: "要確認",
      recommendedAction: "予算規模と能力領域の重点化を確認",
      watchpoints: ["予算額", "能力領域", "年度比較"]
    };
  }

  if (observation.id === "observation:semiconductor-policy-signal-2026") {
    return {
      category: "産業基盤政策",
      severity: "中",
      status: "要確認",
      recommendedAction: "設備投資と政策文書、貿易統計の接続を確認",
      watchpoints: ["設備投資", "政策文書", "貿易統計"]
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
  if (entity.kind === "Country" && entity.id !== "country:japan") {
    return {
      category: "対外依存先",
      severity: "通常",
      status: "表示対象",
      recommendedAction: "日本との結びつきと代替余地を確認",
      watchpoints: ["依存先", "代替余地", "政策関係"]
    };
  }

  if (entity.kind === "Chokepoint") {
    return {
      category: "海上ボトルネック",
      severity: "高",
      status: "表示対象",
      recommendedAction: "通航リスクが日本の供給へどう波及するか確認",
      watchpoints: ["通航リスク", "代替航路", "国内影響"]
    };
  }

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
    buildFlowClaim(flow),
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

function buildFlowClaim(flow: DependencyFlow) {
  const sourceId = flow.sourceIds[0] ?? "source:unknown";

  switch (flow.id) {
    case "flow:qatar-lng-japan":
      return { sourceId, claim: "カタールLNGはホルムズ海峡とマラッカ海峡を経由して日本へ向かう。"};
    case "flow:saudi-oil-japan":
      return { sourceId, claim: "サウジ原油は湾岸から日本へ向かう海上ルートに強く依存する。"};
    case "flow:australia-coal-japan":
      return { sourceId, claim: "石炭調達は豪州依存と国内着地点の集中を同時に見る必要がある。"};
    case "flow:energy-inputs-rice":
      return { sourceId, claim: "肥料原料と燃料価格の変動がコメの相対取引価格へ波及する橋渡しフロー。"};
    case "flow:defense-budget-standoff":
      return { sourceId, claim: "FY2026で約9,733億円がスタンド・オフ能力へ配分されている。"};
    case "flow:defense-budget-integrated-air-missile":
      return { sourceId, claim: "FY2026で約5,091億円が一体防空・ミサイル防衛能力へ配分されている。"};
    case "flow:defense-budget-unmanned":
      return { sourceId, claim: "FY2026で約2,773億円が無人防衛能力へ配分されている。"};
    case "flow:netherlands-equipment-japan":
      return { sourceId, claim: "日本の先端半導体基盤はオランダの装置供給に依存する側面がある。"};
    case "flow:taiwan-semiconductors-japan":
      return { sourceId, claim: "台湾の先端製造能力は日本の半導体供給網で戦略的な比重を持つ。"};
    case "flow:china-semiconductor-risk-japan":
      return { sourceId, claim: "中国関連の供給網露出は代替調達と政策対応を同時に見る必要がある。"};
    case "flow:us-semiconductor-policy-japan":
      return { sourceId, claim: "米国との政策協調は国内投資と供給網再構築の前提になる。"};
    default:
      return null;
  }
}
