# EC2の公式入力差異をUATが検出できなかった理由

調査日: 2026-10-13 JST。調査対象checkout: `c500cc312e2a2533a3cb81ce3fba8ecb8c988488`。

調査後、2026-10-13の指示により[Parity Test共通仕様](AWS_CALCULATOR_PARITY.md)へ双方向棚卸し・欠落判定・入力と料金の別集計を反映した。以下のケース定義上の不足は改訂前の仕様についての調査結果であり、過去の実測結果を再判定したものではない。

## 結論

UATケースの定義に不足がある。通常UATはアプリ内の操作成立・再計算を検証しており、公式EC2の項目一致を合格条件にしていない。独立したParity Test仕様も、公開アプリ側の入力棚卸しを中心にしており、公式だけに存在する入力の欠落を確実に検出する双方向の対応表・判定ゲートが明確ではない。

ただし、以前の全件試験1592ケースの元記録はこのcheckoutと確認したローカル保存先に見つからない。その試験が実際に何を省略し、EC2についてどのURLを用いたかは確定できない。ケース定義上の問題と、旧試験担当の具体的な実施ミスを同一視しない。

## 指定された公式URLを参照していたか

指定URL: `https://calculator.aws/#/createCalculator/ec2-enhancement`。

| 記録 | 確認結果 | 証明できる範囲 |
|---|---|---|
| 2026-10-04の通常UAT | 公式URL・双方比較の記録なし | ローカルアプリの24ケースの操作検証。公式EC2項目一致の証拠にはならない |
| 以前の全件試験1592ケース | 元ケース・coverage matrix・URL registryが見つからない | 参照URLを確認できない |
| 2026-10-11の日本語ラベル調査 | 指定URLが参照表に明記 | 公式ラベルを参照したこと。全入力の実装や金額一致を検証したこととは別 |
| 2026-10-11のDedicated調査 | 指定URL、日時、画面本文、入力一覧を保存 | 指定URLの実画面を利用したこと。記録自身がGUI-field discovery onlyと明記 |
| 2026-10-11のEC2/io2比較 | 公式の`#/createCalculator/EBS`を利用 | EC2内蔵EBSのio2小計の比較。EC2全体の入力一致・総額一致ではない |

根拠:

- [通常UATの環境と結果](results/2026-10-04/REPORT.md): 対象は`127.0.0.1:4180`と障害配信用の`4181`。EC2追加はLinux/t3.micro・730時間・1台・9.93 USDのアプリ表示確認。
- [ラベル調査](../DRAWER_LABELS_JA.md): `ec2-enhancement`を参照。`#/createCalculator/EC2`はエラーになると記録。調査対象は項目名・見出しであり、新入力追加ではないと明記。
- [Dedicatedの公式GUI記録](../estimate-quality/runs/20261011-quality/aws-ec2-dedicated-visible.json): `2026-10-11T09:56:04.607Z`、指定URL、Ohio、使用率50%。同条件Tokyo料金比較ではないと明記。
- [Dedicated調査スクリプト](../../tools/acceptance/official/dedicated-fields.js): 指定URLへ実際に`page.goto`する。
- [品質改善URL registry](../estimate-quality/runs/20261011-quality/service-url-registry.json): `ec2`のURLはEBS画面。`comparisonScope`で内蔵EBSに限定している。
- [品質改善結果](../estimate-quality/runs/20261011-quality/REPORT.md): EC2は13ケース・7入力キー、11 GUI PASSはio2。2ケースはDedicated独立時間でNOT_COMPARABLE。全サービス全入力の検査率ではないと明記。

したがって「指定URLを一度も参照しなかったために差異が生じた」とは言えない。一方、「旧全件UATでも指定URLを正しく参照した」とも証拠なしには言えない。

## ケース定義と検証範囲の問題

### 1. 通常UATには公式との比較条件がない

[UAT-J001-02](cases/UAT-J001-02-add-ec2.md)のExpected resultはRow・設定概要・USD月額・Plan合計への反映。[UAT-J003-01](cases/UAT-J003-01-edit-usage.md)は使用量変更によるService/Plan/deltaの更新である。公式の項目一覧、選択肢、初期値、条件付き表示、対応する金額差分の照合は要求していない。

通常UATの24/24 PASSはその範囲では成立する。しかし、公式互換性を確認した根拠として使用できない。実施日は10月4日で、後のEC2項目追加・修正前のcommitが対象である。

### 2. Parity Testは公式側からの欠落検出が弱い

[Parity Test仕様](AWS_CALCULATOR_PARITY.md)の§3は公開版のサービス・Profile・Primary/Advanced/conditional入力のGUI棚卸し、§5は全サービス・全料金関連入力の変更検証を要求する。項目未検証のPASSは禁止しており、規定そのものが代表ケースだけの合格を認めているわけではない。

ただし、公式EC2の全入力を先に独立棚卸しし、公開版と双方向に照合する明確な手順がない。公式だけにある項目がケース生成の母集団に入らなければ、公開版にある全入力を試験しても欠落を検出できない。欠落入力をFAILにする基準、仕様上の除外を認める根拠、欠落を含む公式側の網羅率も明確ではない。

§7のNOT_COMPARABLEは仕様差や非等価条件を記録するために必要だが、仕様で許可されない未実装入力まで仕様差として免責しない区別が必要である。旧試験が実際にこの誤分類をしたかは元記録がなく未確認。

### 3. 価格検証・日本語表記検証は入力完全性を保証しない

- [EC2 coverage](../../services/ec2/coverage.json)はPrice Listのカテゴリを分類する。現checkoutではmapped 5・ignored 335・unresolved 0。unsupportedカテゴリをignoredにできるため、unresolved 0は公式入力の実装率100%を意味しない。
- [日本語ラベルunit test](../../tests/app/drawer-labels-ja.test.js)と[E2E](../../tests/e2e/drawer-labels-ja.spec.js)は既存Definition/表示カタログを列挙する。公式にあるがDefinitionにない入力を検出する独立した項目リストはない。
- 10月11日のEC2金額比較はio2境界を中心とした選定試験。小計一致はEC2ドロワー全体の一致を保証しない。報告にはこの限界が明記されている。

## 現在の公式画面とEC2定義の差異

今回、指定URLをChromiumでレンダリングし、EBS・Detailed monitoring・Data transfer・Additional costsの折りたたみを実際に展開した。観測日時は`2026-10-12T15:31:55.131Z`（2026-10-13 00:31:55 JST）。[観測本文](investigations/2026-10-13-ec2-official-fields.json)を保存した。Ohio/Shared/Linuxの一状態の読取であり、全選択肢・全条件付き項目の網羅調査、価格Parityの再実行ではない。初期購入選択は変更していないため、本文の表示金額は価格判定に使用しない。

| 公式画面で観測した項目 | 現checkoutのEC2定義 | 判断 |
|---|---|---|
| Payment optionsの購入プラン選択 | On-Demand固定 | 対象外でよい。Expected utilizationは月間時間入力として別途保持する |
| Workloads | 入力なし | `docs/SPEC.md` §6.1に明示的な省略規定がある。今回の「支払い以外を一致」との期待とは差があり、無条件に実装ミスとはしない |
| EBS Snapshot Frequency | 対応入力・課金Componentなし | 公式側から棚卸しすれば発見できる欠落 |
| Detailed monitoring / Enable monitoring | 対応入力・課金Componentなし | On-Demandの料金に関係し得る項目。購入プラン除外で省略できるものではない |
| Data transfer / Inbound・Intra-Region・Outbound / 相手先・データ量・単位 | 対応入力・課金Componentなし | 履歴上、クロスサービス料金対応待ちとして削除された。On-Demand固定による除外とは別 |
| Additional costs / placeholder cost such as Licensing | 対応入力なし | AWS SKU料金ではなく利用者が加える費用。採用方針の明示が必要で、欠落を自動的にAWS価格計算の不具合としない |

データ転送はcommit `9b1c7d1`で追加後、`7dc3456`（2026-10-04 14:26 JST）でProfileから外し、`e2f8356`で定義を削除している。初期実装制約が理由として履歴に残るため、後日のUATではこの未対応を入力差異として明示すべきである。

[オンボーディング仕様](../SERVICE_ONBOARDING.md) §5はdata transfer、monitoring等をOn-Demand料金へ影響する採用対象とし、§6は料金意味に影響しないUI専用項目・重複・対象外購入プラン等に省略を限定する。この要件と、既存EC2の未対応範囲を入力対応表で照合する必要がある。

## 改善すべき受入基準

1. 指定URLを公式EC2の参照先として固定し、実行結果ごとにURL・日時・公開commit/build・言語・Regionを保存する。EBS画面による部品比較は別scopeとする。
2. 公式側と本ツール側を別々に棚卸しし、全項目の対応表を作る。購入プラン選択、主要/詳細/条件付き項目、選択肢、単位、初期値、依存関係を区別する。
3. 各公式項目を「対応済み」「仕様根拠付き除外」「未実装」「未確認」に分類する。未実装・未確認をPASS分母から消さない。支払い以外に除外する項目は正本仕様の根拠を付ける。
4. 入力対応の合否と料金一致の合否を別に報告する。入力欠落を金額一致やPrice List validationのPASSで相殺しない。
5. 対応済み入力について、同等条件の基準額・変更後額・差分を比較する。部品小計、仕様差、比較不能、代替検証を区別する。
6. 全件試験のcase JSON・coverage matrix・URL registryを、元の実行環境を離れても追跡できる保存先に置き、集計から辿れるようにする。

今回は調査報告と公式項目の観測証跡のみを追加した。アプリ実装、正本仕様、過去のPASS判定は変更していない。
