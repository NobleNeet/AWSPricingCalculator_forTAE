import json,pathlib,collections
r=pathlib.Path('/home/ubnadmin/AWSPricingCalculator_forTAE/tests/aws-calculator-parity/results/'+pathlib.Path('/tmp/aws-parity-current').read_text());a=json.loads((r/'measured-cases.json').read_text())
def index(fields,side):
 result={};n=collections.Counter()
 for f in fields:
  stem=f.get('id') if side=='local' and f.get('id') else f.get('label','')+'|'+f.get('type','');i=n[stem];n[stem]+=1;result[stem+'|'+str(i)]=f
 return result
for c in a:
 c['invalidGuiInputs']=[{'snapshot':slot,**field} for slot in ['localBefore','awsBefore','localAfter','awsAfter'] for field in (c.get(slot) or {}).get('inputs',[]) if field.get('invalid')=='true']
 if c['invalidGuiInputs']:
  c.setdefault('rawInvalidInputComparisonVerdict',c['pricingVerdict']);c['pricingVerdict']='NOT_COMPARABLE';c['inputVerdict']='INCOMPLETE';c['reason']='Captured GUI includes aria-invalid=true input(s). Amounts remain raw evidence; valid independent estimates are required before pricing comparison.'
 # Legacy runner attempted a redundant reset only after recording all four GUI measurements.
 if c.get('pricingVerdict')=='BLOCKED' and c.get('deltaDifferenceUsd') is not None and c.get('reason','').startswith(('AWS_GUI_INPUT_NOT_APPLIED: Nodes desired 1 rendered 2','AWS_GUI_INPUT_NOT_APPLIED: Quantity desired 1 rendered 2')) and all(c.get(k,{}).get('monthlyUsd') is not None for k in ['localBefore','awsBefore','localAfter','awsAfter']):
  from decimal import Decimal
  c['postMeasurementCleanupWarning']=c['reason'];c['measurementRecoveredFromSavedEvidence']=True
  c['totalComparisonVerdict']='PASS' if all(abs(Decimal(c[k]))<=Decimal('.01') for k in ['beforeDifferenceUsd','afterDifferenceUsd','deltaDifferenceUsd']) else 'FAIL'
  c['pricingVerdict']=c['totalComparisonVerdict'] if c.get('componentComparisonComplete') else 'INCOMPLETE'
  c['reason']='All four GUI measurements completed before redundant reset failed. Saved totals retained; component verification remains a separate gate.'
 changes={} 
 for side in ['local','aws']:
  before=c.get(side+'Before');after=c.get(side+'After')
  if not before or not after:continue
  b=index(before['inputs'],side);e=index(after['inputs'],side);changes[side]=[{'key':k,'label':v.get('label'),'id':v.get('id'),'before':b[k]['value'] if k in b else None,'after':v['value'],'added':k not in b} for k,v in e.items() if k not in b or b[k]['value']!=v['value']]+[{'key':k,'label':v.get('label'),'id':v.get('id'),'before':v['value'],'after':None,'removed':True} for k,v in b.items() if k not in e]
 c['observedInputChanges']=changes
 if c.get('awsBefore') and c.get('awsAfter') and not any(part in c.get('parameter','') for part in ['instanceType','nodeType']):
  import re
  selected_before=re.findall(r'Chosen instance: ([^\s\u2003|]+)',c['awsBefore'].get('text',''))
  selected_after=re.findall(r'Chosen instance: ([^\s\u2003|]+)',c['awsAfter'].get('text',''))
  c['selectedInstanceConsistency']={'before':selected_before,'after':selected_after,'targetChangesInstanceType':False,'unchanged':selected_before==selected_after}
  if selected_before!=selected_after:
   c['rawInstanceResetComparisonVerdict']=c['pricingVerdict'];c['pricingVerdict']='NOT_COMPARABLE';c['inputVerdict']='INCOMPLETE';c['reason']='Official GUI selected instance changed while the target parameter was not instance type. Preserve raw quoted amounts and rerun with a common exact instance before assigning an equal-configuration pricing verdict.'

 # Cached parent selector changed between EventBridge independent field cases: retain total-only result, require a fresh before snapshot.
 bad=[x for x in changes.get('aws',[]) if x['label']=='What type of events were ingested?' and not c['parameter'].startswith('input-profile--crossAccount')]
 if bad:
  c['previousTotalVerdict']=c['pricingVerdict'];c['pricingVerdict']='INCOMPLETE';c['reason']='Cached AWS baseline parent selector differs from captured after state. Totals/deltas retained, but a fresh baseline snapshot is required for unchanged-other-input verification.'
 (r/'cases'/c['serviceId']/(c['caseId']+'.json')).write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
(r/'measured-cases.json').write_text(json.dumps(a,ensure_ascii=False,separators=(',',':'))+'\n')
