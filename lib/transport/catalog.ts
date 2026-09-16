import index from "../../data/transport/network-index.json";
import type { FeatureCollection, LineString } from "geojson";
import type { TransportBounds, TransportCategory, TransportRoute, TransportSource } from "../../types/transport";

export const CATEGORY_META: Record<TransportCategory, { label: string; color: string; intro: string; coverage: string }> = {
  expressway: { label: "高速道路", color: "#e7b86b", intro: "暮らしと産業を、陸でつなぐ。", coverage: "全国の高速道路・自動車専用道路" },
  shinkansen: { label: "新幹線", color: "#6dd8c6", intro: "都市と都市を結ぶ、日本の大動脈。", coverage: "全国の新幹線区間（事業者別）" },
  railway: { label: "鉄道", color: "#a9abf5", intro: "いつもの駅の先に、どんな街がある？", coverage: "全国の在来線・私鉄・地下鉄・軌道" },
  air: { label: "航空", color: "#77c9fc", intro: "海や山を越えて、遠くの街へ。", coverage: "ANAの案内で確認した国内6接続を抜粋" },
  sea: { label: "海運", color: "#ef9ba5", intro: "人も、トラックも。海がつなぐ暮らし。", coverage: "さんふらわあの国内6航路を掲載" }
};
const ANA_URL = "https://www.ana.co.jp/ja-jp/sitemap/都市から都市への航空券/page-1";
export const TRANSPORT_SOURCES: TransportSource[] = [
  {id:"nexco-tomei-name",label:"NEXCO中日本 東名高速道路の名称",url:"https://tomei.c-nexco.co.jp/tr1-2026/construction/",role:"name",period:"2026年9月16日確認",license:"公開されている名称の対応を編集",coverage:"第一東海自動車道を案内名称の東名高速道路として表示。形状は国土数値情報によります。"},
  {id:"nexco-tohoku-name",label:"NEXCO東日本 路線名と道路名",url:"https://www.e-nexco.co.jp/assets/pdf/company/strategy/20220302.pdf",role:"name",period:"2022年資料・2026年9月16日確認",license:"公開されている名称の対応を編集",coverage:"東北縦貫自動車道弘前線を案内名称の東北自動車道として表示。形状は国土数値情報によります。"},
  { id: "mlit-n06-2025", label: "国土交通省 国土数値情報 N06", url: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N06-2025.html", role: "geometry", period: "2025年12月31日時点", license: "CC BY 4.0（2025年の現況のみ利用）", coverage: "高速道路の線形を簡略化。同名路線をまとめています。渋滞・通行止めは含みません。" },
  { id: "mlit-n02-2025", label: "国土交通省 国土数値情報 N02", url: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2025.html", role: "geometry", period: "2025年12月31日時点", license: "CC BY 4.0", coverage: "旅客鉄道・軌道の線形を簡略化。路線名と運営会社で集約。山形・秋田新幹線の在来線区間は「鉄道」に含まれます。貨物専用線・運行状況は含みません。" },
  { id: "ana-connections", label: "ANA 国内の都市間接続案内", url: ANA_URL, role: "service", period: "2026年9月16日確認", license: "公開案内にある接続の事実を編集。路線図・時刻表の転載なし。", coverage: "6接続を抜粋。直行便の時刻・便数・運航状況は表示していません。点は空港の代表位置、破線は接続関係です。" },
  { id: "sunflower-connections", label: "商船三井さんふらわあ 貨物輸送事業", url: "https://www.sunflower.co.jp/cargo/service.html", role: "service", period: "2026年9月16日確認", license: "公開案内にある接続の事実を編集。航路図・時刻表の転載なし。", coverage: "6航路を掲載。点は港の代表位置、破線は港間の接続関係です。実際の航行経路・船の位置を示しません。" }
];
const endpoints: Record<string, [string, number, number]> = {
  hnd: ["羽田",139.78,35.55], cts: ["新千歳",141.69,42.78], fuk: ["福岡",130.45,33.58], oka: ["那覇",127.65,26.20], ngo: ["中部",136.81,34.86],
  oarai: ["大洗",140.57,36.30], tomakomai: ["苫小牧",141.63,42.63], tokyo: ["東京",139.81,35.61], hakata: ["博多",130.39,33.64], kanda: ["苅田",130.99,33.79], osaka: ["大阪",135.40,34.62], beppu: ["別府",131.50,33.30], kobe: ["神戸",135.27,34.71], oita: ["大分",131.69,33.27], shibushi: ["志布志",131.10,31.47]
};
function connection(category: "air" | "sea", a: string, b: string, freightOnly = false): TransportRoute {
  const [aLabel, ax, ay] = endpoints[a]; const [bLabel, bx, by] = endpoints[b];
  return { id: `${category}-${a}-${b}`, label: `${aLabel} — ${bLabel}`, operator: category === "air" ? "ANA掲載接続" : "商船三井さんふらわあ", category, mode: category, service: category === "air" ? "passenger-flight" : freightOnly ? "roro" : "ferry", scope: "domestic", purposes: category === "air" ? ["passenger"] : freightOnly ? ["freight"] : ["passenger","freight"], information: "scheduled-connection", geometryKind: "connection", sourceIds: [category === "air" ? "ana-connections" : "sunflower-connections"], period: "2026-09-16", bounds: [Math.min(ax,bx),Math.min(ay,by),Math.max(ax,bx),Math.max(ay,by)], segmentCount: 1, endpoints: [{ label: aLabel, coordinates: [ax,ay] }, { label: bLabel, coordinates: [bx,by] }] };
}
export const CONNECTION_ROUTES = [
  connection("air","hnd","cts"), connection("air","hnd","fuk"), connection("air","hnd","oka"), connection("air","ngo","cts"), connection("air","ngo","fuk"), connection("air","cts","fuk"),
  connection("sea","oarai","tomakomai"), connection("sea","tokyo","hakata",true), connection("sea","tokyo","kanda",true), connection("sea","osaka","beppu"), connection("sea","kobe","oita"), connection("sea","osaka","shibushi")
];
const namedInfrastructure: TransportRoute[] = (index as TransportRoute[]).map(route=>{
  const names: Record<string,[string,string]>={"第一東海自動車道":["東名高速道路","nexco-tomei-name"],"東北縦貫自動車道弘前線":["東北自動車道","nexco-tohoku-name"]};
  const name=names[route.label];
  return name?{...route,originalLabel:route.label,label:name[0],sourceIds:[...route.sourceIds,name[1]]}:route;
});
export const TRANSPORT_ROUTES: TransportRoute[] = [...namedInfrastructure, ...CONNECTION_ROUTES];
export const TRANSPORT_REGIONS: {id: string; label: string; bounds: TransportBounds}[] = [
  {id:"japan",label:"全国",bounds:[127.2,26,146.1,45.6]},
  {id:"hokkaido",label:"北海道",bounds:[139.3,41.3,145.9,45.6]},
  {id:"tohoku",label:"東北",bounds:[139.2,36.8,142.2,41.6]},
  {id:"kanto",label:"関東",bounds:[138.2,34.7,141,37.1]},
  {id:"chubu",label:"中部",bounds:[135.5,34.4,139.9,38.6]},
  {id:"kansai",label:"近畿",bounds:[134,33.3,137,36.1]},
  {id:"chugoku-shikoku",label:"中国・四国",bounds:[130.6,32.6,134.9,35.8]},
  {id:"kyushu-okinawa",label:"九州・沖縄",bounds:[127.2,26,132.2,34.1]}
];
export function routesInBounds(routes: TransportRoute[], bounds: TransportBounds) {
  return routes.filter(({bounds:b})=> b[2]>=bounds[0] && b[0]<=bounds[2] && b[3]>=bounds[1] && b[1]<=bounds[3]);
}
// These are schematic relationship arcs, never navigation paths or observed trajectories.
export function connectionCoordinates(route: TransportRoute): number[][] {
  const [a,b]=route.endpoints!.map(e=>e.coordinates);
  const dx=b[0]-a[0],dy=b[1]-a[1];
  const control=route.category==="sea"
    ? [(a[0]+b[0])/2+(Math.abs(dy)>Math.abs(dx)?Math.abs(dy)*0.6:0),(a[1]+b[1])/2-(Math.abs(dx)>=Math.abs(dy)?Math.abs(dx)*0.4:0)]
    : [(a[0]+b[0])/2+dy*0.2,(a[1]+b[1])/2-dx*0.2];
  return Array.from({length:49},(_,i)=>{const t=i/48,u=1-t;return [u*u*a[0]+2*u*t*control[0]+t*t*b[0],u*u*a[1]+2*u*t*control[1]+t*t*b[1]];});
}
export function connectionGeoJSON(category: TransportCategory): FeatureCollection<LineString> {
  return {type:"FeatureCollection", features: CONNECTION_ROUTES.filter(r=>r.category===category).map(r=>({type:"Feature", id:r.id, properties:{id:r.id,label:r.label}, geometry:{type:"LineString",coordinates:connectionCoordinates(r)}}))};
}
export function describeRoute(route: TransportRoute) {
  if (route.service === "roro") return "トラックやトレーラーなどを載せて運ぶ貨物の海上接続です。";
  if (route.service === "ferry") return "旅客と車両を運ぶフェリー。有人トラックや無人トレーラーの輸送にも使われます。";
  if (route.category === "air") return "離れた空港を結ぶ国内の航空接続です。運航日や乗り継ぎ条件は航空会社の案内で確認できます。";
  if (route.category === "expressway") return "人の移動やトラック輸送を支える道路。地図には2025年末時点の道路形状を表示しています。";
  if (route.category === "shinkansen") return "都市間の移動を支える高速鉄道。地図は路線の形状を示し、列車ごとの停車駅や直通区間とは異なります。";
  return "日々の移動を支える旅客鉄道・軌道。線の形状と運営会社を確認できます。貨物列車の運行範囲は別の情報が必要です。";
}
