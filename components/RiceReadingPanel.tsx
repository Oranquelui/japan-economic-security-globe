import type { MetricSeriesPoint } from "../types/presentation";

export function RiceReadingPanel({series,onSelect}:{series:MetricSeriesPoint[];onSelect:(id:string)=>void}) {
  const valid=series.filter(p=>Number.isFinite(p.value));
  const total=valid.reduce((sum,p)=>sum+p.value,0);
  const top=[...valid].sort((a,b)=>b.value-a.value).slice(0,5);
  const complete=valid.length===47&&total>0;
  const share=complete?(top.reduce((sum,p)=>sum+p.value,0)/total*100).toFixed(1):null;
  return <section className="rice-reading" aria-label="収穫量の地域差">
    <p className="rice-reading-kicker">コメ / 令和5年産（2023年）</p>
    <h2>食卓を支える産地を、<br/>地図で比べる。</h2>
    <p>{share?`上位5道県で全国の${share}%。`:"収録されている地域の収穫量を比較できます。"}地域を選ぶと、数値と根拠を確認できます。</p>
    <div className="rice-reading-total"><span>{complete?"全国":"収録地域の合計"}</span><strong>{total.toLocaleString("ja-JP")}</strong><span>トン</span></div>
    <ol>{top.map((p,i)=><li key={p.id}><button type="button" onClick={()=>onSelect(p.id)}><span className="rice-reading-rank">{i+1}</span><span className="rice-reading-name">{p.label}</span><span className="rice-reading-value"><strong>{p.value.toLocaleString("ja-JP")}</strong><span className="rice-reading-track"><i style={{width:`${p.value/top[0].value*100}%`}}/></span></span>{complete?<span className="rice-reading-share">{(p.value/total*100).toFixed(1)}%</span>:null}</button></li>)}</ol>
    <p className="rice-reading-source">主食用米収穫量 · 農林水産省 / e-Stat</p>
  </section>;
}
