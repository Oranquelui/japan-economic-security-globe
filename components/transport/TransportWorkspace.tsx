"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { THEME_IDS, type ThemeId } from "../../types/semantic";
import { TRANSPORT_CATEGORIES, type TransportCategory, type TransportPurpose } from "../../types/transport";
import { getThemeLabel } from "../../lib/presentation/japanese";
import { CATEGORY_META, describeRoute, routesInBounds, TRANSPORT_REGIONS, TRANSPORT_ROUTES, TRANSPORT_SOURCES } from "../../lib/transport/catalog";
import { TransportMap } from "./TransportMap";
import { getThemePalette } from "../../lib/presentation/palette";
import { ShellMenu } from "../ShellMenu";

export interface TransportSelection { category:TransportCategory; region:string; routeId:string|null }
export function TransportWorkspace({initialSelection,onChange,onThemeChange,onOpenLegacy}: {
  initialSelection:TransportSelection;
  onChange:(value:TransportSelection)=>void;
  onThemeChange:(theme:ThemeId)=>void;
  onOpenLegacy:()=>void;
}) {
  const detailHeading=useRef<HTMLHeadingElement>(null);
  const selectionOrigin=useRef<HTMLElement|null>(null);
  const [selection,setSelection]=useState(initialSelection);
  const [query,setQuery]=useState("");
  const [purpose,setPurpose]=useState<TransportPurpose|"all">("all");
  const [limit,setLimit]=useState(8);
  const [mobileExpanded,setMobileExpanded]=useState(false);
  const {category,region,routeId}=selection;
  const meta=CATEGORY_META[category];
  const selected=TRANSPORT_ROUTES.find(r=>r.id===routeId&&r.category===category)??null;
  const connection=category==="air"||category==="sea";
  const routes=useMemo(()=>{
    const bounds=TRANSPORT_REGIONS.find(r=>r.id===region)!.bounds;
    return routesInBounds(TRANSPORT_ROUTES.filter(r=>r.category===category),bounds)
      .filter(r=>(purpose==="all"||r.purposes.includes(purpose)) && `${r.label} ${r.originalLabel??""} ${r.operator}`.includes(query.trim()))
      .sort((a,b)=>a.label.localeCompare(b.label,"ja"));
  },[category,region,purpose,query]);
  const sources=(selected?.sourceIds??TRANSPORT_ROUTES.find(r=>r.category===category)!.sourceIds).flatMap(id=>TRANSPORT_SOURCES.filter(s=>s.id===id));
  useEffect(()=>{
    if(routeId){detailHeading.current?.focus({preventScroll:true});detailHeading.current?.scrollIntoView?.({block:"nearest"});}
    else if(selectionOrigin.current?.isConnected){selectionOrigin.current.focus({preventScroll:true});selectionOrigin.current=null;}
  },[routeId]);
  function update(next:TransportSelection){if(next.routeId && next.routeId!==routeId) selectionOrigin.current=document.activeElement as HTMLElement;setSelection(next);onChange(next);setLimit(8);}
  function changeCategory(next:TransportCategory){update({category:next,region,routeId:null});setQuery("");setPurpose("all");}
  return <main className="transport-workspace" style={{"--transport-accent":meta.color} as CSSProperties}>
    <header className="transport-header">
      <a className="transport-brand" href="/">日本レジリエンス地図<span>日本のつながりを読む</span></a>
      <div className="transport-header-actions"><label><span className="sr-only">テーマ</span><select aria-label="テーマ" value="logistics" onChange={e=>onThemeChange(e.target.value as ThemeId)}>{THEME_IDS.map(id=><option key={id} value={id}>{getThemeLabel(id).label}</option>)}</select></label><ShellMenu sharePath={`/?theme=logistics&transport=${category}&region=${region}${routeId?`&route=${routeId}`:""}`} themePalette={getThemePalette("logistics")} /></div>
    </header>
    <div className="transport-layout">
      <aside className={`transport-sidebar${mobileExpanded?" is-expanded":""}`} aria-label="交通・物流の選択と詳細">
        <div className="transport-intro"><span className="transport-eyebrow">交通・物流</span><h1>この街は、<br/>どこにつながる？</h1><p>道、線路、空、海。<br/>暮らしを運ぶつながりを地図でたどる。</p></div>
        <nav className="transport-modes" aria-label="交通手段">{TRANSPORT_CATEGORIES.map(c=><button key={c} type="button" aria-pressed={category===c} onClick={()=>changeCategory(c)} style={{"--mode-color":CATEGORY_META[c].color} as CSSProperties}><i/>{CATEGORY_META[c].label}</button>)}</nav>
        <div className="transport-region-row"><label>地域<select aria-label="地域" value={region} onChange={e=>update({...selection,region:e.target.value,routeId:null})}>{TRANSPORT_REGIONS.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}</select></label><button className="transport-mobile-toggle" type="button" aria-expanded={mobileExpanded} onClick={()=>setMobileExpanded(v=>!v)}>{mobileExpanded?"一覧を閉じる":"路線を選ぶ"}</button></div>
        <div className="transport-sidebar-content">
          {selected?<section className="transport-detail" aria-label="選んだ路線の詳細" aria-live="polite">
            <div className="transport-section-heading"><span className="transport-eyebrow">選んだつながり</span><button type="button" onClick={()=>update({...selection,routeId:null})}>閉じる</button></div>
            <h2 ref={detailHeading} tabIndex={-1}>{selected.label}</h2><p className="transport-operator">{selected.operator||"高速道路・自動車専用道路"}</p>
            {selected.originalLabel?<p className="transport-small">資料上の路線名：{selected.originalLabel}</p>:null}
            <div className="transport-tags">{selected.purposes.map(p=><span key={p}>{p==="passenger"?"人の移動":"物の輸送"}</span>)}<span>{selected.service==="roro"?"RORO船":selected.service==="ferry"?"フェリー":selected.geometryKind==="surveyed"?"路線形状":"接続関係"}</span></div>
            <p>{describeRoute(selected)}</p>
            <div className="transport-detail-source">{sources.map(s=><a href={s.url} key={s.id} target="_blank" rel="noreferrer">{s.label}<br/>{s.period} ↗</a>)}</div>
            <p className="transport-small">{connection?"破線は接続関係です。実際の航行・飛行経路ではありません。":"形状を表示用に簡略化しています。"} 運行状況は未取得です。</p>
          </section>:<div className="transport-mode-intro"><h2>{meta.intro}</h2><p>{meta.coverage}</p></div>}
          <div className="transport-search"><label><span className="sr-only">路線名・運営会社で検索</span><input type="search" aria-label="路線名・運営会社で検索" value={query} placeholder="路線名・運営会社で探す" onChange={e=>{setQuery(e.target.value);setLimit(8);}}/></label><label><span className="sr-only">運ぶ対象</span><select aria-label="運ぶ対象" value={purpose} onChange={e=>{setPurpose(e.target.value as TransportPurpose|"all");setLimit(8);}}><option value="all">人・物すべて</option><option value="passenger">人の移動</option><option value="freight">物の輸送</option></select></label></div>
          <div className="transport-section-heading"><h2>{region==="japan"?"路線を選ぶ":"この地図範囲の路線"}</h2><span>{routes.length}件{connection?"・抜粋":""}</span></div>
          <ul className="transport-route-list">{routes.slice(0,limit).map(r=><li key={r.id}><button type="button" aria-pressed={r.id===selected?.id} onClick={()=>update({...selection,routeId:r.id})}><span><strong>{r.label}</strong><small>{r.operator||"高速道路"}</small></span><span aria-hidden="true">↗</span></button></li>)}</ul>
          {!routes.length?<p className="transport-empty" role="status">この条件に合う路線は、収録資料にありません。地域や検索条件を変えてみてください。</p>:null}
          {routes.length>limit?<button className="transport-more" type="button" onClick={()=>setLimit(v=>v+20)}>さらに20件を見る</button>:null}
          {category==="railway"||category==="shinkansen"?<p className="transport-small">路線名・運営会社ごとに集約。貨物専用線は未収録です。新幹線の荷物輸送は路線形状からは判断できません。</p>:null}
          <button className="transport-discovery" type="button" onClick={()=>{setQuery("");setPurpose("all");update({category:"sea",region:"japan",routeId:"sea-oarai-tomakomai"});}}><span className="transport-eyebrow">地図から小さな発見</span><strong>トラックも、船に乗る。</strong><span>大洗と苫小牧を結ぶフェリーを見てみる ↗</span></button>
          <details className="transport-sources"><summary>出典と、この地図で分かること</summary>{sources.map(s=><div key={s.id}><a href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a><p>{s.period} · {s.role==="geometry"?"形状の出典":s.role==="name"?"名称の出典":"接続の出典"}</p><p>{s.coverage}</p><p>{s.license}</p></div>)}<p>地域絞り込みは路線全体の外接範囲との重なりで判定します。範囲内の全駅・全接続を保証するものではありません。</p><button type="button" onClick={onOpenLegacy}>従来の物流デモ・道路状況を開く</button></details>
        </div>
        <footer className="transport-sidebar-footer">{connection?"事業者の接続案内 · 2026年9月確認":"国土交通省 国土数値情報 · 2025年末"}<span>国内ネットワーク / 運行状況は未取得</span></footer>
      </aside>
      <TransportMap category={category} region={region} selected={selected} onSelect={r=>{update({...selection,routeId:r.id});setMobileExpanded(true);}}/>
    </div>
  </main>;
}
