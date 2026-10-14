import json,re,pathlib,decimal
D=decimal.Decimal
root=pathlib.Path('/home/ubnadmin/AWSPricingCalculator_forTAE/tests/aws-calculator-parity/results/'+pathlib.Path('/tmp/aws-parity-current').read_text())
a=json.loads((root/'measured-cases.json').read_text())
# Match displayed cost lines only. Never calculate expected prices from price APIs or definitions.
maps={
'codebuild':[(r'AWS CodeBuild cost \(monthly\): ([\d,.]+) USD',['build-minutes'])],
'systems-manager':[(r'Just-in-time node access cost \(monthly\): ([\d,.]+) USD',['jit-node-hours']),(r'Incident Manager cost \(monthly\): ([\d,.]+) USD',['incident-response-plans'])],
'athena':[(r'SQL queries with per query cost \(monthly\): ([\d,.]+) USD',['sql-scanned','sql-scanned-day','sql-scanned-week']),(r'SQL queries with capacity based cost \(monthly\): ([\d,.]+) USD',['capacity']),(r'Total spark execution cost \(monthly\): ([\d,.]+) USD',['spark','spark-day','spark-week'])],
's3':[(r'Total tier cost = ([\d,.]+) USD \(S3 Standard storage cost\)',['storage']),(r'= ([\d,.]+) USD \(S3 Standard PUT requests cost\)',['write-requests']),(r'= ([\d,.]+) USD \(S3 Standard GET requests cost\)',['read-requests'])],
'kms':[(r'= ([\d,.]+) USD for CMKs',['key-versions']),(r'= ([\d,.]+) USD for symmetric requests',['requests-standard']),(r'= ([\d,.]+) USD for asymmetric requests\n',['requests-asymmetric']),(r'= ([\d,.]+) USD for asymmetric RSA requests',['requests-asymmetric-rsa2048']),(r'= ([\d,.]+) USD for generated ECC Key Pairs',['requests-generate-data-key-pair-ecc']),(r'= ([\d,.]+) USD for generated RSA Key Pairs',['requests-generate-data-key-pair-rsa'])],
'amplify':[(r'= ([\d,.]+) USD \(Build minutes cost\)',['build-standard','build-large','build-xlarge']),(r'= ([\d,.]+) USD \(Data stored cost\)',['data-storage']),(r'= ([\d,.]+) USD \(Data served cost\)',['data-transfer-out']),(r'= ([\d,.]+) USD \(total monthly SSR request cost\)',['ssr-request-count']),(r'= ([\d,.]+) USD \(total monthly SSR compmpute duration cost\)',['ssr-request-duration'])],
'fargate':[(r'= ([\d,.]+) USD for vCPU hours',['linux-x86-vcpu','linux-arm-vcpu','windows-vcpu']),(r'= ([\d,.]+) USD for GB hours',['linux-x86-memory','linux-arm-memory','windows-memory']),(r'= ([\d,.]+) USD for ephemeral storage GB hours',['linux-ephemeral-storage','windows-ephemeral-storage'])],
'eventbridge':[(r'Total events cost \(monthly\): ([\d,.]+) USD',['opt-in-data-events-ingestion','custom-events-ingestion','partner-events-ingestion']),(r'Total delivery cost \(monthly\): ([\d,.]+) USD',['cross-account-management-delivery','cross-account-custom-delivery','cross-account-partner-delivery']),(r'Total API destination cost \(monthly\): ([\d,.]+) USD',['api-destinations']),(r'Total event archive and replay cost \(monthly\): ([\d,.]+) USD',['replayed-events','archive-processing','archive-storage']),(r'Total EventBridge Pipes cost \(monthly\): ([\d,.]+) USD',['pipes']),(r'Total schema discovery cost \(monthly\): ([\d,.]+) USD',['schema-discovery']),(r'Total EventBridge scheduler cost \(monthly\): ([\d,.]+) USD',['scheduler'])]}

maps.update({
'ebs':[(r'EBS Storage Cost: ([\d,.]+) USD',['storage']),(r'EBS IOPS Cost: ([\d,.]+) USD',['iops']),(r'EBS Throughput Cost: ([\d,.]+) USD',['throughput'])],
'rds':[(r'Amazon RDS PostgreSQL instances cost \(monthly\): ([\d,.]+) USD',['instance']),(r'Storage pricing \(monthly\): ([\d,.]+) USD',['storage'])],
'rds-oracle':[(r'RDS for Oracle cost \(monthly\): ([\d,.]+) USD',['instance']),(r'Storage pricing \(monthly\): ([\d,.]+) USD',['storage-gp3']),(r'Monthly Cost for RDS Oracle Database Insights \(monthly\): ([\d,.]+) USD',['database-insights']),(r'Additional backup storage cost \(monthly\): ([\d,.]+) USD',['backup-storage'])],
'redshift':[(r'Redshift instance cost \(monthly\): ([\d,.]+) USD',['node-compute']),(r'Additional backup storage cost \(monthly\): ([\d,.]+) USD',['backup-tiered','backup-rg','backup-serverless']),(r'Redshift Spectrum cost \(monthly\): ([\d,.]+) USD',['spectrum']),(r'Redshift Managed Storage cost \(monthly\): ([\d,.]+) USD',['rms-provisioned','rms-serverless']),(r'Data transfer cost \(monthly\): ([\d,.]+) USD',['transfer'])],
'aurora-postgresql':[(r'Amazon Aurora PostgreSQL-Compatible DB instances cost \(monthly\): ([\d,.]+) USD',['instance','instance-io-optimized']),(r'= ([\d,.]+) USD \(Database Storage Cost\)',['storage','storage-io-optimized']),(r'= ([\d,.]+) USD \(IOs Rate Cost\)',['io-requests']),(r'Additional backup storage cost \(monthly\): ([\d,.]+) USD',['backup-storage']),(r'Snapshot Export cost \(monthly\): ([\d,.]+) USD',['snapshot-export'])],
'glue':[(r'ETL jobs cost \(monthly\): ([\d,.]+) USD',['etl-standard']),(r'Interactive sessions cost \(monthly\): ([\d,.]+) USD',['interactive-standard']),(r'Development endpoints cost \(monthly\): ([\d,.]+) USD',['development-endpoints'])],
'elastic-load-balancing':[(r'Application Load Balancer fixed hourly charges \(monthly\): ([\d,.]+) USD',['alb']),(r'Application Load Balancer LCU usage charges \(monthly\): ([\d,.]+) USD',['alb-lcu']),(r'Total hourly charges for all Network Load Balancers \(monthly\): ([\d,.]+) USD',['nlb']),(r'Total LCU charges for all Network Load Balancers \(monthly\): ([\d,.]+) USD',['nlb-tcp','nlb-udp','nlb-tls']),(r'Classic Load Balancer fixed hourly charges \(monthly\): ([\d,.]+) USD',['clb']),(r'Classic Load Balancer Data Processing charges \(monthly\): ([\d,.]+) USD',['clb-bytes'])]
})

def cost(s):
 if not s or s=='—':return None
 m=re.search(r'\$([\d,.]+)',s)
 if not m:return None
 n=D(m[1].replace(',',''));return (D(0),n) if '<' in s else (n,n)
for c in a:
 if not c.get('localBefore') or not c.get('awsBefore') or not c.get('localAfter') or not c.get('awsAfter'):continue
 result=[];complete=True
 for when in ['Before','After']:
  l=c['local'+when];o=c['aws'+when];parts=l.get('components') or [];text=o['text'];groups=maps.get(c['serviceId'],[])
  if c['serviceId']=='lambda':
   groups=[(r'Monthly compute charges: ([\d,.]+) USD',['duration']), (r'Monthly request charges: ([\d,.]+) USD',['requests']), (r'Monthly ephemeral storage charges: ([\d,.]+) USD',['ephemeral-storage-x86','ephemeral-storage-arm']), (r'Provisioned Concurrency charges: ([\d,.]+) USD',['provisioned-capacity-x86','provisioned-capacity-arm']), (r'Monthly compute charges: ([\d,.]+) USD',['provisioned-duration-x86','provisioned-duration-arm'],1),(r'Monthly request charges: ([\d,.]+) USD',['provisioned-requests'],1)]
  if c['serviceId']=='elastic-load-balancing':
   for component,label in [('alb-lcu','Application Load Balancer LCU'),('nlb-tcp','Network Load Balancer TCP NLCU'),('nlb-udp','Network Load Balancer UDP NLCU'),('nlb-tls','Network Load Balancer TLS NLCU'),('clb-bytes','Classic Load Balancer 処理データ')]:
    m=re.search(re.escape(label)+r'\n(< \$[\d,.]+|\$[\d,.]+)',l['text'])
    if m:parts=parts+[{'id':component,'title':label,'monthly':m.group(1),'source':'Exact rendered label and following price line in GUI body text'}]
  matched=set()
  for g in groups:
   regex,ids=g[:2];matches=list(re.finditer(regex,text));nth=g[2] if len(g)>2 else 0
   if nth>=len(matches) and all(cost(x.get('monthly')) is None or cost(x.get('monthly'))[1]==0 for x in parts if x['id'] in ids):continue
   if nth>=len(matches):complete=False;result.append({'when':when,'localComponentIds':ids,'verdict':'INCOMPLETE','reason':'Displayed official breakdown cost not located'});continue
   match=matches[nth];n=D(match.group(1).replace(',',''));ps=[x for x in parts if x['id'] in ids and cost(x.get('monthly')) is not None];low=sum((cost(x['monthly'])[0] for x in ps),D(0));high=sum((cost(x['monthly'])[1] for x in ps),D(0));matched.update(x['id'] for x in ps)
   # EventBridge Schema Discovery includes ingestion; compare combined supported groups as specified by SPEC 6.4.
   if c['serviceId']=='eventbridge' and ids==['schema-discovery']:
    ingestion=re.search(r'Total events cost \(monthly\): ([\d,.]+) USD',text)
    if not ingestion:complete=False;continue
    n+=D(ingestion.group(1).replace(',',''));extra=[x for x in parts if x['id'] in ['opt-in-data-events-ingestion','custom-events-ingestion','partner-events-ingestion']];low+=sum((cost(x['monthly'])[0] for x in extra),D(0));high+=sum((cost(x['monthly'])[1] for x in extra),D(0));result=[x for x in result if not (x['when']==when and x['localComponentIds']==['opt-in-data-events-ingestion','custom-events-ingestion','partner-events-ingestion'])];ids=ids+[x['id'] for x in extra]
   diff=max(low-n,n-high,D(0));result.append({'when':when,'localComponentIds':ids,'localDisplayedCosts':[x['monthly'] for x in ps],'localDisplayIntervalUsd':[str(low),str(high)],'officialDisplayedLine':match.group(0),'officialDisplayUsd':str(n),'distanceUsd':str(diff),'verdict':'PASS' if diff<=D('.01') else 'FAIL','precision':'Local < $0.01 is retained as an interval; official rounded display precision and $0.01 tolerance retained.'})
  unmatched=[x for x in parts if cost(x.get('monthly')) is not None and x['id'] not in matched and cost(x['monthly'])[1]>0]
  if unmatched:complete=False;result.append({'when':when,'verdict':'INCOMPLETE','unmatchedLocalComponents':unmatched})
  if not groups:complete=False
 c['componentComparisons']=result;c['componentComparisonComplete']=complete
 c['totalComparisonVerdict']=c.get('totalComparisonVerdict',c['pricingVerdict'])
 if c['pricingVerdict']=='PASS' and (not complete or any(x['verdict']=='FAIL' for x in result)):
  c['pricingVerdict']='INCOMPLETE';c['reason']='Totals and deltas within tolerance; component comparison needs confirmation. No complete pricing PASS claimed.'
 elif c.get('totalComparisonVerdict')=='PASS' and complete and all(x['verdict']=='PASS' for x in result):c['pricingVerdict']='PASS'
 c['equalityKind']='EXACT_DISPLAY' if all(D(c.get(k,'0'))==0 for k in ['beforeDifferenceUsd','afterDifferenceUsd','deltaDifferenceUsd']) else 'ROUNDING_TOLERANCE'
 c['directionComparison']={'local':'increase' if D(c['localDeltaUsd'])>0 else 'decrease' if D(c['localDeltaUsd'])<0 else 'unchanged','official':'increase' if D(c['awsDeltaUsd'])>0 else 'decrease' if D(c['awsDeltaUsd'])<0 else 'unchanged'}
 (root/'cases'/c['serviceId']/(c['caseId']+'.json')).write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n')
(root/'measured-cases.json').write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n')
