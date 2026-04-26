import { THEME_IDS, type ThemeId } from "../../types/semantic";

export const DEFAULT_THEME_ID: ThemeId = THEME_IDS[0];

export interface ThemeDefinition {
  accent: string;
  headline: string;
  label: string;
  question: string;
  sublabel: string;
  title: string;
}

export const THEME_REGISTRY: Record<ThemeId, ThemeDefinition> = {
  energy: {
    accent: "#ff9f2f",
    headline: "原油・LNG・海上輸送路の揺れは、日本のどこに着地するのか。",
    label: "エネルギー",
    question: "原油・LNG・海上輸送路の揺れは、日本のどこに着地するのか。",
    sublabel: "原油 / LNG / 海上ルート",
    title: "エネルギー"
  },
  rice: {
    accent: "#d9b45b",
    headline: "価格、備蓄、水、政策シグナルは、食卓にどうつながるのか。",
    label: "コメ",
    question: "コメ価格と備蓄の揺れは、日本の暮らしにどう跳ね返るのか。",
    sublabel: "価格 / 備蓄 / 政策",
    title: "コメ"
  },
  water: {
    accent: "#39c6ff",
    headline: "水不足が生活問題になる前に、どの地域と貯水池に兆候が出るのか。",
    label: "水",
    question: "水ストレスと貯水率の低下は、日本のどこに先に現れるのか。",
    sublabel: "貯水池 / 渇水兆候",
    title: "水"
  },
  defense: {
    accent: "#d85d68",
    headline: "2026年度防衛予算は、どの能力領域へ流れているのか。",
    label: "防衛",
    question: "FY2026防衛予算は、どの能力へどのように配分されるのか。",
    sublabel: "2026年度予算フロー",
    title: "防衛"
  },
  semiconductors: {
    accent: "#49f0d0",
    headline: "日本の半導体依存は、どの国・政策・産業基盤に支えられているのか。",
    label: "半導体",
    question: "半導体供給網の依存は、日本の産業基盤にどう効いているのか。",
    sublabel: "供給網 / 産業基盤",
    title: "半導体"
  }
};

const THEME_ID_SET = new Set<ThemeId>(THEME_IDS);

export function getThemeDefinition(themeId: ThemeId): ThemeDefinition {
  return THEME_REGISTRY[themeId];
}

export function isThemeId(value?: string): value is ThemeId {
  return Boolean(value && THEME_ID_SET.has(value as ThemeId));
}
