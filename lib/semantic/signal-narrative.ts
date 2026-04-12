import type { SignalNarrativeViewModel } from "../../types/presentation";
import type { DependencyFlow, Observation, SemanticEntity, SourceDocument } from "../../types/semantic";

type SourceHighlight = { sourceId: string; claim: string };

export function buildSignalNarrativeForFlow(flow: DependencyFlow): SignalNarrativeViewModel {
  if (flow.theme === "energy") {
    if (flow.id.includes("qatar") || flow.id.includes("saudi") || flow.routeIds.some((id) => id.includes("hormuz") || id.includes("malacca"))) {
      return {
        category: "海上ルート依存",
        severity: "高",
        status: "監視中",
        recommendedAction:
          flow.resourceId === "resource:lng"
            ? "LNG調達、燃料費調整、国内受入基地のつながりを確認"
            : "湾岸航路、燃料価格、国内製油所のつながりを確認",
        watchpoints: dedupeWatchpoints([
          flow.routeIds.includes("chokepoint:hormuz") ? "ホルムズ海峡" : null,
          flow.routeIds.includes("chokepoint:malacca") ? "マラッカ海峡" : null,
          flow.resourceId === "resource:lng" ? "燃料費調整" : "燃料価格",
          "国内着地点"
        ])
      };
    }

    return {
      category: "供給集中",
      severity: "中",
      status: "監視中",
      recommendedAction: "豪州偏重と国内港湾での受け止め方を確認",
      watchpoints: ["調達先集中", "国内着地点", "代替調達"]
    };
  }

  if (flow.theme === "rice") {
    return {
      category: "投入コスト波及",
      severity: "高",
      status: "要確認",
      recommendedAction: "燃料・肥料コストが新潟など主産地の価格へどう波及するか確認",
      watchpoints: ["肥料原料", "相対取引価格", "民間在庫", "主産地"]
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

    if (flow.id === "flow:korea-semiconductors-japan") {
      return {
        category: "近隣供給網",
        severity: "中",
        status: "監視中",
        recommendedAction: "韓国との近隣供給網依存と代替調達余地を確認",
        watchpoints: ["近隣供給網", "代替調達", "対日供給"]
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
      recommendedAction: "35,056円/60kgの高止まりが次月も続くかを確認",
      watchpoints: ["次月価格", "民間在庫", "家計負担", "政策介入"]
    };
  }

  if (observation.id === "observation:rice-private-inventory-feb-2026") {
    return {
      category: "在庫圧力",
      severity: "高",
      status: "要確認",
      recommendedAction: "300万玄米トンの在庫水準と放出判断を確認",
      watchpoints: ["民間在庫", "備蓄米", "流通量", "前年比"]
    };
  }

  if (observation.id === "observation:rice-stockpile-policy-2026") {
    return {
      category: "備蓄政策注目",
      severity: "中",
      status: "要確認",
      recommendedAction: "備蓄放出の条件と制度根拠を確認",
      watchpoints: ["備蓄放出", "制度根拠", "流通量"]
    };
  }

  if (observation.id === "observation:ogochi-reservoir-stress") {
    return {
      category: "貯水逼迫",
      severity: "高",
      status: "要確認",
      recommendedAction: "小河内ダム34%から取水制限へ進む条件を確認",
      watchpoints: ["貯水率", "降水状況", "取水制限", "節水要請"]
    };
  }

  if (observation.id === "observation:lng-electricity-april-2026") {
    return {
      category: "家計コスト圧力",
      severity: "高",
      status: "監視中",
      recommendedAction: "LNG市況が電気料金へどう波及するかを確認",
      watchpoints: ["LNG調達", "電気料金", "燃料費調整", "家計負担"]
    };
  }

  if (observation.id === "observation:defense-budget-standoff-fy2026") {
    return {
      category: "能力予算観測",
      severity: "中",
      status: "要確認",
      recommendedAction: "スタンド・オフ能力へ配分された973.3億円規模の重みを確認",
      watchpoints: ["予算額", "スタンド・オフ能力", "継続性"]
    };
  }

  if (observation.id === "observation:defense-budget-iamd-fy2026") {
    return {
      category: "能力予算観測",
      severity: "中",
      status: "要確認",
      recommendedAction: "一体防空・ミサイル防衛の重点配分を確認",
      watchpoints: ["予算額", "防空ミサイル防衛", "継続性"]
    };
  }

  if (observation.id === "observation:defense-budget-unmanned-fy2026") {
    return {
      category: "能力予算観測",
      severity: "中",
      status: "要確認",
      recommendedAction: "無人防衛能力への重点配分と用途を確認",
      watchpoints: ["予算額", "無人能力", "継続性"]
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
      recommendedAction: "設備投資、首相官邸の政策発信、貿易統計の接続を確認",
      watchpoints: ["設備投資", "政策文書", "貿易統計", "経済安全保障"]
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
  const generatedClaims = sources.flatMap((source) => buildObservationClaimsForSource(observation, source));

  const provenanceClaims = observation.provenance
    .filter((item) => item.claim)
    .map((item) => ({ sourceId: item.sourceId, claim: item.claim! }));

  return dedupeClaims([
    ...generatedClaims,
    ...provenanceClaims,
    ...sources.filter((source) => source.description).map((source) => ({ sourceId: source.id, claim: source.description! }))
  ]);
}

export function buildSourceHighlightsFromFlow(flow: DependencyFlow, sources: SourceDocument[]) {
  const highlights = [
    ...sources.flatMap((source) => buildFlowClaimsForSource(flow, source)),
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

function buildFlowClaimsForSource(flow: DependencyFlow, source: SourceDocument): SourceHighlight[] {
  switch (flow.id) {
    case "flow:qatar-lng-japan":
      return buildQatarLngClaims(source.id);
    case "flow:saudi-oil-japan":
      return buildSaudiOilClaims(source.id);
    case "flow:australia-coal-japan":
      return buildAustraliaCoalClaims(source.id);
    case "flow:energy-inputs-rice":
      return buildRiceInputClaims(source.id);
    case "flow:defense-budget-standoff":
      return buildDefenseFlowClaims(source.id, "スタンド・オフ能力", "約9,733億円");
    case "flow:defense-budget-integrated-air-missile":
      return buildDefenseFlowClaims(source.id, "一体防空・ミサイル防衛", "約5,091億円");
    case "flow:defense-budget-unmanned":
      return buildDefenseFlowClaims(source.id, "無人防衛能力", "約2,773億円");
    case "flow:taiwan-semiconductors-japan":
      return buildSemiconductorFlowClaims(source.id, "台湾", "先端製造");
    case "flow:korea-semiconductors-japan":
      return buildSemiconductorFlowClaims(source.id, "韓国", "近隣供給網");
    case "flow:netherlands-equipment-japan":
      return buildSemiconductorFlowClaims(source.id, "オランダ", "装置供給");
    case "flow:us-semiconductor-policy-japan":
      return buildSemiconductorFlowClaims(source.id, "米国", "政策協調");
    case "flow:china-semiconductor-risk-japan":
      return buildSemiconductorFlowClaims(source.id, "中国", "供給網露出");
    default:
      return [];
  }
}

function buildObservationClaimsForSource(observation: Observation, source: SourceDocument): SourceHighlight[] {
  switch (observation.id) {
    case "observation:lng-electricity-april-2026":
      return buildLngElectricityClaims(source.id);
    case "observation:rice-price-signal-2026":
      return buildRicePriceClaims(source.id);
    case "observation:rice-private-inventory-feb-2026":
      return buildRiceInventoryClaims(source.id);
    case "observation:rice-stockpile-policy-2026":
      return buildRicePolicyClaims(source.id);
    case "observation:ogochi-reservoir-stress":
      return buildWaterStressClaims(source.id);
    case "observation:defense-budget-standoff-fy2026":
      return buildDefenseObservationClaims(source.id, "スタンド・オフ能力", "約9,733億円");
    case "observation:defense-budget-iamd-fy2026":
      return buildDefenseObservationClaims(source.id, "一体防空・ミサイル防衛", "約5,091億円");
    case "observation:defense-budget-unmanned-fy2026":
      return buildDefenseObservationClaims(source.id, "無人防衛能力", "約2,773億円");
    case "observation:semiconductor-policy-signal-2026":
      return buildSemiconductorPolicyClaims(source.id);
    default:
      return [];
  }
}

function buildQatarLngClaims(sourceId: string): SourceHighlight[] {
  switch (sourceId) {
    case "source:customs-trade-statistics":
      return [{ sourceId, claim: "財務省貿易統計でLNGの国別輸入構成を確認する入口になる。" }];
    case "source:enecho-energy-trends":
      return [{ sourceId, claim: "資源エネルギー庁資料は中東依存とLNG調達の全体像を示す。" }];
    case "source:meti-2026-energy-taskforce":
      return [{ sourceId, claim: "中東情勢対策ポータルは供給不安時の相談窓口と対応動線を示す。" }];
    case "source:tepco-2026-april-power":
      return [{ sourceId, claim: "東京電力EP資料は燃料費調整を通じた電気料金への波及を見る補助資料になる。" }];
    default:
      return [];
  }
}

function buildSaudiOilClaims(sourceId: string): SourceHighlight[] {
  switch (sourceId) {
    case "source:customs-trade-statistics":
      return [{ sourceId, claim: "財務省貿易統計で原油の国別輸入構成を追跡できる。" }];
    case "source:enecho-energy-trends":
      return [{ sourceId, claim: "資源エネルギー庁資料は原油の中東依存と備蓄文脈を示す。" }];
    case "source:meti-2026-energy-taskforce":
      return [{ sourceId, claim: "中東情勢ポータルは燃料油供給への対応窓口を示す。" }];
    default:
      return [];
  }
}

function buildAustraliaCoalClaims(sourceId: string): SourceHighlight[] {
  switch (sourceId) {
    case "source:customs-trade-statistics":
      return [{ sourceId, claim: "財務省貿易統計で石炭の豪州依存を国別に確認できる。" }];
    case "source:enecho-energy-trends":
      return [{ sourceId, claim: "資源エネルギー庁資料は石炭も含む燃料調達の全体像を補う。" }];
    case "source:meti-2026-energy-taskforce":
      return [{ sourceId, claim: "国内供給相談窓口の有無で豪州依存が国内影響へ変わる導線を確認できる。" }];
    default:
      return [];
  }
}

function buildRiceInputClaims(sourceId: string): SourceHighlight[] {
  switch (sourceId) {
    case "source:maff-rice-policy":
      return [{ sourceId, claim: "農水省の価格資料はコメ価格側の結果を示す。" }];
    case "source:maff-rice-monthly-report":
      return [{ sourceId, claim: "農水省の流通資料は在庫・流通量の面から価格の背景を補う。" }];
    case "source:enecho-energy-trends":
      return [{ sourceId, claim: "資源エネルギー庁資料は燃料側の調達文脈を示す。" }];
    case "source:meti-2026-energy-taskforce":
      return [{ sourceId, claim: "中東情勢対策ポータルは燃料供給不安が国内コストへ波及する局面を示す。" }];
    default:
      return [];
  }
}

function buildDefenseFlowClaims(sourceId: string, capability: string, amount: string): SourceHighlight[] {
  switch (sourceId) {
    case "source:mod-fy2026-budget":
      return [{ sourceId, claim: `防衛省資料は${capability}へ${amount}規模の配分を示す。` }];
    case "source:mof-fy2026-budget":
      return [{ sourceId, claim: `${capability}の配分を財政文書側から照合する一次資料になる。` }];
    default:
      return [];
  }
}

function buildSemiconductorFlowClaims(sourceId: string, countryLabel: string, focus: string): SourceHighlight[] {
  switch (sourceId) {
    case "source:meti-semiconductor-frame":
      return [{ sourceId, claim: `経産省資料は${countryLabel}との${focus}を日本の産業基盤政策の文脈で位置付ける。` }];
    case "source:cabinet-tsmc-2026":
      return countryLabel === "台湾"
        ? [{ sourceId, claim: "首相官邸資料はTSMCとの接点を経済安全保障の文脈で示す。" }]
        : [];
    case "source:customs-trade-statistics":
      return [{ sourceId, claim: `${countryLabel}に関わる装置・部材の国別依存を貿易統計で追跡できる。` }];
    default:
      return [];
  }
}

function buildLngElectricityClaims(sourceId: string): SourceHighlight[] {
  switch (sourceId) {
    case "source:enecho-energy-trends":
      return [{ sourceId, claim: "資源エネルギー庁資料はLNG調達が家計コストへつながる背景を示す。" }];
    case "source:tepco-2026-april-power":
      return [{ sourceId, claim: "東京電力EP資料は燃料費調整を通じた電気料金の公表資料になる。" }];
    default:
      return [];
  }
}

function buildRicePriceClaims(sourceId: string): SourceHighlight[] {
  switch (sourceId) {
    case "source:maff-rice-policy":
      return [{ sourceId, claim: "農水省は令和8年2月の相対取引価格を35,056円/玄米60kgと公表した。" }];
    case "source:maff-rice-monthly-report":
      return [{ sourceId, claim: "流通資料を併せて見ると、価格だけでなく在庫と集荷の背景も確認できる。" }];
    default:
      return [];
  }
}

function buildRiceInventoryClaims(sourceId: string): SourceHighlight[] {
  switch (sourceId) {
    case "source:maff-rice-monthly-report":
      return [{ sourceId, claim: "農水省は令和8年2月末の民間在庫量を300万玄米トンと公表した。" }];
    default:
      return [];
  }
}

function buildRicePolicyClaims(sourceId: string): SourceHighlight[] {
  switch (sourceId) {
    case "source:maff-rice-policy":
      return [{ sourceId, claim: "価格資料は備蓄放出や政策介入が議論される前提の市場状況を示す。" }];
    case "source:maff-rice-monthly-report":
      return [{ sourceId, claim: "流通・在庫資料で政策議論の背景となる需給状況を確認できる。" }];
    case "source:egov-law-search":
      return [{ sourceId, claim: "制度根拠を確認する際の法令検索入口として使う。" }];
    default:
      return [];
  }
}

function buildWaterStressClaims(sourceId: string): SourceHighlight[] {
  switch (sourceId) {
    case "source:mlit-drought-portal":
      return [{ sourceId, claim: "国交省関東地方整備局は2026-04-10時点で小河内ダムの貯水率34%を掲載した。" }];
    case "source:jma-drought-spi":
      return [{ sourceId, claim: "気象庁資料は少雨・干ばつをどう評価するかの公式な見方を補う。" }];
    default:
      return [];
  }
}

function buildDefenseObservationClaims(sourceId: string, capability: string, amount: string): SourceHighlight[] {
  switch (sourceId) {
    case "source:mod-fy2026-budget":
      return [{ sourceId, claim: `防衛省資料は${capability}に${amount}規模を配分している。` }];
    case "source:mof-fy2026-budget":
      return [{ sourceId, claim: `${capability}の予算を財務省の歳出明細側で確認できる。` }];
    default:
      return [];
  }
}

function buildSemiconductorPolicyClaims(sourceId: string): SourceHighlight[] {
  switch (sourceId) {
    case "source:meti-semiconductor-frame":
      return [{ sourceId, claim: "経産省資料は半導体産業基盤の強化を政策枠組みとして示す。" }];
    case "source:cabinet-tsmc-2026":
      return [{ sourceId, claim: "首相官邸資料はTSMCとの接点を経済安全保障の文脈で示す。" }];
    case "source:customs-trade-statistics":
      return [{ sourceId, claim: "財務省貿易統計は装置や部材の国別依存を数量化する入口になる。" }];
    default:
      return [];
  }
}
