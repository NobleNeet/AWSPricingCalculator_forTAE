import json,pathlib,collections
r=pathlib.Path('/home/ubnadmin/AWSPricingCalculator_forTAE/tests/aws-calculator-parity/results/'+pathlib.Path('/tmp/aws-parity-current').read_text());a=json.loads((r/'measured-cases.json').read_text())
def index(fields,side):
 result={};n=collections.Counter()
 for f in fields:
  stem=f.get('id') if side=='local' and f.get('id') else f.get('label','')+'|'+f.get('type','');i=n[stem];n[stem]+=1;result[stem+'|'+str(i)]=f
 return result
for c in a:
 changes={}
 for side in ['local','aws']:
  before=c.get(side+'Before');after=c.get(side+'After')
  if not before or not after:continue
  b=index(before['inputs'],side);e=index(after['inputs'],side);changes[side]=[{'key':k,'label':v.get('label'),'id':v.get('id'),'before':b[k]['value'] if k in b else None,'after':v['value'],'added':k not in b} for k,v in e.items() if k not in b or b[k]['value']!=v['value']]
 c['observedInputChanges']=changes
 # Cached parent selector changed between EventBridge independent field cases: retain total-only result, require a fresh before snapshot.
 bad=[x for x in changes.get('aws',[]) if x['label']=='What type of events were ingested?' and not c['parameter'].startswith('input-profile--crossAccount')]
 if bad:
  c['previousTotalVerdict']=c['pricingVerdict'];c['pricingVerdict']='INCOMPLETE';c['reason']='Cached AWS baseline parent selector differs from captured after state. Totals/deltas retained, but a fresh baseline snapshot is required for unchanged-other-input verification.'
 (r/'cases'/c['serviceId']/(c['caseId']+'.json')).write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
(r/'measured-cases.json').write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n')
