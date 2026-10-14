# ユーザー指示による一時停止

実ブラウザと測定キューは停止済み。742件のGUI測定記録と685件の入力・未完了ケースを統合し、計1,427ケース、個別FAIL指示書212件を保存した。全サービス・全料金関連入力の検証は未完了。アプリ・価格DBの修正やデプロイは実施していない。

現在の結果は summary.md、fix-all.md、pause-state.json を参照。リポジトリ外の全証跡スナップショットは pause-state.json の durablePauseSnapshot に保存する。空き容量のため一部の補助索引JSONを .json.gz に無損失圧縮している。元GUI観測、個別ケース、入力対応表、coverage、スクリーンショットは直接参照できる。

再開はユーザーの明示指示後のみ。自動起動・CI登録はしない。ストレージ増強後、最初に runners/parity-resume-detach.py を実行して共有する可変ファイルを切り離し、停止スナップショットを保護する。ヘルパーは runners/helper-versions/latest-index.json の source と archive の対応から /tmp の元パスへ復元できる。/tmp/aws-parity-current は runners/current-run-id.txt の内容を改行なしで復元する。公開ビルドが変わっていたらこの試行へ新料金を混ぜず、別スナップショットとする。

並行測定の45新ケースは統合済み。旧shardsのseed planを再利用してmergeしない。新たなshardを現在のcanonical記録から作る。次の候補キューは保存ヘルパーの parity-complete-known.sh および parity-next-full-20261014.sh にあるが、ケース状態・GUI等価性を確認し、新shard／保存先で再開する。原記録のPASSは内訳の確認が未完了ならINCOMPLETEへ留める。
