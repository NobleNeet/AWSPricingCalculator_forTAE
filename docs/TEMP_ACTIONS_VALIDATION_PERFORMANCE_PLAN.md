# 一時改善計画: GitHub Actions 価格検証ワークフロー高速化

> **状態: 部分実装・受入検証未完了（2026-10-12）**
>
> **この文書は一時的な作業計画であり、恒久仕様書ではない。**
> 本計画の実装、性能計測、互換性確認、適用対象ワークフローの正常終了まで完了したら、**最終作業としてこのファイル自体をリポジトリから削除すること**。完了後に「参考資料」として残さない。未完了・失敗・保留の段階で削除してはならない。削除コミットの前に、恒久的に維持すべき仕様や運用上の注意点を既存の適切なdocs・コードコメント・テストに反映する。

## 進捗記録（2026-10-12）

- 現行mainにはSemantic/Driftとも最大8 workerの決定的割当て、worker単位artifact取得、Driftキャッシュ、およびworker結果のmergeが既に存在することを確認した。これらを今回新規実装したとは扱わない。
- worker割当ての完全性検証を強化し、8 worker上限、worker ID重複、worker計画件数不整合、論理バッチ内容改変を検出するよう変更した。
- `tests/performance/work-pool-integrity.test.js` を追加した。
- **未完了**: 後方offsetの不要な枝展開・ケース生成削減、旧新の同等入力での数値比較、重いCIおよびPrice Update Actionsの実行確認、Finalize Replay互換性の検証。新規テストの実行結果も未確認。したがって計画は完了しておらず削除は禁止。

## 1. 背景・目的

2026-10-11の Scheduled Price Update 実行（[run 38135662931](https://github.com/NobleNeet/AWSPricingCalculator_forTAE/actions/runs/38135662931)）は成功したが、約56分39秒を要した。調査時の実行構成は Semantic 96バッチ、Drift 157バッチ（各 max-parallel: 8）で、バッチごとにrunner起動、checkout、npm ci、大きな workspace artifact の再取得が発生した。

また、Semantic/Drift の `caseOffset` 処理は、担当開始位置まで `reachableCaseIterator` を列挙して破棄するため、特に後方のバッチで不要なケース生成が多い。Semanticの観測値では、実ケース965,701件に対して延べ約4,490,701件のイテレータ出力（約4.65倍）が発生する計算となった。これは**ケース生成回数**であり、全ケースの評価処理時間が4.65倍だったという意味ではない。

本計画の目的は、**検証精度・網羅性・公開安全性を維持し、総実行時間と転送量、runner起動回数を削減する**こと。計画対象を Scheduled Price Update に限定せず、共通検証エンジンを利用する CI 等にも適用する。

## 2. 対象と非対象

| 対象 | 適用内容 |
| --- | --- |
| `.github/workflows/price-update.yml` (Scheduled Price Update) | Semantic / Drift をそれぞれ最大8個の長寿命workerで処理、artifact再利用、計測 |
| `.github/workflows/price-validation.yml` (共通Semantic検証) | worker-pool化と不要ケース生成削減。呼出元全体で互換性を保つ |
| `.github/workflows/ci.yml` (Application and Definition CI) | 共通Semantic改善を利用。既存の `heavy` / scope判定は維持 |
| `.github/workflows/finalize-replay.yml` | 共通Drift範囲処理の効率化を再利用。再実行するバッチの意味・選択は維持 |
| Semantic / Drift planner、iterator、worker、バッチ実行・集約ツール、関係テスト | 上記変更に必要な改修 |
| `.github/workflows/onboarding-promotion.yml` | 価格更新ワークフローへの委譲による間接的な効果を確認。既存の直列promotion制御は変更しない |

**今回の範囲外:** artifact自体のサービス・リージョン別小型化／分割配信、GitHub Pagesデプロイ最適化、RDS Oracle単独監査、復旧ワークフロー一般の再設計。artifact小型化は**本計画の性能計測後の別フェーズ**として改めて判断する。Self-hosted runner導入も今回の前提としない。

## 3. 設計方針

### 3.1 最大8 workerでの複数バッチ処理

- 現行の「1 matrix job = 1バッチ」を、**1 matrix job = 複数バッチを順次処理するworker**へ変更する。SemanticとDriftは原則それぞれ別workerプールを持つ。
- 同時実行worker数は**上限8**。対象バッチが少ないときに常に8個起動しない。将来の調整に備えて設定可能とする。
- ワークロードが不均一なサービス／リージョンを考慮し、workerへの割当てを偏らせない。分配方式は決定的・再現可能とし、実際の偏りを計測する。必要なら複数バッチ/workerの重み付き分配を用いる。
- 各workerは**checkout・Nodeセットアップ・npm ci・必要artifactのダウンロードを原則開始時に各1回**だけ行う。同一worker内では同じローカルcandidate/planデータを再利用する。
- GitHub-hosted runner同士のローカルディスク共有は想定しない。複数worker間の結果共有は明示的なartifactで行う。
- 単なるバッチループ化だけでなく、可能な範囲で同一workerプロセス内の共通データ読み込み・インデックス作成を再利用する。ただしメモリ上限や独立性を損ねないこと。
- 各workerの結果は複数バッチ分をまとめてアップロードしてよいが、**各論理バッチIDの結果・重複・欠落・不正割当てをmergeで検出できること**。失敗を握り潰して公開を進めない。
- 現在の「処理が継続し進捗がある限り不要に打ち切らない」意図を保ち、長時間workerのheartbeat、進捗監視、ハング検出、GitHub Actionsの実行上限に注意する。

### 3.2 Semantic / Drift の不要ケース生成削減

- Semantic (`tools/pricing-cli/semantics.js`等) とDrift (`tools/pricing-cli/drift.js`等) の現在の `caseOffset` まで逐次ケースを生成して破棄する処理を改善する。
- **単純にoffset判定を別の場所に移すだけでは不十分**。事前計算した分岐件数・インデックス・決定的な部分木分割などにより、対象範囲まで効率的に到達できる仕組みを検討・実装する。
- case indexの順序、サービス/リージョン別ケース集合、選択肢の組合せ、条件分岐、依存参照、結果の意味を維持する。範囲指定あり／なしでのケース集合・結果が一致することをテストする。
- 既存のSKU絞込み、差分検証、Drift再実行選択を壊さない。検証対象を性能改善の名目で暗黙に省略しない。
- Planner側の重複した全ケース列挙も調査し、可能なら共通のカウント/計画情報を再利用する。ただし新旧候補でケース数が異なり得る点に注意し、別の基準データの件数を無条件に流用しない。

### 3.3 Scopeと公開安全性

- `ci-validate.js` の `heavy` と validation scope判定、オンボーディング対象サービス限定、候補生成のPrice Updateへの委譲はそのまま維持する。
- CIの通常のユニットテスト、Playwright E2E、サイトビルドは今回のworker-pool化と混同しない。
- 価格DBの候補組立→Semantic→Golden→Drift→finalize→publish→Pagesの品質ゲートを維持し、**必要なSemanticまたはDriftの1バッチでも未完了／失敗ならpublish不可**とする。
- 既存のartifact名やレポートスキーマに外部参照がある場合、互換性を維持するか、利用箇所を漏れなく同時更新する。
- 別会話や異なるサービスの並行オンボーディングと、既存のpromotion直列化／価格DB整合性を損ねない。

## 4. 実装順序（途中で仕様を推測しない）

1. **現行状態の再調査・ベースライン固定:** 着手時点の `main`、workflow呼出関係、関連スクリプト／tests、対象runのタイミング・転送量を確認。現行仕様書（特に `AGENTS.md`、`docs/AUTONOMOUS_IMPLEMENTATION.md`、関連architecture/CI文書）と整合させる。
2. **テストと計測の先行整備:** case offset/limit、全範囲対分割、条件分岐、サービス/リージョンのバランス、worker欠落・重複・失敗、merge完全性を検証するテストを用意する。転送、setup、読み込み、計画、実処理、merge、ピークメモリの計測点を追加する。
3. **共通Semanticエンジン改善:** 不要ケース生成とplan重複を削減し、決定性・結果一致のテストを通す。
4. **共通Semantic worker-pool化:** `price-validation.yml`を変更し、Scheduled Price UpdateとApplication and Definition CIの両方を検証。artifact未指定（CI）／指定（Price Update）の両経路を確認する。
5. **Driftエンジン改善:** 効率的範囲処理と必要な計画情報再利用を実装。新旧DB比較、差分SKU限定、Finalize Replayでの限定再実行を検証する。
6. **Scheduled Price UpdateのDrift worker-pool化:** 8 worker上限、各worker1回のworkspace取得、バッチ結果の完全な集約、進捗監視を実装する。
7. **全体の実測比較・調整:** 変更前と同等の入力・検証スコープで実行し、差分の正当性を確認。バッチサイズ、worker数、分配偏りなどを測定に基づいて調整。やみくもなmax-parallel増加を主対策にしない。
8. **完了ゲートと一時文書削除:** 下記条件を満たすまで本書を保持する。すべて満たしたら恒久資料・テストへ必要情報を移した上で、このファイルを削除するコミットを作成する。

## 5. 計測指標と受入条件

**比較する指標:** 全run wall-clock、Semantic計画／worker／merge時間、Drift計画／worker／merge時間、worker起動数、checkout/setup/npm ciの延べ時間、artifactダウンロード回数・サイズ・時間、1worker当たり処理件数と最長/中央値、実評価ケース数と不要なiterator生成数、ピークメモリ、失敗・リトライ有無。実測値は同等スコープで比較し、GitHub側のキュー待機の変動と計算時間を区別する。

**受入条件:**

- [ ] SemanticとDriftが各**最大8 worker**で、各worker内で複数論理バッチを処理し、共通データを使い回す。
- [ ] workspace artifactは各workerが**原則1回のみ**取得。Semantic/Drift間のrunner跨ぎ再利用は要件にしない。
- [ ] 範囲指定による不要ケース生成が実質的に削減され、代表的な後方offsetで改善を計測できる。
- [ ] 検証ケースの件数・集合・判定、レポート整合性、バッチ欠落・重複時の失敗がテストで保証される。
- [ ] CIの`heavy`とscope、オンボーディング限定処理、Golden、publish安全ゲートが維持される。
- [ ] Scheduled Price UpdateとApplication and Definition CIの関連経路が成功する（重いCI経路を含む）。Finalize Replayは実行可能な安全な検証方法で互換性確認する。
- [ ] baseline対変更後の性能・転送量を数値で記録し、残課題とartifact小型化の要否を判断する。改善が測れない場合は原因を追い、必要な修正・再測定を行う。
- [ ] 仕様上恒久化が必要な内容は恒久文書・コード・テストへ移し、**本計画ファイルを削除するコミットまで完了**する。

## 6. 削除ルール（必須）

本ファイル `docs/TEMP_ACTIONS_VALIDATION_PERFORMANCE_PLAN.md` は**作業中だけのチェックリスト**であり、完了後は存在してはならない。

- 作業中: 状態・測定値・未解決課題を必要に応じて追記してよい。
- 失敗、部分実装、未計測、ワークフロー未検証: 削除禁止。
- すべての受入条件を満たした後: 運用ルールや設計上の恒久事項を適切な既存docsと自動テストへ移してから、**最後の仕上げとして本ファイルをgitから削除する**。
- 最終報告: 変更箇所、実測前後差、テストとActionsの結果、artifact小型化の次期判断、**一時計画書を削除済みであること**を明記する。性能改善が確認されないまま計画を「完了」と扱わない。

## 7. 参照

- [性能調査対象run](https://github.com/NobleNeet/AWSPricingCalculator_forTAE/actions/runs/38135662931)
- [Scheduled Price Update](../.github/workflows/price-update.yml)
- [共通Semantic検証](../.github/workflows/price-validation.yml)
- [Application and Definition CI](../.github/workflows/ci.yml)
- [Finalize Replay](../.github/workflows/finalize-replay.yml)
- [CI検証方針](CI_VALIDATION.md)
- [自律実装ガイド](AUTONOMOUS_IMPLEMENTATION.md)
