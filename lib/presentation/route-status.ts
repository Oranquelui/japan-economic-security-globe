import type { DetailViewModel } from "../../types/presentation";
import type { DependencyFlow, EntityKind } from "../../types/semantic";

export type RouteStatusViewModel = {
  kind: "route-linked" | "domestic-only" | "bridge" | "none";
  chipLabel: string;
  description: string;
};

const DOMESTIC_INFRA_KINDS = new Set<EntityKind>([
  "Port",
  "Terminal",
  "Refinery",
  "Facility",
  "Reservoir",
  "Prefecture"
]);

export function isRenderableMapRoute(flow: DependencyFlow) {
  return flow.routeIds.length > 0 && flow.mapLineKind !== "bridge";
}

export function getRouteStatus(detail: DetailViewModel): RouteStatusViewModel | null {
  const selectedFlow = detail.linkedFlows.find((flow) => flow.id === detail.id);
  const routeFlows = detail.linkedFlows.filter(isRenderableMapRoute);
  const bridgeFlows = detail.linkedFlows.filter((flow) => flow.mapLineKind === "bridge");

  if (selectedFlow) {
    if (selectedFlow.mapLineKind === "bridge") {
      return {
        kind: "bridge",
        chipLabel: "概念連関",
        description: "この選択は投入コストや政策波及の説明用連関で、海外物流ルートではありません。"
      };
    }

    if (isRenderableMapRoute(selectedFlow)) {
      return {
        kind: "route-linked",
        chipLabel: "ルートあり",
        description: "このフローは海外供給地・チョークポイント・国内着地点まで route として表示できます。"
      };
    }

    return {
      kind: "none",
      chipLabel: "ルート未定義",
      description: "このフローには表示可能な route 定義がまだありません。"
    };
  }

  if (routeFlows.length > 0) {
    return {
      kind: "route-linked",
      chipLabel: "ルートあり",
      description: `この選択は ${routeFlows.length} 本の海外連携 route に結び付いています。`
    };
  }

  if (bridgeFlows.length > 0) {
    return {
      kind: "bridge",
      chipLabel: "概念連関",
      description: "この選択は価格・政策・投入コストの説明対象で、海外物流ルートを直接示していません。"
    };
  }

  if (DOMESTIC_INFRA_KINDS.has(detail.kind as EntityKind)) {
    return {
      kind: "domestic-only",
      chipLabel: "国内拠点",
      description: "この地点は国内拠点です。現時点の公開データでは海外連携ルートをまだ定義していません。"
    };
  }

  return null;
}
