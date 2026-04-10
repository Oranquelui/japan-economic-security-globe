"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  Vector3
} from "three";

import type { GlobeFlowViewModel } from "../types/presentation";
import type { ThemeId } from "../types/semantic";
import { getThemeLabel } from "../lib/presentation/japanese";

interface DependencyGlobeProps {
  accent: string;
  activeId: string;
  flows: GlobeFlowViewModel[];
  onSelect: (id: string) => void;
  themeId: ThemeId;
}

export function DependencyGlobe({ accent, activeId, flows, onSelect, themeId }: DependencyGlobeProps) {
  const theme = getThemeLabel(themeId);

  return (
    <div className="relative h-[620px] min-h-[520px] overflow-hidden rounded-[2.25rem] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.09),transparent_54%),linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]">
      <Canvas camera={{ position: [0, 0, 6.5], fov: 44 }}>
        <color attach="background" args={["#030711"]} />
        <ambientLight intensity={0.9} />
        <pointLight color={accent} intensity={42} position={[3.5, 2, 4]} />
        <pointLight color="#39c6ff" intensity={18} position={[-4, -2, 3]} />
        <GlobeScene accent={accent} activeId={activeId} flows={flows} onSelect={onSelect} />
      </Canvas>

      <div className="pointer-events-none absolute left-6 top-6 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-lg">
        <div className="font-mono text-[0.62rem] uppercase tracking-[0.32em] text-slate-500">
          補助レイヤー
        </div>
        <div className="mt-1 text-sm font-semibold text-white">{theme.label}</div>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-[2.25rem] ring-1 ring-inset ring-white/10" />
    </div>
  );
}

function GlobeScene({
  accent,
  activeId,
  flows,
  onSelect
}: {
  accent: string;
  activeId: string;
  flows: GlobeFlowViewModel[];
  onSelect: (id: string) => void;
}) {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.07;
    }
  });

  return (
    <group ref={groupRef} rotation={[0.15, -0.6, 0]}>
      <mesh>
        <sphereGeometry args={[2.2, 80, 80]} />
        <meshStandardMaterial
          color="#06101d"
          emissive="#071d32"
          emissiveIntensity={0.8}
          metalness={0.15}
          roughness={0.6}
          transparent
          opacity={0.95}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.215, 48, 48]} />
        <meshBasicMaterial color={accent} opacity={0.08} transparent wireframe />
      </mesh>

      {flows.map((flow) => (
        <FlowArc
          key={flow.id}
          accent={flow.id === activeId ? "#ffffff" : accent}
          flow={flow}
          onSelect={onSelect}
          selected={flow.id === activeId}
        />
      ))}
    </group>
  );
}

function FlowArc({
  accent,
  flow,
  onSelect,
  selected
}: {
  accent: string;
  flow: GlobeFlowViewModel;
  onSelect: (id: string) => void;
  selected: boolean;
}) {
  const geometry = useMemo(() => {
    const start = latLonToVector3(flow.origin.coordinates!.lat, flow.origin.coordinates!.lon, 2.24);
    const end = latLonToVector3(flow.destination.coordinates!.lat, flow.destination.coordinates!.lon, 2.24);
    const points: number[] = [];

    for (let index = 0; index <= 56; index += 1) {
      const t = index / 56;
      const point = new Vector3().lerpVectors(start, end, t);
      point.normalize().multiplyScalar(2.25 + Math.sin(Math.PI * t) * 0.55);
      points.push(point.x, point.y, point.z);
    }

    const arcGeometry = new BufferGeometry();
    arcGeometry.setAttribute("position", new Float32BufferAttribute(points, 3));
    return arcGeometry;
  }, [flow.destination.coordinates, flow.origin.coordinates]);
  const markerSize = selected ? 0.075 : 0.052;
  const start = latLonToVector3(flow.origin.coordinates!.lat, flow.origin.coordinates!.lon, 2.28);
  const end = latLonToVector3(flow.destination.coordinates!.lat, flow.destination.coordinates!.lon, 2.28);
  const material = useMemo(
    () =>
      new LineBasicMaterial({
        color: accent,
        transparent: true,
        opacity: selected ? 0.95 : 0.46,
        blending: AdditiveBlending
      }),
    [accent, selected]
  );
  const line = useMemo(() => new Line(geometry, material), [geometry, material]);

  return (
    <group onClick={(event) => { event.stopPropagation(); onSelect(flow.id); }}>
      <primitive object={line} />
      {[start, end].map((position, index) => (
        <mesh key={`${flow.id}-${index}`} position={position}>
          <sphereGeometry args={[markerSize, 18, 18]} />
          <meshBasicMaterial color={accent} transparent opacity={selected ? 1 : 0.82} />
        </mesh>
      ))}
    </group>
  );
}

function latLonToVector3(lat: number, lon: number, radius: number): Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}
