"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LibreMap, GeoJSONSource, StyleSpecification } from "maplibre-gl";
import type { FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import world from "world-atlas/land-50m.json";
import { prefectureBoundaryCollection } from "../../lib/geo/prefecture-boundaries";
import labels from "../../data/geo/japan-prefecture-labels.json";
import { CATEGORY_META, connectionGeoJSON, CONNECTION_ROUTES, TRANSPORT_REGIONS, TRANSPORT_ROUTES } from "../../lib/transport/catalog";
import type { TransportCategory, TransportRoute } from "../../types/transport";

const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };
const land = feature(world as any, (world as any).objects.land);
const style: StyleSpecification = {
  version: 8, glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    land: { type:"geojson", data:land },
    japan: { type:"geojson", data:JSON.parse(JSON.stringify(prefectureBoundaryCollection)) as FeatureCollection },
    names: { type:"geojson", data:{type:"FeatureCollection",features:labels.map(l=>({type:"Feature",properties:{label:l.label,priority:["JP-01","JP-13","JP-23","JP-27","JP-40"].includes(l.prefectureCode)?0:1},geometry:{type:"Point",coordinates:l.anchor}}))} },
    network: { type:"geojson", data:EMPTY },
    hubs: { type:"geojson", data:EMPTY }
  },
  layers: [
    { id:"ocean",type:"background",paint:{"background-color":"#091723"} },
    { id:"land",type:"fill",source:"land",paint:{"fill-color":"#152837"} },
    { id:"japan",type:"fill",source:"japan",paint:{"fill-color":"#1d3545"} },
    { id:"coast",type:"line",source:"japan",paint:{"line-color":"#365266","line-width":0.7} },
    { id:"network-glow",type:"line",source:"network",paint:{"line-color":"#6dd8c6","line-width":7,"line-opacity":0.1,"line-blur":4} },
    { id:"network-lines",type:"line",source:"network",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#6dd8c6","line-width":["interpolate",["linear"],["zoom"],4,2.1,7,3,11,4],"line-opacity":0.95} },
    { id:"network-hit",type:"line",source:"network",paint:{"line-color":"#fff","line-width":18,"line-opacity":0} },
    { id:"network-selected",type:"line",source:"network",filter:["==",["get","id"],""],paint:{"line-color":"#fff","line-width":4,"line-opacity":0.95} },
    { id:"names",type:"symbol",source:"names",layout:{"text-field":["get","label"],"text-font":["Noto Sans Regular"],"text-size":13,"symbol-sort-key":["get","priority"],"text-padding":14,"text-allow-overlap":false},paint:{"text-color":"#b2c5d2","text-halo-color":"#102331","text-halo-width":2} },
    { id:"hub-dots",type:"circle",source:"hubs",paint:{"circle-radius":4,"circle-color":"#fff","circle-stroke-color":"#091723","circle-stroke-width":2} },
    { id:"hub-labels",type:"symbol",source:"hubs",layout:{"text-field":["get","label"],"text-font":["Noto Sans Regular"],"text-size":13,"text-offset":[0,1.2],"text-padding":5},paint:{"text-color":"#fff","text-halo-color":"#091723","text-halo-width":2} }
  ]
};

export function TransportMap({ category, region, selected, onSelect }: {category:TransportCategory;region:string;selected:TransportRoute|null;onSelect:(route:TransportRoute)=>void}) {
  const container=useRef<HTMLDivElement>(null);
  const mapRef=useRef<LibreMap|null>(null);
  const boundsRef=useRef(selected?.bounds??TRANSPORT_REGIONS.find(r=>r.id===region)!.bounds);
  boundsRef.current=selected?.bounds??TRANSPORT_REGIONS.find(r=>r.id===region)!.bounds;
  const selectRef=useRef(onSelect);
  selectRef.current=onSelect;
  const [ready,setReady]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [attempt,setAttempt]=useState(0);
  const [hover,setHover]=useState("");
  const [loadedCategory,setLoadedCategory]=useState<TransportCategory|null>(null);
  const [mapFailed,setMapFailed]=useState(false);
  const meta=CATEGORY_META[category];
  const connection=category==="air"||category==="sea";

  useEffect(()=>{
    let disposed=false;
    let observer:ResizeObserver|undefined;
    import("maplibre-gl").then(({default:libre})=>{
      if(disposed||!container.current)return;
      const map=new libre.Map({container:container.current,style,center:[137,36],zoom:4,renderWorldCopies:false,attributionControl:false,localIdeographFontFamily:'"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif'});
      mapRef.current=map;
      map.on("load",()=>{if(!disposed)setReady(true);});
      map.on("click","network-hit",event=>{
        const id=event.features?.[0]?.properties?.id;
        const route=TRANSPORT_ROUTES.find(r=>r.id===id);
        if(route) selectRef.current(route);
      });
      map.on("mousemove","network-hit",event=>{
        map.getCanvas().style.cursor="pointer";
        setHover(TRANSPORT_ROUTES.find(r=>r.id===event.features?.[0]?.properties?.id)?.label??"");
      });
      map.on("mouseleave","network-hit",()=>{map.getCanvas().style.cursor="";setHover("");});
      observer=new ResizeObserver(()=>{map.resize();const b=boundsRef.current;map.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:{top:110,bottom:105,left:45,right:55},duration:0,maxZoom:9});}); observer.observe(container.current);
    }).catch(()=>{if(!disposed){setMapFailed(true);setLoading(false);}});
    return ()=>{disposed=true;observer?.disconnect();mapRef.current?.remove();mapRef.current=null;};
  },[]);

  useEffect(()=>{
    const map=mapRef.current;
    if(!ready||!map)return;
    const controller=new AbortController();
    setLoading(true);setError("");setHover("");setLoadedCategory(null);
    (map.getSource("network") as GeoJSONSource).setData(EMPTY);
    (map.getSource("hubs") as GeoJSONSource).setData(EMPTY);
    async function load(){
      try {
        let data:FeatureCollection<Geometry>;
        if(connection) data=connectionGeoJSON(category);
        else {
          const response=await fetch(`/data/transport/${category}.geojson`,{signal:controller.signal});
          if(!response.ok)throw new Error("network");
          data=await response.json();
          if(data.type!=="FeatureCollection"||!data.features.length)throw new Error("invalid");
        }
        if(controller.signal.aborted)return;
        (map!.getSource("network") as GeoJSONSource).setData(data);
        const hubs=CONNECTION_ROUTES.filter(r=>r.category===category).flatMap(r=>r.endpoints??[]);
        (map!.getSource("hubs") as GeoJSONSource).setData({type:"FeatureCollection",features:[...new Map(hubs.map(h=>[h.label,h])).values()].map(h=>({type:"Feature",properties:{label:h.label},geometry:{type:"Point",coordinates:h.coordinates}}))});
        for(const id of ["network-lines","network-glow"])map!.setPaintProperty(id,"line-color",CATEGORY_META[category].color);
        map!.setPaintProperty("network-lines","line-width",category === "railway" ? ["interpolate",["linear"],["zoom"],4,0.8,7,1.3,11,2.5] : ["interpolate",["linear"],["zoom"],4,1.8,7,2.5,11,4]);
        map!.setPaintProperty("network-lines","line-dasharray",connection?[2,3]:[1,0]);
        map!.setPaintProperty("network-selected","line-dasharray",connection?[2,3]:[1,0]);
        setLoadedCategory(category);setLoading(false);
      } catch(e){if(!controller.signal.aborted){setError("地図データを読み込めませんでした。");setLoading(false);}}
    }
    void load();
    return ()=>controller.abort();
  },[ready,category,connection,attempt]);

  useEffect(()=>{
    const map=mapRef.current;if(!ready||!map)return;
    const bounds=selected?.bounds??TRANSPORT_REGIONS.find(r=>r.id===region)!.bounds;
    map.fitBounds([[bounds[0],bounds[1]],[bounds[2],bounds[3]]],{padding:{top:110,bottom:105,left:45,right:55},duration:500,maxZoom:9});
    map.setFilter("network-selected",["==",["get","id"],selected?.id??""]);
    map.setPaintProperty("network-lines","line-opacity",selected?0.28:0.95);
    map.setPaintProperty("network-glow","line-opacity",selected?0:0.1);
  },[ready,selected,region,loadedCategory]);

  return <section className="transport-map-region" aria-label={`${meta.label}の地図`} data-loaded-category={loadedCategory??""}>
    <div className="transport-map-canvas" ref={container} data-testid="transport-map" />
    <div className="transport-map-caption"><span className="transport-eyebrow">JAPAN / {TRANSPORT_REGIONS.find(r=>r.id===region)?.label}</span><h2>{meta.label}でつながる日本</h2><p>{connection?"破線は接続の模式線。実際の移動経路ではありません。":"実線は道路・線路の形状。線を選ぶと詳細を表示。"}</p></div>
    <div className="transport-map-controls">
      <button type="button" aria-label="地図を拡大" onClick={()=>mapRef.current?.zoomIn()}>＋</button>
      <button type="button" aria-label="地図を縮小" onClick={()=>mapRef.current?.zoomOut()}>−</button>
      <button type="button" aria-label="全国を表示" onClick={()=>{const b=TRANSPORT_REGIONS[0].bounds;mapRef.current?.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:{top:110,bottom:105,left:45,right:55},duration:500});}}>全国</button>
    </div>
    {hover?<div className="transport-map-hover">{hover}</div>:null}
    {loading&&!mapFailed?<div className="transport-map-state" role="status">路線を読み込んでいます…</div>:null}
    {error||mapFailed?<div className="transport-map-state" role="alert"><p>{mapFailed?"地図を表示できません。路線一覧と出典は左のパネルから確認できます。":error}</p>{!mapFailed?<button type="button" onClick={()=>setAttempt(v=>v+1)}>再読み込み</button>:null}</div>:null}
    <div className="transport-map-legend"><span><i style={{background:meta.color}} />{connection?"接続関係（抜粋）":"路線の形状"}</span><span>{connection?"2026.09 確認":"2025.12 時点"}</span><span>運行状況は未取得</span></div>
    <div className="transport-map-attribution">地図：Natural Earth · {connection?"接続：各事業者の公開案内":"路線：国土交通省 国土数値情報（加工）"}</div>
  </section>;
}
