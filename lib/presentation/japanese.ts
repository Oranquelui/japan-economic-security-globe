import { getThemeDefinition } from "../config/theme-registry";
import type { ThemeId } from "../../types/semantic";

const KIND_LABELS: Record<string, string> = {
  Observation: "観測",
  BudgetLine: "予算項目",
  CapabilityArea: "能力領域",
  Chokepoint: "チョークポイント",
  Country: "国",
  DependencyFlow: "依存フロー",
  DependencyObservation: "依存観測",
  Facility: "施設",
  Organization: "組織",
  PolicyDocument: "政策文書",
  PolicySignal: "政策シグナル",
  Port: "港湾",
  Prefecture: "都道府県",
  PriceObservation: "価格観測",
  Product: "製品",
  Refinery: "製油所",
  Reservoir: "貯水池",
  ReservoirObservation: "貯水池観測",
  Resource: "資源",
  Route: "輸送路",
  SeaLane: "海上輸送路",
  SourceDocument: "出典文書",
  Terminal: "受入基地",
  WorldRegion: "地域"
};

const ENTITY_LABELS: Record<string, string> = {
  "budget:fiscal-2026-integrated-air-missile-defense": "2026年度一体防空・ミサイル防衛能力",
  "budget:fiscal-2026-stand-off-defense": "2026年度スタンド・オフ防衛能力",
  "budget:fiscal-2026-unmanned-defense": "2026年度無人防衛能力",
  "capability:integrated-air-missile": "一体防空・ミサイル防衛能力",
  "capability:standoff": "スタンド・オフ防衛能力",
  "capability:unmanned": "無人防衛能力",
  "chokepoint:hormuz": "ホルムズ海峡",
  "chokepoint:malacca": "マラッカ海峡",
  "country:australia": "オーストラリア",
  "country:china": "中国",
  "country:japan": "日本",
  "country:netherlands": "オランダ",
  "country:qatar": "カタール",
  "country:saudi-arabia": "サウジアラビア",
  "country:south-korea": "韓国",
  "country:taiwan": "台湾",
  "country:united-states": "米国",
  "org:mod": "防衛省",
  "policy:semiconductor-industrial-base": "AI・半導体産業基盤フレーム",
  "port:yokohama": "横浜港",
  "prefecture:akita": "秋田県",
  "prefecture:hokkaido": "北海道",
  "prefecture:miyagi": "宮城県",
  "prefecture:niigata": "新潟県",
  "prefecture:tokyo": "東京都",
  "prefecture:yamagata": "山形県",
  "product:advanced-semiconductors": "先端半導体",
  "product:fertilizer-inputs": "肥料原料",
  "product:rice": "コメ",
  "refinery:keihin": "京浜製油所エリア",
  "reservoir:ogochi": "小河内貯水池",
  "resource:coal": "石炭",
  "resource:crude-oil": "原油",
  "resource:lng": "LNG",
  "route:gulf-to-japan": "湾岸から日本への海上輸送路",
  "terminal:sodegaura-lng": "袖ケ浦LNG受入基地"
};

const FLOW_LABELS: Record<string, string> = {
  "flow:australia-coal-japan": "オーストラリア石炭 → 日本",
  "flow:defense-budget-integrated-air-missile": "2026年度防衛予算 → 一体防空・ミサイル防衛能力",
  "flow:china-semiconductor-risk-japan": "中国関連の半導体供給網 → 日本",
  "flow:defense-budget-standoff": "2026年度防衛予算 → スタンド・オフ能力",
  "flow:defense-budget-unmanned": "2026年度防衛予算 → 無人防衛能力",
  "flow:energy-inputs-rice": "エネルギー・肥料投入 → コメ価格",
  "flow:korea-semiconductors-japan": "韓国半導体エコシステム → 日本",
  "flow:netherlands-equipment-japan": "オランダ半導体装置 → 日本",
  "flow:qatar-lng-japan": "カタールLNG → 日本",
  "flow:saudi-oil-japan": "サウジ原油 → 日本",
  "flow:taiwan-semiconductors-japan": "台湾半導体 → 日本",
  "flow:us-semiconductor-policy-japan": "米国技術・政策連携 → 日本"
};

const OBSERVATION_LABELS: Record<string, string> = {
  "observation:defense-budget-iamd-fy2026": "2026年度一体防空・ミサイル防衛予算項目",
  "observation:defense-budget-standoff-fy2026": "2026年度スタンド・オフ関連予算項目",
  "observation:defense-budget-unmanned-fy2026": "2026年度無人防衛予算項目",
  "observation:lng-electricity-april-2026": "LNGと電気代への影響シグナル",
  "observation:ogochi-reservoir-stress": "小河内ダム貯水率",
  "observation:rice-private-inventory-feb-2026": "民間在庫量シグナル",
  "observation:rice-price-signal-2026": "コメ価格圧力シグナル",
  "observation:rice-stockpile-policy-2026": "コメ備蓄・政策シグナル",
  "observation:semiconductor-policy-signal-2026": "半導体産業基盤の政策シグナル"
};

const SUMMARY_LABELS: Record<string, string> = {
  "flow:qatar-lng-japan": "湾岸から日本へ入るLNGの簡易フロー。電気代や国内エネルギー供給への影響を説明する入口。",
  "flow:saudi-oil-japan": "湾岸原油とホルムズ海峡・マラッカ海峡を通る日本向けルートの簡易フロー。",
  "flow:australia-coal-japan": "オーストラリアからの石炭供給を通じ、日本のエネルギー依存が中東だけではないことを示すフロー。",
  "flow:energy-inputs-rice": "エネルギー価格や肥料原料が、コメ価格や家計負担へ波及することを示す橋渡しフロー。",
  "flow:defense-budget-standoff": "2026年度防衛予算の一部を能力領域と結びつけ、予算の流れを市民向けに説明する例。",
  "flow:defense-budget-integrated-air-missile": "2026年度防衛予算のうち、一体防空・ミサイル防衛能力へ向かう配分を示すフロー。",
  "flow:defense-budget-unmanned": "2026年度防衛予算のうち、無人アセット関連能力へ向かう配分を示すフロー。",
  "flow:taiwan-semiconductors-japan": "台湾の半導体エコシステムと日本の経済安全保障を結ぶ依存フロー。",
  "flow:korea-semiconductors-japan": "韓国の半導体・先端製造エコシステムと日本の関係を示すフロー。",
  "flow:netherlands-equipment-japan": "先端半導体装置の専門エコシステムが日本に与える依存関係を示すフロー。",
  "flow:us-semiconductor-policy-japan": "米国との技術・政策連携が日本の半導体安全保障に与える関係を示すフロー。",
  "flow:china-semiconductor-risk-japan": "中国関連の供給網・市場・戦略リスクが日本に与える露出を示すフロー。",
  "observation:lng-electricity-april-2026": "LNGの調達・価格変化が電気代に波及しうることを示す公開向けシグナル。",
  "observation:rice-price-signal-2026": "農林水産省は、2026年2月の相対取引価格を全銘柄平均35,056円/玄米60kgと公表している。",
  "observation:rice-private-inventory-feb-2026": "農林水産省は、2026年2月末の民間在庫量を300万玄米トンと公表している。",
  "observation:rice-stockpile-policy-2026": "備蓄米や政策介入の議論を、コメ依存ストーリーと結びつけるシグナル。",
  "observation:ogochi-reservoir-stress": "国土交通省関東地方整備局のリアルタイム水資源情報では、2026年4月10日の小河内ダム貯水率は34%となっている。",
  "observation:defense-budget-standoff-fy2026": "防衛省の FY2026 予算資料では、スタンド・オフ防衛能力に約9,733億円を配分している。",
  "observation:defense-budget-iamd-fy2026": "防衛省の FY2026 予算資料では、一体防空・ミサイル防衛能力に約5,091億円を配分している。",
  "observation:defense-budget-unmanned-fy2026": "防衛省の FY2026 予算資料では、無人防衛能力に約2,773億円を配分している。",
  "observation:semiconductor-policy-signal-2026": "半導体産業基盤政策が経済安全保障の議論と結びつくことを示すシグナル。"
};

const SOURCE_LABELS: Record<string, string> = {
  "source:cabinet-tsmc-2026": "首相官邸: TSMC会長との面会",
  "source:estat-rice-prefecture-harvest-r5": "e-Stat: 令和5年産 水稲収穫量（都道府県別）",
  "source:estat-lod-sparql": "統計LOD: 構造化データ接続",
  "source:maff-rice-policy": "農林水産省: 令和8年2月相対取引価格",
  "source:maff-rice-monthly-report": "農林水産省: 令和8年2月民間在庫",
  "source:meti-2026-energy-taskforce": "経済産業省: 中東情勢関連対策ポータル",
  "source:meti-semiconductor-frame": "経済産業省: AI・半導体産業基盤強化",
  "source:mlit-drought-portal": "国土交通省: 首都圏の水資源状況",
  "source:mod-fy2026-budget": "防衛省: 2026年度予算資料",
  "source:tepco-2026-april-power": "東京電力EP: 2026年4月分電気料金のお知らせ"
};

const PUBLISHER_LABELS: Record<string, string> = {
  "Ministry of Agriculture, Forestry and Fisheries": "農林水産省",
  "Ministry of Defense": "防衛省",
  "Ministry of Economy, Trade and Industry": "経済産業省",
  "Ministry of Land, Infrastructure, Transport and Tourism": "国土交通省",
  "Prime Minister's Office of Japan": "首相官邸",
  "Tokyo Electric Power Energy Partner": "東京電力エナジーパートナー"
};

export function getThemeLabel(themeId: ThemeId): { label: string; sublabel: string } {
  const theme = getThemeDefinition(themeId);

  return {
    label: theme.label,
    sublabel: theme.sublabel
  };
}

export function getThemeQuestion(themeId: ThemeId): string {
  return getThemeDefinition(themeId).question;
}

export function localizeKind(kind: string): string {
  return KIND_LABELS[kind] ?? kind;
}

export function localizeEntityLabel(id: string, fallback: string): string {
  return ENTITY_LABELS[id] ?? fallback;
}

export function localizeFlowLabel(id: string, fallback: string): string {
  return FLOW_LABELS[id] ?? fallback;
}

export function localizeObservationLabel(id: string, fallback: string): string {
  return OBSERVATION_LABELS[id] ?? fallback;
}

export function localizeAnyLabel(id: string, fallback: string): string {
  return FLOW_LABELS[id] ?? OBSERVATION_LABELS[id] ?? ENTITY_LABELS[id] ?? SOURCE_LABELS[id] ?? fallback;
}

export function localizeSummary(id: string, fallback: string): string {
  return SUMMARY_LABELS[id] ?? (fallback && isMostlyJapanese(fallback) ? fallback : "この項目は、日本への影響を説明するためのセマンティックグラフ上の要素です。");
}

export function localizePublisher(publisher: string): string {
  return PUBLISHER_LABELS[publisher] ?? publisher;
}

export function localizeSourceLabel(id: string, fallback: string): string {
  return SOURCE_LABELS[id] ?? fallback;
}

export function localizeWhyItMatters(id: string, fallback: string): string {
  return SUMMARY_LABELS[id] ?? (fallback && isMostlyJapanese(fallback) ? fallback : "この関係は、日本の暮らし・供給網・政策判断への影響を理解するために必要です。");
}

function isMostlyJapanese(value: string): boolean {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(value);
}
