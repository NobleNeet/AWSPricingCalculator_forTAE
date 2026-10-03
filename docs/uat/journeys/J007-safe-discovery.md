# J007 — 安全に操作を発見・取消・削除する

## User intent

目的Serviceや主要操作を説明なしで見つけ、誤操作を取消でき、破壊操作を安全に行う。

## Main flow

Service追加導線発見 → Catalogから対象選択 → 追加/置換を取消 → ServiceをPlanから外す → Plan削除 → 最後の1Plan保護。

## Success

主要操作が発見可能で、取消で状態が変わらず、破壊操作で意図しないデータ損失を起こさない。