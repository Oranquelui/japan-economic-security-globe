import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { TRANSPORT_ROUTES, TRANSPORT_SOURCES, connectionGeoJSON, routesInBounds } from "../catalog";
import { parseOperationsUrlState, serializeOperationsUrlState } from "../../presentation/url-state";
import provenance from "../../../data/transport/provenance.json";

describe("source-backed transport network",()=>{
  test("every route keeps transport, purpose, evidence type and source independent",()=>{
    const ids=new Set(TRANSPORT_ROUTES.map(r=>r.id));
    expect(ids.size).toBe(TRANSPORT_ROUTES.length);
    for(const route of TRANSPORT_ROUTES){
      expect(route.sourceIds.length).toBeGreaterThan(0);
      expect(route.sourceIds.every(id=>TRANSPORT_SOURCES.some(s=>s.id===id))).toBe(true);
      expect(route.bounds.every(Number.isFinite)).toBe(true);
      expect(route.scope).toBe("domestic");
      if(route.mode==="rail")expect(route.information).toBe("infrastructure");
      if(route.category==="shinkansen")expect(route.purposes).not.toContain("freight");
      if(route.service==="roro")expect(route.purposes).toEqual(["freight"]);
    }
  });
  test("all official route IDs correspond to nonempty packaged geometry",()=>{
    for(const category of ["expressway","shinkansen","railway"]){
      const data=JSON.parse(readFileSync(`public/data/transport/${category}.geojson`,"utf8"));
      const expected=TRANSPORT_ROUTES.filter(r=>r.category===category);
      expect(data.features.map((f:any)=>f.id).sort()).toEqual(expected.map(r=>r.id).sort());
      for(const f of data.features){
        expect(f.geometry.type).toBe("MultiLineString");
        expect(f.geometry.coordinates.length).toBeGreaterThan(0);
        const r=expected.find(r=>r.id===f.id)!;
        for(const line of f.geometry.coordinates){
          expect(line.length).toBeGreaterThan(1);
          expect(line.every(([lon,lat]:number[])=>lon>=r.bounds[0]&&lon<=r.bounds[2]&&lat>=r.bounds[1]&&lat<=r.bounds[3])).toBe(true);
        }
      }
    }
    expect(provenance.every(p=>p.referenceDate==="2025-12-31"&&p.license==="CC BY 4.0"&&p.archiveSha256.length===64)).toBe(true);
  });
  test("service connections never masquerade as surveyed trajectories",()=>{
    for(const category of ["air","sea"] as const){
      const geo=connectionGeoJSON(category);
      expect(geo.features).toHaveLength(6);
      for(const f of geo.features){
        const route=TRANSPORT_ROUTES.find(r=>r.id===f.id)!;
        expect(route.geometryKind).toBe("connection");
        expect(route.information).toBe("scheduled-connection");
        expect(f.geometry.coordinates[0]).toEqual(route.endpoints![0].coordinates);
        expect(f.geometry.coordinates.at(-1)).toEqual(route.endpoints![1].coordinates);
        expect(f.geometry.coordinates.every(p=>p.every(Number.isFinite))).toBe(true);
      }
    }
  });
  test("deep links round trip transport state and discard mismatched route categories",()=>{
    const state=parseOperationsUrlState({theme:"logistics",transport:"sea",region:"tohoku",route:"sea-oarai-tomakomai"});
    expect(parseOperationsUrlState(new URLSearchParams(serializeOperationsUrlState(state)))).toEqual(state);
    expect(state.transportRouteId).toBe("sea-oarai-tomakomai");
    expect(parseOperationsUrlState({theme:"logistics",transport:"railway",region:"bad",route:"sea-oarai-tomakomai"})).toMatchObject({transportCategory:"railway",transportRegion:"japan"});
    expect(parseOperationsUrlState({theme:"logistics",transport:"railway",route:"sea-oarai-tomakomai"}).transportRouteId).toBeUndefined();
    expect(parseOperationsUrlState({theme:"rice",transport:"sea"}).transportCategory).toBeUndefined();
  });
  test("region filtering excludes disjoint geometries",()=>{
    const sea=TRANSPORT_ROUTES.filter(r=>r.category==="sea");
    const hokkaido=routesInBounds(sea,[139.3,41.3,145.9,45.6]);
    expect(hokkaido.map(r=>r.id)).toEqual(["sea-oarai-tomakomai"]);
  });
});
