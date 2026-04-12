import type { ThemeId } from "../../types/semantic";

type DomesticImpactCopy = {
  label: string;
  description: string;
  subject: string;
  action: string;
};

const DEFAULT_COPY: DomesticImpactCopy = {
  label: "国内着地点",
  description: "日本国内で位置を持つ港湾・基地・地域シグナル",
  subject: "国内着地点",
  action: "地図上の位置を確認"
};

const THEME_COPY: Partial<Record<ThemeId, DomesticImpactCopy>> = {
  energy: {
    label: "国内エネルギー拠点",
    description: "受入基地・港湾・製油所など、海外依存が国内供給へ変わる拠点",
    subject: "国内エネルギー拠点",
    action: "どの受入基地と精製拠点に着地するか確認"
  },
  rice: {
    label: "国内主要地域",
    description: "e-Stat の主食用収穫量と供給拠点で見る、コメの国内基盤",
    subject: "国内主要地域",
    action: "どの生産地域が基盤か確認"
  },
  water: {
    label: "国内観測地点",
    description: "全国の貯水池と地域アンカーで見る、水の監視地点",
    subject: "国内観測地点",
    action: "地図上の位置と観測値を確認"
  },
  defense: {
    label: "国内防衛拠点",
    description: "全国の主要基地・駐屯地から見る、防衛の国内重点",
    subject: "国内防衛拠点",
    action: "どの拠点が予算と能力説明につながるか確認"
  },
  semiconductors: {
    label: "国内産業拠点",
    description: "全国の量産・メモリ・車載系拠点から見る半導体基盤",
    subject: "国内産業拠点",
    action: "どの国内基盤へつながるか確認"
  }
};

export function getDomesticImpactCopy(themeId: ThemeId): DomesticImpactCopy {
  return THEME_COPY[themeId] ?? DEFAULT_COPY;
}
