import pathlib,json,os,hashlib,datetime,subprocess
r=pathlib.Path('/home/ubnadmin/AWSPricingCalculator_forTAE/tests/aws-calculator-parity/results/'+pathlib.Path('/tmp/aws-parity-current').read_text())
if any(subprocess.run(['pgrep','-f',pattern],stdout=subprocess.DEVNULL).returncode==0 for pattern in ['^node /tmp/parity-price-sharded.mjs','^bash /tmp/parity-group-[ab].sh']):raise SystemExit('Shard writer/queue still running; no merge performed')
plan=json.load(open(r/'shard-execution-plan.json'));master=json.load(open(r/'measured-cases.json'));index={c['caseId']:c for c in master};changed=[];copied=[]
for group in plan['groups']:
 shard=pathlib.Path(group['root']);records=json.load(open(shard/'measured-cases.json'))
 for c in records:
  if c['serviceId'] not in group['services']:raise RuntimeError('Cross-owned service in shard')
  if c['startedAt']==group['seedCaseIds'].get(c['caseId']):continue
  old=index.get(c['caseId'])
  if old and old['startedAt']!=group['seedCaseIds'].get(c['caseId']):raise RuntimeError('Canonical case changed after seeding: '+c['caseId'])
  if c.get('executionState')!='FINISHED':raise RuntimeError('Unfinished worker case: '+c['caseId'])
  index[c['caseId']]=c;changed.append({'group':group['group'],'caseId':c['caseId'],'startedAt':c['startedAt']})
 for folder in ['screenshots','operations','observations','attempts','runners']:
  for p in (shard/folder).rglob('*') if (shard/folder).exists() else []:
   if not p.is_file():continue
   rel=p.relative_to(shard);dest=r/rel;dest.parent.mkdir(parents=True,exist_ok=True)
   if dest.exists():
    if dest.read_bytes()!=p.read_bytes():raise RuntimeError('Evidence path collision '+str(rel))
   else:
    os.link(p,dest);copied.append(str(rel))
# Sources and canonical records preserved; field/case processors are invoked only after this merge.
for item in changed:
 c=index[item['caseId']];p=r/'cases'/c['serviceId']/(c['caseId']+'.json');p.parent.mkdir(parents=True,exist_ok=True);tmp=p.with_suffix('.merge.json');tmp.write_text(json.dumps(c,ensure_ascii=False,separators=(',',':'))+'\n');os.replace(tmp,p)
p=r/'measured-cases.json';tmp=p.with_suffix('.merge.json');tmp.write_text(json.dumps(list(index.values()),ensure_ascii=False,separators=(',',':'))+'\n');os.replace(tmp,p)
log={'mergedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'changedCases':changed,'copiedEvidence':copied,'method':'Service ownership, seed timestamps, completed states, and immutable evidence collisions checked before canonical update; same-device hardlinks preserve image/source bytes without duplicate storage.'};(r/'shard-merge-log.json').write_text(json.dumps(log,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'changedCases':len(changed),'copiedEvidence':len(copied),'canonicalCases':len(index)}))
