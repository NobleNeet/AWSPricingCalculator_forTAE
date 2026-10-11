import { readFile, writeFile } from 'node:fs/promises';
import Decimal from '../../vendor/decimal.mjs';
const root=process.argv[2]??'docs/estimate-quality/runs/20261011-quality';
const result=JSON.parse(await readFile(`${root}/public-results.json`,'utf8'));
const deployment=JSON.parse(await readFile(`${root}/deployment.json`,'utf8'));
const records=result.records;
const counts=(items,key)=>items.reduce((out,item)=>{const value=item[key];if(value)out[value]=(out[value]??0)+1;return out;},{});
function service(record){return record.serviceId??(record.id.startsWith('io2')?'ec2':record.id.startsWith('s3')?'s3':record.id.startsWith('rds')?'rds':record.id.startsWith('aurora')?'aurora-postgresql':record.id.startsWith('fargate')?'fargate':'eventbridge');}
const services=[...new Set(records.map(service))].map(serviceId=>{
 const rows=records.filter(r=>service(r)===serviceId),fields=new Set(rows.flatMap(r=>Object.keys(r.inputs??r.fields??{}))),diffs=rows.filter(r=>['PASS','FAIL'].includes(r.guiVerdict)).map(r=>r.amountDifferenceUsd).filter(x=>x!==null&&x!==undefined),notComparableDiffs=rows.filter(r=>r.guiVerdict==='NOT_COMPARABLE').map(r=>r.amountDifferenceUsd).filter(x=>x!==null&&x!==undefined);
 return {serviceId,caseCount:rows.length,testedFields:[...fields].sort(),gui:counts(rows,'guiVerdict'),alternative:counts(rows,'alternativeVerdict'),functional:counts(rows,'functionalVerdict'),actions:counts(rows,'requiredAction'),maxComparableGuiAmountDifferenceUsd:diffs.length?Decimal.max(...diffs.map(x=>new Decimal(x).abs())).toString():null,maxNotComparableGuiAmountDifferenceUsd:notComparableDiffs.length?Decimal.max(...notComparableDiffs.map(x=>new Decimal(x).abs())).toString():null};
});
const summary={runId:result.runId,generatedAt:new Date().toISOString(),scope:'Six estimate-quality phases; fresh representative cases. Historical 1592-case audit not recounted.',publicUrl:result.publicUrl,deployment,recordCount:records.length,gui:counts(records,'guiVerdict'),alternative:counts(records,'alternativeVerdict'),functional:counts(records,'functionalVerdict'),actions:counts(records,'requiredAction'),services};
await writeFile(`${root}/summary.json`,JSON.stringify(summary,null,2)+'\n');
const columns=['id','serviceId','kind','guiVerdict','alternativeVerdict','displayVerification','functionalVerdict','requiredAction','inputs','ownScopeMonthlyUsd','ownServiceMonthlyDisplay','officialMonthlyUsd','ownBaselineScopeMonthlyUsd','officialBaselineMonthlyUsd','ownDeltaUsd','officialDeltaUsd','amountDifferenceUsd','deltaDifferenceUsd','expectedAlternativeMonthlyUsd','alternativeAmountDifferenceUsd','reason','screenshot'];
const escapeCsv=value=>'"'+String(value??'').replaceAll('"','""')+'"';
const csvValue=(r,key)=>({serviceId:service(r),inputs:JSON.stringify(r.inputs??r.fields??{}),ownScopeMonthlyUsd:r.own?.scopeMonthlyUsd,ownServiceMonthlyDisplay:r.own?.serviceMonthly,officialMonthlyUsd:r.official?.monthlyUsd,ownBaselineScopeMonthlyUsd:r.baseline?.scopeMonthlyUsd,officialBaselineMonthlyUsd:r.officialBaseline?.monthlyUsd,screenshot:r.own?.screen})[key]??r[key];
await writeFile(`${root}/results.csv`,[columns.join(','),...records.map(r=>columns.map(key=>escapeCsv(csvValue(r,key))).join(','))].join('\n')+'\n');
const lines=[
 '# 見積品質改善・公開版再試験', '',
 `実行ID: ${result.runId}。報告生成: ${summary.generatedAt}。`, '',
 `公開サイト: ${result.publicUrl}`, '',
 `実装PR: https://github.com/NobleNeet/AWSPricingCalculator_forTAE/pull/64。公開検査修復PR: https://github.com/NobleNeet/AWSPricingCalculator_forTAE/pull/65。公開コミット・Price DB・Actionsの証跡: [deployment.json](deployment.json)。`, '',
 '## 試験の判定', '',
 '| 試験 | 判定内訳 |', '|---|---|',
 `| 公式GUIとの料金比較 | ${JSON.stringify(summary.gui)} |`,
 `| GUI比較できない構成の独立Price List検証 | ${JSON.stringify(summary.alternative)} |`,
 `| 公開GUIの入力制約 | ${JSON.stringify(summary.functional)} |`, '',
 'NOT_COMPARABLEはGUI比較条件が等価でないという判定。ALTERNATIVE_VERIFIEDは別の検証結果であり、GUI PASSへ読み替えない。微小な表示額はUPPER_BOUND_ONLYとし、1セント未満という範囲だけを確認する。', '',
 '料金比較では表示額と基準からの変化量を原則0.01 USD以内で照合。io2は公式EBS画面に対応するEBS関連コンポーネント小計を比較し、EC2全体総額の一致とは扱わない。', '',
 '## 今後必要な対応', '',
 '| 区分 | 今回の件数 | 意味 |', '|---|---:|---|',
 `| RESOLVED | ${summary.actions.RESOLVED??0} | 今回の対象修正が公開GUIで確認できた |`,
 `| COMPARISON_LIMIT_DOCUMENTED | ${summary.actions.COMPARISON_LIMIT_DOCUMENTED??0} | 公式GUIの制約または公開式との差を記録し、独立検証を実施。GUI一致のための機能削除や丸め変更は行わない |`,
 ...Object.entries(summary.actions).filter(([k])=>!['RESOLVED','COMPARISON_LIMIT_DOCUMENTED'].includes(k)).map(([k,v])=>`| ${k} | ${v} | 未解決。各ケースの理由と証跡を確認する |`), '',
 'Archiveは公開式のKB/1024²換算を途中で丸めない。公式GUIの100百万件・1 KBは15.50 USD、1000百万件は155.00 USD。公式の表示された計算詳細が0.000001 GB/イベントを使うことを確認し、その値で合計を再現した。今回の自作側表示額と差は下表およびJSONに記録する。任意payloadでの丸め方式や公式内部コードを確認したという意味ではない。', '',
 'Schedulerの小数百万回入力は公式が拒否するが、単位selectorを「回/月」に切り替えると整数で同条件を設定できた。13,999,999・14,000,000・14,000,001・20,000,000回をこの方法で再測定。最初の拒否記録はofficial-extra-initial-rejected-decimals.jsonとして保存し、判定には採用しない。1回だけの課金は公式の計算詳細で確認し、金額表示はUPPER_BOUND_ONLY（1セント未満）として完全一致と区別する。', '',
 '## サービス別の今回対象', '',
 '| サービス | ケース | 検証した入力キー数 | GUI PASS | NOT_COMPARABLE | 代替検証済 | 入力制約確認済 | 最大GUI表示額差 USD |', '|---|---:|---:|---:|---:|---:|---:|---:|',
 ...services.map(s=>`| ${s.serviceId} | ${s.caseCount} | ${s.testedFields.length} | ${s.gui.PASS??0} | ${s.gui.NOT_COMPARABLE??0} | ${s.alternative.ALTERNATIVE_VERIFIED??0} | ${s.functional.FUNCTIONAL_PASS??0} | ${s.maxComparableGuiAmountDifferenceUsd??'—'} |`), '',
 '入力キー数は今回の代表ケースの対象数であり、各サービスの全入力棚卸し件数ではない。最大額差は等価条件でGUI比較できたケースだけを集計し、Archiveなどの比較不可の差を含めない。', '',
 '## ケース一覧', '',
 '| ケース | GUI | 代替/入力制約 | 今後の対応 | 表示額差 USD | 証跡 |', '|---|---|---|---|---:|---|',
 ...records.map(r=>`| ${r.id} | ${r.guiVerdict??'対象外'} | ${r.alternativeVerdict??r.functionalVerdict??'—'} | ${r.requiredAction??'—'} | ${r.amountDifferenceUsd??r.alternativeAmountDifferenceUsd??'—'} | ${r.own?.screen?`[画面](${r.own.screen})`:'取得不能'} |`), '',
 '## 未解決の過去分類と集計の限界', '',
 '過去の全件試験1592ケースの元ファイルはこのcheckoutにないため、今回の再試験で旧件数を差し引いた新しい全件集計は作っていない。今回の対象を完全な全サービス・全パラメータ検証済みとは表現しない。', '',
 '今回の6段階と別に、過去に原因調査としたgp3 throughput 5件とEventBridge微小payload 2件、許容差判断としたFargate 7件は、今回の結果へ混ぜて解消済みにしていない。', '',
 '公式GUIの機能欠落・条件差の詳細: [COMPARISON-LIMITS.md](../../COMPARISON-LIMITS.md)。機械可読な全入力・基準/変更後画面・金額・差・理由: [public-results.json](public-results.json)、[results.csv](results.csv)。独立検証の原データ・SKU・単価・計算式: [alternative-cases.json](alternative-cases.json)。', '',
 '## 実装・公開の確認', '',
 '実装時の単体143件、ローカルブラウザ30件と追加のRegion混在1件が成功。公開検査修復後の単体147件も成功。統合候補CI、Price DB semantic/Golden/drift検証、Pagesの結果はdeployment.jsonへ記録。公開版のPlan横断課金、Region混在、730時間制約の追加E2Eはpublic-e2e-results.jsonとtraceを参照。', '',
 '更新前の公開GUIではio2 256,000 IOPSの公式との差が7,956.48 USD、S3 60,000 GBの差が8.80 USD。画面・入力・比較額はpre-deployment-results.jsonとして保存し、更新後の件数には混ぜていない。旧公開候補のdrift検査は参照元コンポーネントを除外してMISSING_USAGEとなったため、PR #65で検査処理を修復した。失敗候補の証跡はfailed-price-publication/へ保存し、成功として集計していない。', '',
 '共有Coreの計算契約変更に伴い、既存workflowが66料金ソース（11コード×6Region）を再materializeし、全サービスの意味検証を選択した。局所修正のscopeを変更して回避していない。', ''
];
await writeFile(`${root}/REPORT.md`,lines.join('\n'));
console.log(JSON.stringify(summary,null,2));
