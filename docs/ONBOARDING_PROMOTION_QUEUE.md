# Service Onboarding Promotion Queue

最終更新: 2026-10-05

本書は、複数のChatGPT/Codex作業が異なるAWSサービスを同時にオンボーディングまたは再オンボーディングする場合のbranch、PR、main統合、Price DB publish、Pages deployの直列化規則を定義する。

`docs/SERVICE_ONBOARDING.md` のNew Service Onboarding / Existing Service Re-onboardingに共通して適用する運用補足である。

## 1. 目的

サービス固有の調査・実装は並列実行を許可しつつ、共有状態を更新する次の区間だけを直列化する。

```text
latest mainとの統合
-> merged candidate validation
-> main push
-> Price DB build / validation / publish
-> Pages deploy
```

別チャットで開始時刻がずれた複数のオンボーディングが存在しても、人間が順番を管理する必要がない構成とする。

## 2. 作業branch

オンボーディングはmainへ直接実装しない。

- 新規サービス: `onboard/<serviceId>`
- 既存サービス再オンボーディング: `reonboard/<serviceId>`

異なるserviceIdは並列作業してよい。

同一serviceIdについて複数のオンボーディングbranchを同時に進めてはならない。

各branchではCalculator調査、Pricing Mapping、Definition、coverage、Golden、tests等のサービス固有作業を完了し、通常のPR CIを通す。

## 3. READY状態

branch側の実装・検証が完了したらmainへ直接mergeせず、PRへ `onboarding-ready` labelを付与する。

このlabelがpromotion queueへのenqueueを表す。

queueの実体はopen PRそのものであり、Actions runのpending状態をキューとして使用しない。そのため、同時に多数のサービスがREADYになった場合や、開始・完了時刻がずれた場合でもREADY状態は失われない。

関連label:

- `onboarding-ready`: promotion待ち
- `onboarding-promoting`: 現在promotion中
- `onboarding-blocked`: main統合またはpublicationで要対応

`.github/workflows/onboarding-promotion.yml` が必要なlabelを自動作成する。

## 4. dequeue順序

promotion dispatcherは、openかつdraftでない `onboarding-ready` PRのうち、`onboard/` または `reonboard/` branchを対象にする。

READY候補の中ではPR作成時刻が古いものを優先する。

未完成でREADYになっていない古いPRは後続READY PRを妨げない。

## 5. promotionの排他区間

`.github/workflows/onboarding-promotion.yml` は `service-onboarding-promotion-dispatch` concurrency groupを使用する。

1回のdispatcherは、1件のPRについて次を最後まで保持する。

1. 最新mainをcheckout
2. 対象PR headをworktreeへmerge
3. `services/catalog.json`を再生成
4. repository test / Definition validation / E2E / site build
5. mainが途中で進んでいないことを確認
6. mainへpush
7. 対応する `Scheduled Price Update` runの開始を確認
8. Price DB publishとPages deployを含むrun完了まで待機
9. 成功後にpromotion完了

この区間が完了するまで別サービスをmainへpromotionしない。

## 6. queueの再駆動

promotion workflowは以下で起動する。

- onboarding PRのopen / reopen / label変更
- `Scheduled Price Update` 完了
- 10分ごとのschedule
- manual dispatch

したがって、一時的なraceでmainが先に進んだ場合や、dispatcher eventが集約された場合でも、open PR上の `onboarding-ready` 状態を次回起動時に再走査して処理を継続する。

GitHub Actionsのconcurrency pending runそのものには任意件数FIFOキューとしての責務を持たせない。

## 7. Price DB health gate

promotion開始前にmainの最新 `Scheduled Price Update` を確認する。

- queued / in_progress: 新しいpromotionを開始しない
- completed + success: promotion可能
- failed / cancelled: fail-closedでpromotionを停止

Price DB publicationが失敗した状態で次サービスをmainへ積み増さない。

失敗後は原因を修正し、`Scheduled Price Update` が成功したことを確認するとqueue処理を再開できる。

## 8. services/catalog.json

`services/catalog.json` は複数サービスbranchから編集されやすい共有ファイルである。

promotion時には `tools/generate-service-catalog.js` を実行し、`services/*/service.json` を基準にcatalogを再構築する。

merge conflictが `services/catalog.json` のみの場合はdispatcherが自動解決し、その後catalogを再生成する。

catalog以外にmerge conflictがある場合は推測解決せず、対象PRを `onboarding-blocked` にしてqueueから外す。

## 9. validation failure

最新mainと統合した状態でtest / validation / E2E / buildが失敗した場合、そのPRをmainへpushしてはならない。

対象PRは `onboarding-blocked` とし、修正後にbranch CIを通して再度 `onboarding-ready` を付ける。

1件のblocked PRは、他のREADYサービスを恒久的に停止させてはならない。

## 10. main race

merged candidateのvalidation中にmainが別要因で進んだ場合、古いbaseへpushしない。

そのpromotion attemptはpushせず終了し、PRをREADYのまま残す。次回dispatcherが新しいmainを基準に再統合・再検証する。

## 11. scheduled price updateとの関係

Scheduled Price Updateは通常の定期料金更新にも使用する。

promotion dispatcherは、サービス統合後に起動したPrice Update runを監視し、そのrunがPrice DB publishおよびPages deployまで成功することをpromotion完了条件とする。

promotionと無関係なscheduled updateが実行中の場合は、その完了まで新しいpromotionを開始しない。

## 12. ChatGPT / Codexの完了報告

並列オンボーディング時、実装エージェントはbranch実装完了だけを「公開完了」と報告してはならない。

状態を区別する。

```text
implementation complete
-> PR ready / queued
-> promoting
-> main integrated
-> price published
-> pages deployed
-> completed
```

ユーザーへ最終的なオンボーディング完了を報告するのは、対象PRのpromotionと対応Price Update / Pages deployが成功した後とする。
