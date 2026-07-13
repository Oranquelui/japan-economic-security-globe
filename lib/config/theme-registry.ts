import { THEME_IDS, type ThemeId } from "../../types/semantic";

/** Public e-Stat spine default: rice (official domestic numbers), not energy route theater. */
export const DEFAULT_THEME_ID: ThemeId = "rice";

/** Themes to emphasize on the public MVP rail / lead selection. */
export const PUBLIC_SPINE_THEME_IDS: ThemeId[] = ["rice", "energy", "logistics"];

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
    headline: "燃料・電力の公式数字は、日本の暮らしと産業のどこに着地するのか。",
    label: "エネルギー",
    question: "燃料・電力の国内数字は、家計と産業のどこに着地するのか。",
    sublabel: "国内着地 / 公式統計 / 依存文脈",
    title: "エネルギー"
  },
  logistics: {
    accent: "#4ea4bf",
    headline: "港湾・空港・国内輸送網への波及は、日本のどこに現れるのか。",
    label: "物流",
    question: "国内物流の着地点と後続接続は、どの港・施設・地域から先に揺れるのか。",
    sublabel: "国内着地点 / 港湾後続 / 一般貨物",
    title: "物流"
  },
  "regional-security": {
    accent: "#e05243",
    headline: "日本周辺のミサイル・航空・海上活動は、どの地域に緊張を生むのか。",
    label: "地域安全保障",
    question: "日本周辺のミサイル・航空・海上活動は、どの地域に緊張を生むのか。",
    sublabel: "ミサイル / 航空活動 / 海空域",
    title: "地域安全保障"
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
  },
  rice: {
    accent: "#d9b45b",
    headline: "公式の収穫量と価格シグナルは、食卓と産地のどこに効くのか。",
    label: "コメ",
    question: "公式統計の収穫量・価格は、日本のどの産地と家計に効いているのか。",
    sublabel: "収穫量 / 価格 / 公式統計",
    title: "コメ"
  },
  water: {
    accent: "#39c6ff",
    headline: "水不足が生活問題になる前に、どの地域と貯水池に兆候が出るのか。",
    label: "水",
    question: "水ストレスと貯水率の低下は、日本のどこに先に現れるのか。",
    sublabel: "貯水池 / 渇水兆候",
    title: "水"
  }
};

const THEME_ID_SET = new Set<ThemeId>(THEME_IDS);

export function getThemeDefinition(themeId: ThemeId): ThemeDefinition {
  return THEME_REGISTRY[themeId];
}

export function isThemeId(value?: string): value is ThemeId {
  return Boolean(value && THEME_ID_SET.has(value as ThemeId));
}
