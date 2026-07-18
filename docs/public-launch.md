# v0.5.0 Distribution Note

## Short Announcement

Japan Resilience Map v0.5.0 is available at:

https://economic-security.quadrillionaaa.com/

Desktop map workspace with one fixed context pane, one active-layer reading block,
one theme/layer control path, one selected-object inspector, and intentional
Signals/comparison views. Mobile redesign remains deferred.

The default view now starts with official e-Stat rice-harvest data by prefecture. The desktop product is organized as a map-dominant workspace: scope, period, unit, source, and semantic layers on the left; the map in the center; and one evidence-backed inspector on selection. Signals and the 47-prefecture comparison open only when requested.

Repository:

https://github.com/Oranquelui/japan-economic-security-globe

## Japanese Announcement

日本レジリエンス地図 v0.5.0 を公開しました。

https://economic-security.quadrillionaaa.com/

初期表示は、e-Stat の都道府県別コメ収穫量です。デスクトップは、左に対象範囲・期間・単位・出典・意味レイヤー、中央に地図、右に選択時だけ開く出典付きインスペクタを置く構成へ整理しました。シグナルと47都道府県比較は必要なときだけ開きます。

目的は、単なる地政学マップを作ることではありません。日本が今なにを注視すべきか、そのシグナルが国内インフラ・暮らし・政策判断のどこに着地するのかを、出典付きで見えるようにすることです。

Repository:

https://github.com/Oranquelui/japan-economic-security-globe

## What Is Public Now

- official-statistics-first rice launch view
- semantic scope and layer pane
- map-dominant desktop workspace
- one contextual evidence inspector
- explicit signals and 47-prefecture comparison views
- legacy URL compatibility and source/license surfaces
- Cloudflare Workers deployment from GitHub `main`

## What It Is Not Yet

- not complete real-time AIS coverage of every tanker heading to Japan
- not a live operational intelligence system for real-world decisions
- not a military target-selection interface
- not a raw/live camera, passenger, person, vehicle-id, or license-plate tracking surface
- not a reusable dataset made from third-party source material
- not a completed mobile redesign
- not a sourced regional logistics-impact index; that layer stays disabled until typed metrics exist

Complete external maritime AIS support coverage should be treated as a Phase 1 provider integration. It requires a licensed AIS or port-call data provider, explicit coverage limits, and source freshness labeling.
Future visual inputs should be modeled only as aggregate `VisualObservation` buckets such as congestion level, lane blocked, queue length bucket, visibility status, and last verified time. Public UI must not expose raw video, live camera URLs, people, plates, or vehicle identities.

## License Position

The code is open source under `Apache-2.0`.

The project should not switch to MIT for the public launch. MIT is permissive and valid, but Apache-2.0 is the better fit here because this project may grow into an institutional intelligence/data product. Apache-2.0 remains permissive while giving clearer patent, notice, and trademark boundaries for downstream use.

Source-linked seed data is not relicensed as a single corpus. Public and private source materials are handled under source-specific conditions; see [`DATA-SOURCES.md`](../DATA-SOURCES.md).

## Suggested X / LinkedIn Copy

日本レジリエンス地図 v0.5.0 を公開しました。

e-Stat の都道府県別コメ収穫量を入口に、対象範囲・期間・単位・公式出典、意味別レイヤー、地図、単一の根拠インスペクタを同じワークスペースで確認できます。シグナルと47都道府県比較は必要なときだけ開きます。

「日本が今なにを注視すべきか」を、暮らし・政策・国内インフラに着地させて見せることを狙っています。

https://economic-security.quadrillionaaa.com/

Repo:
https://github.com/Oranquelui/japan-economic-security-globe
