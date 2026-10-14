import json,pathlib,collections,sys
r=pathlib.Path('/home/ubnadmin/AWSPricingCalculator_forTAE/tests/aws-calculator-parity/results/'+pathlib.Path('/tmp/aws-parity-current').read_text())
def read(f):return json.loads((r/f).read_text())
a=read('consolidated-cases.json');rows=read('field-correspondence.json');plan=read('cases.json');errors=[]
ids=[c['caseId'] for c in a];active=set(ids)
if len(ids)!=len(active):errors.append('Duplicate case IDs')
if {c['caseId'] for c in plan}!=active:errors.append('Plan/record IDs disagree')
rowids={x['rowId'] for x in rows}
for c in a:
 p=r/'cases'/c['serviceId']/(c['caseId']+'.json')
 if not p.exists():errors.append('Missing individual case: '+c['caseId']);continue
 if json.loads(p.read_text())!=c:errors.append('Individual/aggregate mismatch: '+c['caseId'])
 if c['correspondenceRowId'] not in rowids:errors.append('Missing correspondence row: '+c['caseId'])
 if c['inputVerdict']=='FAIL' or c['pricingVerdict']=='FAIL':
  d=r/'failures'/c['caseId']
  if not (d/'fix-instructions.md').exists():errors.append('Missing fix instructions: '+c['caseId'])
  if not (d/'comparison.json').exists() or json.loads((d/'comparison.json').read_text())!=c:errors.append('FAIL comparison mismatch: '+c['caseId'])
 for side in ['localBefore','localAfter','awsBefore','awsAfter','setupLocal','setupAws']:
  ev=c.get(side)
  if ev and ev.get('screen') and not (r/ev['screen']).exists():errors.append('Missing screenshot: '+ev['screen'])
 for ev in (c.get('evidence') or {}).values():
  if ev and ev.get('file') and not (r/ev['file']).exists():errors.append('Missing observation: '+ev['file'])
 if c['pricingVerdict']=='PASS':
  if any(c.get(k) is None or c[k].get('monthlyUsd') is None for k in ['localBefore','localAfter','awsBefore','awsAfter']):errors.append('PASS missing monetary evidence: '+c['caseId'])
  if not c.get('componentComparisonComplete'):errors.append('PASS without confirmed breakdown: '+c['caseId'])
for row in rows:
 if not row['caseIds']:errors.append('Row lacks case: '+row['rowId'])
 for cid in row['caseIds']:
  if cid not in active:errors.append('Row references nonexistent case: '+cid)
summary=read('summary.json');counts=dict(collections.Counter(c['pricingVerdict'] for c in a))
if counts!=summary['counts']:errors.append('Summary counts disagree')
if summary['failures']!=sum(c['inputVerdict']=='FAIL' or c['pricingVerdict']=='FAIL' for c in a):errors.append('Failure counts disagree')
result={'checkedAt':__import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),'cases':len(a),'correspondenceRows':len(rows),'checks':['Stable unique IDs','Plan/individual/aggregate consistency','Every row and case linked','FAIL records and individual instructions consistent','Referenced screenshots/observations present','Every PASS has four measured GUI amounts and confirmed component comparisons','Summary counts derived from case records'],'errors':errors,'status':'PASS' if not errors else 'FAIL','note':'Artifact integrity PASS does not certify full parity scope completion.'}
(r/'artifact-validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'status':result['status'],'cases':len(a),'errors':errors[:10],'errorCount':len(errors)},ensure_ascii=False));sys.exit(1 if errors else 0)
