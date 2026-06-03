# Public Launch Note

## Short Announcement

Japan Watchboard for Economic Security is now public:

https://economic-security.quadrillionaaa.com/

The launch view focuses on Japan domestic logistics impact: port follow-through from Yokohama into highway, rail freight, coastal shipping, and distribution corridors, source trust, and a terrain-aware map. Energy tankers, LNG, crude, coal, and receiving terminals remain owned by the Energy theme. The goal is not to make another geopolitical map or a generic transport dashboard. The goal is to show which logistics signal can affect Japan's economy, where it lands domestically, and which public sources support the signal.

Repository:

https://github.com/Oranquelui/japan-economic-security-globe

## Japanese Announcement

日本経済安全保障ウォッチボードを公開しました。

https://economic-security.quadrillionaaa.com/

今回の公開面では、国内 logistics impact watch を前面に出しています。港湾後続から高速道路・鉄道貨物・内航・配送地域へどう波及するか、影響地域、詰まりの場所、代替余力、出典信頼、地形が読める地図を同じ画面で確認できます。タンカー、LNG、原油、石炭、受入基地は Energy theme の主担当として分離します。

目的は、単なる地政学マップを作ることではありません。日本が今なにを注視すべきか、そのシグナルが国内インフラ・暮らし・政策判断のどこに着地するのかを、出典付きで見えるようにすることです。

Repository:

https://github.com/Oranquelui/japan-economic-security-globe

## What Is Public Now

- Japan-first watchboard briefing
- terrain-aware operations map
- Japan domestic logistics impact board
- route and chokepoint overlays
- source-backed map detail popup
- evidence and source-license surfaces
- Cloudflare Workers deployment from GitHub `main`

## What It Is Not Yet

- not complete real-time AIS coverage of every tanker heading to Japan
- not a live operational intelligence system for real-world decisions
- not a military target-selection interface
- not a raw/live camera, passenger, person, vehicle-id, or license-plate tracking surface
- not a reusable dataset made from third-party source material

Complete external maritime AIS support coverage should be treated as a Phase 1 provider integration. It requires a licensed AIS or port-call data provider, explicit coverage limits, and source freshness labeling.
Future visual inputs should be modeled only as aggregate `VisualObservation` buckets such as congestion level, lane blocked, queue length bucket, visibility status, and last verified time. Public UI must not expose raw video, live camera URLs, people, plates, or vehicle identities.

## License Position

The code is open source under `Apache-2.0`.

The project should not switch to MIT for the public launch. MIT is permissive and valid, but Apache-2.0 is the better fit here because this project may grow into an institutional intelligence/data product. Apache-2.0 remains permissive while giving clearer patent, notice, and trademark boundaries for downstream use.

Source-linked seed data is not relicensed as a single corpus. Public and private source materials are handled under source-specific conditions; see [`DATA-SOURCES.md`](../DATA-SOURCES.md).

## Suggested X / LinkedIn Copy

日本経済安全保障ウォッチボードを公開しました。

国内物流 impact watch、港湾後続、高速道路、鉄道貨物、内航、影響地域、代替余力、出典信頼、地形が読める地図を同じ画面で見られる public MVP です。Energy系タンカーやLNGは物流ではなくEnergy側に分けます。

「日本が今なにを注視すべきか」を、暮らし・政策・国内インフラに着地させて見せることを狙っています。

https://economic-security.quadrillionaaa.com/

Repo:
https://github.com/Oranquelui/japan-economic-security-globe
