# 日本経済安全保障グローブ

日本経済安全保障グローブは、日本の戦略的依存を「日本中心の運用マップ」「国際補助レイヤー」「根拠グラフ」「オペレーション表」で説明する、公共目的のセマンティックWeb MVPです。

最初の表示は `Energy` を中心にしています。理由は、2026年4月時点では原油、LNG、海上輸送路、電気代、物流への関心が高く、注目を取りやすい入口だからです。ただし、このプロジェクトは一時的なニュース可視化で終わらせません。`Rice`、`Water`、`Defense`、`Semiconductors` も同じオントロジー上に最初から載せています。

## 中心となる問い

> 日本は何に依存しているのか。そして、その依存は暮らし、公共支出、国内インフラのどこに着地するのか。

この問いを、次の4層で見せます。

- `Japan operations map`: コメ、水、貯水池、港湾、LNG受入基地、製油所、都道府県など、国内に着地する影響を主画面で見せる。
- `Global supporting layer`: 原油、LNG、石炭、半導体、供給国、海上輸送路、チョークポイントなど、世界依存の関係を日本への補助文脈として見せる。
- `Evidence graph`: 政策、予算、法令、組織、出典文書、provenance の関係を見せる。
- `Operations table`: 依存ルート、観測シグナル、国内着地点を運用リストとして並べ、Palantir 的な意思決定画面の情報構造に寄せる。

このプロジェクトの主語は日本です。外国は、あくまで日本人の暮らしや安全保障への影響を説明するために表示します。一般的な国別プロフィール集ではありません。

## セマンティックWebを使う理由

目的は、きれいな地図を描くだけではありません。日本の依存関係、政策根拠、予算、法令、出典を、後から OWL / RDF / SHACL / SPARQL に自然に移行できる形で設計することが目的です。

現在の MVP では、すでに次の層を分けています。

- `types/semantic.ts`: 国、地域、資源、製品、依存フロー、観測値、出典、グラフエッジの意味モデル。
- `data/seed/`: Phase 0 用のローカル seed JSON。各項目に provenance を持たせ、将来の `prov:wasDerivedFrom` に対応しやすくしている。
- `ontology/`: OWL/RDF 化を前提にした初期 Turtle ファイル。
- `queries/`: 5つの公共ストーリーに対応する SPARQL クエリ例。
- `lib/semantic/`: テーマ別 selector、detail view、provenance helper、SPARQL preview、表示用 view model。

各詳細パネルには、概要、日本にとっての意味、出典文書、関連エンティティ、将来の SPARQL クエリ案を表示します。

## MVP の範囲

MVP では、各テーマについて薄いが一貫した一連の導線を入れています。

- `Energy`: 原油、LNG、石炭、湾岸ルート、ホルムズ海峡、マラッカ海峡、横浜港、袖ケ浦LNG受入基地、京浜製油所エリア。
- `Rice`: コメ価格圧力、備蓄・政策シグナル、エネルギーや肥料投入が家計の食料負担へつながる流れ。
- `Water`: 東京都と小河内貯水池を使った水ストレス例。
- `Defense`: 2026年度防衛予算からスタンド・オフ防衛能力への予算フロー例。
- `Semiconductors`: 台湾、韓国、オランダ、米国、中国と日本を結ぶ先端半導体依存フロー。

Phase 0 の物流粒度は「港湾・受入基地まで」です。つまり、海上チョークポイント、輸入ルート、日本側の港湾、LNG受入基地、製油所までを扱います。国内トラック輸送、倉庫、小売流通網は今後の対象です。

## ロードマップ

`Phase 0`: 公開 MVP

- 無料公開サイト。
- 認証なし。
- データベースなし。
- ローカル seed JSON と Turtle artifact。
- Cloudflare だけで運用できる構成を優先。
- 日本人向けの依存インテリジェンスとして公開する。

`Phase 1`: 地政学的隣国レイヤー

- 主語は引き続き日本と日本人。
- 日本への影響説明に必要な範囲で、地政学的隣国との関係を追加する。
- ルート、港湾、施設、出典文書の対象範囲を増やす。
- 繰り返し可能な取り込み処理と検証を始める。

`Phase 2`: 法人・組織向け intelligence product

- メディア、シンクタンク、政策チーム、リスク管理チーム、事業戦略チーム向けの有料ワークスペース。
- ルート、資源、政策、予算、出典更新に関するアラート。
- 非公開シナリオノートブックと保存済みグラフビュー。
- 依存グラフの部分データに対する API / データアクセス。
- 内部データ統合とカスタムオントロジーマッピング。
- OWL / RDF / SPARQL / SHACL 導入支援パッケージ。

Palantir 的に考えるなら、長期価値は公開地図そのものではありません。公共データ、民間データ、出典根拠、アラート、シナリオ、意思決定の流れをつなぐセマンティック運用レイヤーが価値になります。この MVP は、Phase 0 を過剰な法人向け製品にせず、その将来拡張だけを設計上残しています。

## ローカル起動

```bash
npm install
npm run dev
```

テストと本番ビルド:

```bash
npm test
npm run build
```

Cloudflare Workers 実行環境に近いプレビュー:

```bash
npm run preview
```

Cloudflare Workers へのデプロイ:

```bash
npm run deploy
```

UI の表示自体は外部環境変数なしで動きます。  
ただし、今後 `e-Stat API` を live で叩く場合は `.env.local` に次を追加します。

```bash
ESTAT_APP_ID=your-estat-app-id
```

`appId` は [e-Stat](https://www.e-stat.go.jp/) のユーザー登録後、マイページの API 機能から発行します。公開前のローカル開発でも、登録時の URL は `http://localhost/` で問題ありません。

## Cloudflare Workers 配備

Phase 0 から `Cloudflare Workers + OpenNext adapter` を前提にします。  
本番の想定URLは `economic-security.quadrillionaaa.com` です。

- Worker runtime: Cloudflare Workers
- adapter: `@opennextjs/cloudflare`
- config: [wrangler.jsonc](/Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph/wrangler.jsonc)
- OpenNext: [open-next.config.ts](/Users/louistoyozaki/Documents/GitHub/jp-strategic-dependency-graph/open-next.config.ts)

注意点:

- Cloudflare Workers の custom domain は **active Cloudflare zone** が前提です。
- つまり `economic-security.quadrillionaaa.com` を Worker に直結するなら、`quadrillionaaa.com` は Cloudflare 側で管理されている必要があります。
- Route53 を authoritative DNS のまま維持したい場合は、Workers custom domain より Pages 側の方が簡単です。
- 今回は将来の server-side fetch、secret、scheduled ingestion を見越して Workers を採用しています。

この運用は、**収益化前の Phase 0 / Phase 1 までの公開運用**として扱います。

- GitHub 公開リポジトリを source of truth にする
- `main` と Cloudflare Workers を使って public site を更新する
- public civic layer を速く改善することを優先する

Phase 2 で institutional / paid product に入る時点では、この運用を最終形とみなさず、public site と private runtime を分ける前提で再設計します。

## Sources / License / 問い合わせ

公開サイトでは、アプリ右上のメニューから `共有` `Sources/License` `問い合わせ` を開けます。

- `Sources/License`
  - 出典ソース一覧
  - このサイトの利用方針
  - 権利処理の考え方
- `問い合わせ`
  - 開発依頼
  - データ修正/追加
  - 不具合・エラー
  - 取材・引用/連携
  - その他

問い合わせは公開フォームから受け付け、送信先は `ai@quadrillion-ai.com` です。返信先メールアドレスは必須で、機微な個人情報や秘密情報は送信しない前提にします。

## ライセンスとデータ方針

コードのライセンスはリポジトリ直下の `LICENSE` に従います。現時点では `Apache-2.0` を採用しています。

一方で `data/seed/` の出典付きデータは、コードと同じ意味で一括再ライセンスしていません。政府・公的機関ソースと民間ソースが混在するため、ソース別条件に従って扱います。詳細は `DATA-SOURCES.md` と `Sources/License` ページを参照してください。

## ディレクトリ構成

```text
app/                    Next.js App Router の入口
components/             日本運用マップ、国際補助レイヤー、オペレーション表、根拠ドロワー、アプリ外枠
data/seed/              Phase 0 用のローカル semantic seed data
docs/superpowers/       企画、ロードマップ、実装計画メモ
lib/data/               seed graph の読み込み処理
lib/semantic/           selector、detail view、provenance、SPARQL、表示用 model
ontology/               初期 Turtle ontology stub
queries/                SPARQL query example
types/                  semantic type と presentation type
```

## データと provenance

現時点では手動 seed data の MVP です。リアルタイムの公共データ配信でも、運用判断に使うインテリジェンスシステムでもありません。

ただし、各 entity、flow、observation は出典参照を持つ設計です。長期的には、この出典参照を `prov:wasDerivedFrom` を使った RDF triple に変換し、SHACL で検証し、SPARQL endpoint から提供することを目指します。

## 公共目的の注意

このプロジェクトは、日本に住む人が依存関係、政策根拠、国内影響を理解するためのものです。軍事的なターゲット選定 UI、恐怖を煽るダッシュボード、汎用的な国別探索ツールにはしません。プロダクトの主語は、日本と日本人です。
