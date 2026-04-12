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
  rice: {
    label: "国内主要地域",
    description: "コメ生産や供給の中心となる都道府県・拠点",
    subject: "国内主要地域",
    action: "どの生産地域が基盤か確認"
  },
  water: {
    label: "国内観測地点",
    description: "貯水池や都道府県など、水の状況を示す地点",
    subject: "国内観測地点",
    action: "地図上の位置と観測値を確認"
  },
  defense: {
    label: "国内重点領域",
    description: "日本国内で予算や能力の説明につながる拠点・領域",
    subject: "国内重点領域",
    action: "どの能力領域へつながるか確認"
  },
  semiconductors: {
    label: "国内産業拠点",
    description: "日本国内の産業基盤や関連拠点",
    subject: "国内産業拠点",
    action: "どの国内基盤へつながるか確認"
  }
};

export function getDomesticImpactCopy(themeId: ThemeId): DomesticImpactCopy {
  return THEME_COPY[themeId] ?? DEFAULT_COPY;
}
