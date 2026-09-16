"""Build the 2025 snapshot only; source archives stay outside the repository.
Usage: python3 scripts/build-transport-network.py /tmp/japan-transport-source
"""
import sys, json, zipfile, hashlib, pathlib, math, collections
ROOT = pathlib.Path(__file__).resolve().parents[1]
YEAR = 2025

def simplify(points, tolerance=0.0004):
    # Douglas-Peucker in geographic degrees, approx. 45 m latitude. Endpoints retained.
    if len(points) < 3: return points
    a, b = points[0], points[-1]; dx,dy=b[0]-a[0],b[1]-a[1]; denom=dx*dx+dy*dy
    best, index = 0, 0
    for i,p in enumerate(points[1:-1],1):
        t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/denom)) if denom else 0
        d=(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2
        if d>best: best,index=d,i
    if best>tolerance*tolerance:
        return simplify(points[:index+1])+simplify(points[index:])[1:]
    return [a,b]

def dump(path, obj):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':'))+'\n')

def main(cache):
    groups={}; provenance=[]
    for code, filename in [('N06','HighwaySection'),('N02','RailroadSection')]:
        archive=cache/f'{code}-25_GML.zip'; raw=archive.read_bytes()
        with zipfile.ZipFile(archive) as z:
            entry=f'{code}-25_GML/UTF-8/{code}-25_{filename}.geojson'
            source=json.loads(z.read(entry))
        kept=0
        for f in source['features']:
            p=f['properties']; g=f['geometry']
            if code=='N06':
                if not (p['N06_002']<=YEAR<=p['N06_003'] and p['N06_001']<=YEAR): continue
                mode='expressway'; label=p['N06_007']; operator=''; source_id='mlit-n06-2025'
            else:
                mode='shinkansen' if p['N02_002']=='1' else 'railway'
                label=p['N02_003']; operator=p['N02_004']; source_id='mlit-n02-2025'
            assert g['type'] in ('LineString','MultiLineString')
            identity=(mode,label,operator); route_id=mode+'-'+hashlib.sha256('|'.join(identity).encode()).hexdigest()[:12]
            group=groups.setdefault(identity,{'id':route_id,'label':label,'operator':operator,'category':mode,'mode':'road' if mode=='expressway' else 'rail','service':mode,'scope':'domestic','purposes':['passenger','freight'] if mode=='expressway' else ['passenger'],'information':'infrastructure','geometryKind':'surveyed','sourceIds':[source_id],'period':'2025-12-31','lines':[]})
            for line in ([g['coordinates']] if g['type']=='LineString' else g['coordinates']):
                assert all(len(p)>=2 and math.isfinite(p[0]) and math.isfinite(p[1]) and 122<p[0]<154 and 20<p[1]<47 for p in line)
                rounded=[[round(p[0],5),round(p[1],5)] for p in simplify(line)]
                if len(rounded)>=2: group['lines'].append(rounded)
            kept+=1
        provenance.append({'id':source_id,'url':f'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-{code}-2025.html','downloadUrl':f'https://nlftp.mlit.go.jp/ksj/gml/data/{code}/{code}-25/{code}-25_GML.zip','archiveSha256':hashlib.sha256(raw).hexdigest(),'archiveEntry':entry,'referenceDate':'2025-12-31','checkedAt':'2026-09-16','license':'CC BY 4.0','inputFeatures':len(source['features']),'retainedFeatures':kept,'processing':'2025 snapshot only; N06 installation start <= 2025 <= end and opened by 2025; grouped by category, route name and operator; Douglas-Peucker tolerance 0.0004 degrees; rounded to 5 decimals. No history or operational status included.'})
    index=[]; outputs=collections.defaultdict(list)
    for group in sorted(groups.values(),key=lambda x:x['id']):
        lines=group.pop('lines'); points=[p for line in lines for p in line]
        group['bounds']=[min(p[0] for p in points),min(p[1] for p in points),max(p[0] for p in points),max(p[1] for p in points)]
        group['segmentCount']=len(lines); index.append(group)
        outputs[group['category']].append({'type':'Feature','id':group['id'],'properties':{'id':group['id'],'label':group['label']},'geometry':{'type':'MultiLineString','coordinates':lines}})
    for category,features in outputs.items(): dump(ROOT/f'public/data/transport/{category}.geojson',{'type':'FeatureCollection','features':features})
    dump(ROOT/'data/transport/network-index.json',index)
    dump(ROOT/'data/transport/provenance.json',provenance)
    print({category:len(features) for category,features in outputs.items()})
if __name__=='__main__': main(pathlib.Path(sys.argv[1]))
