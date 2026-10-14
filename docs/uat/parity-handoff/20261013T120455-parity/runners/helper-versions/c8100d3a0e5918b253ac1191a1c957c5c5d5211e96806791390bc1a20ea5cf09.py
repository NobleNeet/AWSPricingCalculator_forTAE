import pathlib,json,re,hashlib,datetime,collections,csv,os
ROOT=pathlib.Path('/home/ubnadmin/AWSPricingCalculator_forTAE')
runid=pathlib.Path('/tmp/aws-parity-current').read_text(); R=ROOT/'tests/aws-calculator-parity/results'/runid
now=datetime.datetime.now(datetime.timezone.utc).isoformat(); regions=['ap-northeast-1','ap-northeast-3','us-east-1','us-east-2','us-west-1','us-west-2']
def read(n,default=[]):
 p=R/n;return json.loads(p.read_text()) if p.exists() else default
def write(n,x):
 p=R/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n')
def sid(s):return re.sub('[^a-zA-Z0-9]+','-',s).strip('-')[:65]+'-'+hashlib.sha256(s.encode()).hexdigest()[:10]
services=read('service-list.json'); L=read('local-field-inventory.json'); A=read('aws-field-inventory.json'); measured=read('measured-cases.json')
for pending in (R/'cases').glob('*/*.json'):
 try:
  cp=json.loads(pending.read_text())
  if cp.get('executionState')=='RUNNING' and cp.get('plannedInputs') and not any(x['caseId']==cp['caseId'] for x in measured):
   cp['pricingVerdict']='INCOMPLETE';cp['reason']='GUI case checkpoint is RUNNING or was interrupted before measurement completion; no amount inferred.';measured.append(cp)
 except (ValueError,KeyError):pass
registry={x['serviceId']:x for x in read('service-url-registry.json')}; write('service-url-registry.json',list(registry.values()))
local={};official={};profiles={}
# Normalize actual public GUI selections for derived indexes, retaining requested conditions.
# Raw independent observation files and their original condition records are not rewritten.
for observation in L:
 fields=observation['fields'];condition=dict(observation['condition'])
 selected_profile=next((f for f in fields if f.get('domId')=='drawer-profile'),None)
 if selected_profile is not None:
  original=condition.get('profile');value=selected_profile.get('value');label=next((o.get('label') for o in selected_profile.get('options') or [] if o.get('value')==value),value)
  condition['requestedProfile']=original;condition['profile']={'value':value,'label':label};condition['profileObservedFrom']='drawer-profile DOM value'
 project_region=next((f.get('value') for f in fields if f.get('domId')=='project-region'),None)
 row_region=next((f.get('value') for f in fields if f.get('domId')=='drawer-region'),None)
 effective_region=row_region if row_region and row_region!='inherit' else project_region
 if effective_region:
  condition['requestedRegion']=condition.get('region');condition['region']=effective_region;condition['regionObservedFrom']='drawer-region/project-region DOM values'
 observation['condition']=condition
for o in L:
 service=o['serviceId'];profile=o['condition'].get('profile',{}).get('value','unknown');profiles.setdefault(service,set()).add(profile)
 for f in o['fields']:
  key=f['domId'] or ('toggle.'+str(f.get('toggle')) if f.get('toggle') is not None else 'gui.'+sid(f['label'].split('\n')[0]+'|'+f['type']))
  # Region and profile selectors remain part of the independently observed union.
  if key=='scheduler-free-remaining' and service!='eventbridge':continue
  ident=service+':'+key
  if ident not in local:local[ident]={'fieldId':ident,'serviceId':service,'logicalId':key,'label':f['label'].split('\n')[0],'type':f['type'],'observations':[],'profiles':set(),'regions':set(),'options':{},'defaults':[]}
  v=local[ident];v['profiles'].add(profile);v['regions'].add(o['condition'].get('region','unknown'));v['observations'].append({'file':o['observation'],'screen':o['screen'],'condition':o['condition'],'visible':f['visible'],'value':f['value'],'domId':f['domId']})
  if o['condition']['variant']=='default':v['defaults'].append({'profile':profile,'value':f['value'],'min':f['min'],'max':f['max'],'step':f['step'],'disabled':f['disabled']})
  for option in f.get('options') or []:v['options'][option['value']]=option
region_names={'Asia Pacific (Tokyo)':'ap-northeast-1','Asia Pacific (Osaka)':'ap-northeast-3','US East (N. Virginia)':'us-east-1','US East (Ohio)':'us-east-2','US West (N. California)':'us-west-1','US West (Oregon)':'us-west-2'}
def normalize_observed_label(f):
 raw=f['label'].strip();label=' '.join(x.strip() for x in raw.split('|') if x.strip())
 if f.get('type')=='button':
  value=str(f.get('value','')).strip()
  if value and label!=value and label.endswith(value):label=label[:-len(value)].strip()
 return label
for o in A:
 selected_region=next((f.get('value') for f in o['fields'] if f['label'].startswith('Choose a Region')),None)
 o['condition']={**o['condition'],'requestedRegion':o['condition'].get('requestedRegion',o['condition'].get('region')),'region':region_names.get(selected_region),'regionDisplay':selected_region}
 service=o['serviceId']; occurrence=collections.Counter();prior=''
 native_compute_model=next((f.get('value') for f in o['fields'] if 'AWS CodeBuild Compute Type' in f.get('label','')),None) if service=='codebuild' else None
 for f in o['fields']:
  label=normalize_observed_label(f);typ=f['type']
  if 'awsccc' in f['domId'] or label=='Description - optional' or not label and typ not in ['text','search']:continue
  if label.startswith('Choose a location'):continue
  # Unit controls inherit the closest preceding usage/selector name; anonymous instance controls retain their semantic combobox slot.
  stableLabel=label or 'Instance selection combobox'
  if stableLabel in ['Unit','Data amount']:stableLabel=prior+' / '+stableLabel
  else:prior=stableLabel
  ordinal=occurrence[(stableLabel,typ)];occurrence[(stableLabel,typ)]+=1
  model_facet=native_compute_model if native_compute_model not in [None,'On-Demand EC2'] and label!='AWS CodeBuild Compute Type' and not label.startswith('Choose a Region') else None
  ident=service+':aws:'+sid(stableLabel+'|'+typ+'|'+str(ordinal)+('|compute-model:'+model_facet if model_facet else ''))
  if ident not in official:official[ident]={'fieldId':ident,'serviceId':service,'label':label,'stableLabel':stableLabel,'type':typ,'ordinal':ordinal,'observations':[],'defaults':[],'options':None,'candidateInventoryComplete':False,'nativeComputeModelFacet':model_facet}
  v=official[ident];v.setdefault('observedLabelVariants',[]);v['observedLabelVariants']=sorted(set(v['observedLabelVariants']+[f['label']]));v['observations'].append({'file':o['observation'],'screen':o['screen'],'condition':o['condition'],'value':f['value'],'domId':f['domId'],'section':f.get('section'),'context':f.get('context')})
  if o['condition']['variant']=='default':v['defaults'].append({'value':f['value'],'region':o['condition'].get('region')})
# Retain independently rendered candidate menus, keyed by live DOM IDs observed in each service.
for menuFile in (R/'observations').glob('aws-*-*.json'):
 try:
  menu=json.loads(menuFile.read_text());mf=menu.get('field',{});opts=menu.get('options')
  if not mf.get('id') or opts is None:continue
  for v in official.values():
   if v['serviceId']!=menu.get('serviceId') or not any(o.get('domId')==mf['id'] for o in v['observations']):continue
   v.setdefault('candidateMenuObservations',[]).append({'file':str(menuFile.relative_to(R)),'condition':menu.get('condition'),'options':opts,'completeness':menu.get('candidateCompleteness','Rendered options retained; virtualized and dependent lists not certified complete')})
   existing=v.get('options') or [];seen={x['label'] for x in existing}
   v['options']=existing+[x for x in opts if x.get('label') not in seen]
 except (ValueError,TypeError):continue
# Preserve all raw independent observations; normalized field indexes are supplementary, never overwrite their evidence.
for v in local.values():v['profiles']=sorted(v['profiles']);v['regions']=sorted(v['regions']);v['options']=list(v['options'].values())
write('local-field-index.json',list(local.values()));write('official-field-index.json',list(official.values()));write('official-field-inventory.json',{'complete':False,'fields':list(official.values()),'rawObservationInventory':'aws-field-inventory.json','reason':'Conditional and candidate inventory remains incomplete; stable IDs reflect observed GUI fields only.'})
rows=[]; assignedO=set(); assignedL=set(); allcases=[]
def labels_for(raw):
 if raw=='SKIP':return []
 if raw.startswith('COMBO:'):return ['Instance selection combobox']
 if raw.startswith('NLBBYTES:'):return ['Processed bytes per NLB for '+raw.split(':',1)[1]+' Value']
 if raw.startswith('CHECK:'):return [raw.split(':',1)[1]]
 if raw.startswith('MULTI:'):return raw[6:].split('|')
 if ':' in raw and raw.split(':')[0] in ['PCT','STORAGEHOURS','EBSIOPS','EBSTHROUGHPUT','SELECT','MONTHLYTOHOUR','MILLION','REGIONALBILLED','VOLUMECOUNT','VOLUMEDURATION']:return [raw.split(':',1)[1]]
 return [raw]
# Associations used by live GUI cases, including operation failures. They establish candidate equivalence; metadata completeness remains separately classified.
associations={}
for c in measured:
 for x in c.get('plannedInputs',{}).get('baseline',[]):
  k=c['serviceId']+':'+x['local'];associations.setdefault(k,{'serviceId':c['serviceId'],'officialLabels':x.get('officialAssociationLabels') or labels_for(x['official']),'transform':x['official'],'officialOccurrence':x.get('officialOccurrence',1 if x['local']=='input-profile--provisionedMemoryMb' else 0)})
# Add explicit multi-to-one usage associations implemented by the live GUI synchronization procedures.
# These are quantity transforms only; they do not generate expected prices or certify metadata PASS.
for c in measured:
 variant=c.get('inputConversions',{}).get('variant','')
 if c['serviceId']=='glue':
  pairs={'etl-standard':'Duration for which Apache Spark ETL job  runs Value','interactive-standard':'Duration for provisioned interactive sessions Value','etl-ray':'Duration for which Ray ETL job runs Value','interactive-ray':'Duration for provisioned Ray interactive sessions Value','etl-memory-gen2':'Duration for which Apache Spark job on memory-optimized workers runs Value','etl-memory-legacy':'Duration for which Apache Spark job on memory-optimized workers runs Value','catalog-optimization':'Duration for optimization (Compaction, Retention, Orphan File Deletion) Value','catalog-statistics':'Duration for statistics collection Value','development-endpoints':'Duration for provisioned development endpoint Value','databrew-jobs':'Duration of DataBrew job Value','crawlers':'Duration for each crawler Value'}
  for x in c.get('plannedInputs',{}).get('baseline',[]):
   k='glue:'+x['local']
   for component,label in pairs.items():
    if x['local'] in ['input-component-'+component+'-runsPerMonth','input-component-'+component+'-averageDurationMinutes'] and k in associations:
     associations[k]['officialLabels']=[label];associations[k]['transform']='Explicit dependentSyncProcedure retained in measured case: monthly runs times per-run billable duration, in the unit rendered by the official duration control.'
 if c['serviceId']=='lambda' and variant.startswith('lambda-streaming'):
  k='lambda:input-profile--requestsPerMonth'
  if k in associations:associations[k]['officialLabels']=list(set(associations[k]['officialLabels']+['Number of Invokes Value']));associations[k]['transform']='Same monthly invocation count enters both regular request count and response-streaming invocation count; see saved GUI sync procedure.'
for k,a in associations.items():
 found=[]
 for v in official.values():
  if v.get('nativeComputeModelFacet'):continue
  if v['serviceId']==a['serviceId'] and v['ordinal']==a.get('officialOccurrence',0) and any(v['label']==n or v['stableLabel']==n for n in a['officialLabels']):found.append(v['fieldId'])
 loc=[k] if k in local else []
 # aliases for Athena month/week variants are separate GUI field IDs with documented usage-period conversion.
 if a['serviceId']=='athena' and ('sql-scanned-day-' in k or 'spark-day-' in k):
  stem=k.replace('-day-','-');week=k.replace('-day-','-week-');loc+= [n for n in [stem,week] if n in local]
 related=[c['caseId'] for c in measured if c['serviceId']+':'+c['parameter']==k]
 rowid=k
 rows.append({'rowId':rowid,'serviceId':a['serviceId'],'classification':'UNCONFIRMED','candidateClassification':'MATCHED' if found and loc else 'UNCONFIRMED','inputVerdict':'INCOMPLETE','officialFieldIds':found,'localFieldIds':loc,'transform':a['transform'],'caseIds':related,'reason':'GUI input and unit equivalence assessed for measured cases only. Full defaults, candidates, ranges and conditional-parent combinations are not yet exhausted; case-level pricing PASS does not certify full input metadata.'})
 assignedO.update(found);assignedL.update(loc)
def missing(v):
 service=v['serviceId'];label=v['label'];typ=v['type'];cond=[o['condition'] for o in v['observations']]
 if service=='codebuild' and v.get('nativeComputeModelFacet') in ['On-Demand Lambda','Sandbox','Docker Image Server']:return True
 if service=='s3' and label in ['S3 Standard storage Value','PUT, COPY, POST, LIST requests to S3 Standard Enter amount of requests','GET, SELECT, and all other requests from S3 Standard Enter amount of requests']:return False
 if service=='s3':return typ not in ['button','radio','checkbox'] or (typ=='checkbox' and label not in ['S3 Standard']) or label.startswith('Data returned by S3 Select') or label.startswith('Data scanned by S3 Select') or 'Enter Amount' in label or label in ['Data transfer from','Data transfer to']
 if service=='systems-manager':return typ=='checkbox' and label in ['OpsCenter','AWS AppConfig','Parameter Store','On-Premises Instance Management','Distributor','Automation'] or any(c.get('feature') in ['OpsCenter','AWS AppConfig','Distributor','Automation'] for c in cond) and typ not in ['checkbox','radio','button'] or label.startswith('Standard parameters') or label.startswith('Advanced parameters') or label.startswith('Frequency of API interactions')
 if service=='lambda':return label.startswith('Time for which SnapStart') or label.startswith('Number of cold-starts') or label=='Number of requests Value' and v['ordinal']==1 or label=='Duration of each request (in ms) Enter duration in ms' and v['ordinal']==1 or label=='Amount of memory allocated Value' and v['ordinal']>=2
 if service=='rds':return 'RDS Proxy' in label or 'Database Insights' in label or 'Extended Support' in label
 if service=='aurora-postgresql':return 'RDS Proxy' in label or 'Extended Support' in label
 if service=='ebs':return 'snapshot' in label.lower() or 'SnapshotBlock' in label or 'LIST API' in label
 if service=='amplify':return 'Web Application Firewall' in label
 if service=='elastic-load-balancing':return label=='Number of Application Load Balancers on Outposts'
 if service=='ec2':return label=='Number of dedicated hosts Enter amount' or 'snapshot' in label.lower()
 if service=='glue':return 'Python Shell' in label or 'provisioned interactive session on memory-optimized' in label or 'provisioned interactive sessions on memory-optimized' in label
 return False
# Reviewed candidate-range decisions are separate from monetary measurements.
for decision in read('correspondence-decisions.json'):
 matched=[v for v in official.values() if v['serviceId']==decision['serviceId'] and decision['officialLabel'] in [v['label'],v['stableLabel']]]
 loc=decision['serviceId']+':'+decision['localLogicalId']
 for v in matched:
  row=next((x for x in rows if v['fieldId'] in x['officialFieldIds'] and loc in x['localFieldIds']),None) or next((x for x in rows if v['fieldId'] in x['officialFieldIds']),None)
  if row is None:
   row={'rowId':v['fieldId'],'serviceId':decision['serviceId'],'officialFieldIds':[v['fieldId']],'localFieldIds':[loc] if loc in local else [],'caseIds':[]};rows.append(row)
  row.update({k:val for k,val in decision.items() if k not in ['officialLabel','localLogicalId']});row['officialEvidence']=v['observations'];row['localEvidence']=local.get(loc,{}).get('observations',[]);row['observedOfficialOptions']=v.get('options');row['observedLocalOptions']=local.get(loc,{}).get('options');assignedO.add(v['fieldId']);assignedL.add(loc)
for ident,v in official.items():
 if ident in assignedO:continue
 label=v['label'];service=v['serviceId'];rowid=ident
 excluded=bool(re.search(r'Savings Plans|Spot Instances|Reserved Instances|^1 year$|^3 year$|^No upfront$|^Partial upfront$|^All upfront$',label,re.I)) or service=='ec2' and (label in ['Constant usage','Daily spike traffic','Weekly spike traffic','Monthly spike traffic','Assume percentage discount for my estimate'] or label.endswith('Workload days') or label.startswith('Enter the minimum number of instances for your workload') or label.startswith('Enter the maximum number of instances for your workload') or label.startswith('Enter the amount of') and 'running at peak' in label)
 excluded=excluded or bool(v.get('nativeComputeModelFacet') and 'Reserved' in v['nativeComputeModelFacet'])
 ismissing=missing(v) and not excluded
 classification='SPEC_EXCLUDED' if excluded else 'MISSING_LOCAL' if ismissing else 'UNCONFIRMED'
 row={'rowId':rowid,'serviceId':service,'classification':classification,'inputVerdict':'FAIL' if ismissing else 'EXCLUDED' if excluded else 'INCOMPLETE','officialFieldIds':[ident],'localFieldIds':[],'caseIds':[],'reason':'Corresponding pricing input absent from all independently observed public GUI profiles and optional states; an unitemized additional-cost field is not equivalent.' if ismissing else 'On-Demand purchase-policy or EC2 Workload exclusion.' if excluded else 'Independent GUI field observed, but semantic association/candidate/default/conditional investigation remains unfinished. It is retained in the denominator.'}
 if excluded:row['specificationEvidence']=['docs/SPEC.md §2.2','docs/SPEC.md §6.1' if service=='ec2' and (label in ['Constant usage','Daily spike traffic','Weekly spike traffic','Monthly spike traffic'] or label.endswith('Workload days') or 'your workload' in label or 'running at peak' in label) else 'docs/SERVICE_ONBOARDING.md §5']
 if ismissing:row['specificationEvidence']=['docs/uat/AWS_CALCULATOR_PARITY.md §5.1','docs/SERVICE_ONBOARDING.md §5–6'];row['localEvidence']=[o['observation'] for o in L if o['serviceId']==service and o['condition']['variant']=='default'];row['officialEvidence']=v['observations']
 rows.append(row);assignedO.add(ident)
for ident,v in local.items():
 if ident in assignedL:continue
 rows.append({'rowId':ident,'serviceId':v['serviceId'],'classification':'UNCONFIRMED','candidateClassification':'LOCAL_ONLY','inputVerdict':'INCOMPLETE','officialFieldIds':[],'localFieldIds':[ident],'caseIds':[],'reason':'Public GUI input retained independently. Official-only investigation and semantic conversion remain unfinished; do not infer LOCAL_ONLY simply from unmatched names.'});assignedL.add(ident)
# Add explicit outstanding inventory conditions; no fabricated field IDs or full denominator counts.
write('inventory-remaining.json',{'official':{'complete':False,'conditions':['Selectors inside every enabled optional feature need recursive investigation','Full instance/SKU family candidate lists and semantic representative choices are not yet confirmed','All Profile × Region parent/conditional combinations need inspection'],'observedFieldCount':len(official),'totalFieldCount':None},'local':{'complete':False,'conditions':['Profile feature checkboxes without data-toggle need on/off investigation','Large selector omissions need semantic-family justification','Mutually dependent selectors and every valid boundary need GUI measurement'],'observedFieldCount':len(local),'totalFieldCount':None}})
for c in measured:
 if c['serviceId']=='aurora-postgresql' and c.get('localBefore') and c.get('awsBefore') and any(x.get('label','').startswith('Would you be creating an RDS Proxy') and x.get('value')=='Yes' for x in c['awsBefore']['inputs']):
  c['rawUnalignedProxyComparisonVerdict']=c['pricingVerdict'];c['pricingVerdict']='NOT_COMPARABLE';c['inputVerdict']='INCOMPLETE';c['reason']='Native RDS Proxy remained enabled after the parent pricing-model switch, adding a component absent from the public estimate. Baseline inputs were not equivalent. Raw measurements retained; rerun with native Proxy disabled.'
 if c['serviceId']=='aurora-postgresql' and str(c.get('profile','')).startswith('serverless') and c.get('localBefore') and c.get('awsBefore'):
  backups=[x.get('value') for x in c['awsBefore']['inputs'] if x.get('label')=='Additional backup storage Value'];expected=next((x.get('value') for x in c['localBefore']['inputs'] if x.get('id')=='input-component-backup-storage-gbMonths'),None)
  if len(backups)>1 and str(backups[1])!=str(expected):
   c['rawUnalignedBackupComparisonVerdict']=c['pricingVerdict'];c['pricingVerdict']='NOT_COMPARABLE';c['inputVerdict']='INCOMPLETE';c['reason']='Serverless v2 rendered two identically captioned backup inputs. The second, charged backup input was not assigned the local quantity; filling the first legacy control did not affect the displayed backup cost. Raw data retained; rerun with the charged visible control and save both GUI values.'
 if c['serviceId']=='elastic-load-balancing' and c.get('parameter')=='input-profile--clbCount' and c.get('localAfter') and c.get('awsAfter'):
  from decimal import Decimal
  local_values={f.get('id'):f.get('value') for f in c['localAfter']['inputs']};native=next((f.get('value') for f in c['awsAfter']['inputs'] if f.get('label')=='Processed bytes per CLB Value'),None)
  if native is not None and local_values.get('input-profile--clbGbMonth') is not None:
   native_aggregate=Decimal(str(native))*Decimal(730)*Decimal(str(local_values['input-profile--clbCount']))
   if abs(native_aggregate-Decimal(str(local_values['input-profile--clbGbMonth'])))>Decimal('0.000001'):
    c['rawUnnormalizedClbComparisonVerdict']=c['pricingVerdict'];c['pricingVerdict']='NOT_COMPARABLE';c['inputVerdict']='INCOMPLETE';c['reason']='Public CLB monthly processed GB is aggregate; native processed GB/hour is per CLB. The original count-change case omitted division by the new CLB count. Raw amounts retained; normalized traffic must be remeasured before attributing a price defect.'
 if c['serviceId']=='rds-oracle' and c.get('parameter')=='input-profile--utilizationPct' and c.get('localBefore') and c.get('awsBefore') and any(str(f.get('value')) not in ['100','100.0'] for slot in ['localBefore','localAfter'] for f in (c.get(slot) or {}).get('inputs',[]) if f.get('id')=='input-profile--utilizationPct'):
  c['rawMonitoringClockComparisonVerdict']=c['pricingVerdict'];c['pricingVerdict']='NOT_COMPARABLE';c['inputVerdict']='INCOMPLETE';c['reason']='The public GUI explicitly prorates Database Insights by monthly instance utilization, as prescribed by PRICING_ARCHITECTURE §8.x. The native GUI explicitly limits utilization to On-Demand instance cost and continues to display 730 monitoring hours. When selected utilization differs from 100%, these monitoring quantities differ, so whole-service equal-billing assumptions do not hold. Preserve this case\'s observed monetary discrepancy; compare equivalent compute/storage components separately and investigate the monitoring-time contract before declaring a unit-price defect or changing approved semantics.';c['billingAssumptionsEquivalent']=False;c['specificationEvidence']=['docs/PRICING_ARCHITECTURE.md §8.x Resolved component numeric attributes (Oracle Database Insights)','docs/uat/AWS_CALCULATOR_PARITY.md §5.1/7'];c['monitoringClockDifference']={'publicHoursAtHalfUtilization':'365','officialDisplayedHoursAtHalfUtilization':'730','publicRule':'selected vCPU × utilization percentage × 7.3 hours × Nodes','officialRule':'selected vCPU × 730 hours × Nodes; native utilization help says it affects On-Demand instance cost only'}
  for component in c.get('componentComparisons',[]):
   if component.get('when')=='After' and component.get('localComponentIds')==['database-insights']:
    component['rawUnequalMonitoringQuantityVerdict']=component['verdict'];component['verdict']='NOT_COMPARABLE';component['reason']='Native full-month monitoring and public utilization-prorated monitoring represent different billed hours; do not infer a unit-price error from this cost difference.'
  c['equivalentComponentScope']=[x for x in c.get('componentComparisons',[]) if x.get('localComponentIds')!=['database-insights']]

 if c['serviceId']=='eventbridge' and 'event-archive-signal' in c['caseId']:
  c['rawArchiveComparisonVerdict']=c['pricingVerdict'];c['pricingVerdict']='NOT_COMPARABLE';c['inputVerdict']='INCOMPLETE';c['reason']='Archive comparison is constrained by the explicit binary-unit contract in estimate-quality SPEC item 8 and the native archive model coupling processing and stored volume through event count. Preserve all current GUI formulas and measured amounts. Changing existing stored GB without newly processed events is not independently configurable in the native screen. No public unit-price defect or full archive GUI PASS is inferred.';c['specificationEvidence']=['docs/estimate-quality/SPEC.md items 7–8','docs/uat/AWS_CALCULATOR_PARITY.md §5.1/7']
 if c['serviceId']=='elastic-load-balancing' and 'elb-gwlb-signal' in c['caseId'] and c.get('localBefore') and c.get('awsBefore') and not c.get('invalidGuiInputs') and any('Price source missing for component gwlbe-' in c.get(k,{}).get('text','') for k in ['localBefore','localAfter']):
  c['rawUnavailableMonthlyVerdict']=c['pricingVerdict'];c['pricingVerdict']='FAIL';c['severity']='HIGH';c['failureKind']='PUBLIC_RUNTIME_PRICE_SOURCE_UNAVAILABLE';c['reason']='Valid GWLB/Endpoint inputs produce the explicit public GUI error: Price source missing for component gwlbe-hour/gwlbe-bytes: AmazonVPC. Public monthly total is unavailable, while the native GUI displays priced endpoint components and a monthly total. This is an observed product acceptance failure, not an external browser/access blocker. No missing local amounts, deltas, or price differences are inferred. Investigate source publication/loading/mapping before changing any prices.';c['unmeasuredAmountReason']='Public monthly total displayed as an em dash and endpoint components as uncalculated because of the recorded missing-price-source runtime error.'
 if c['serviceId']=='ec2' and 'ec2-transfers-signal' in c['caseId'] and c.get('localBefore'):
  regional=next((x['value'] for x in c['localBefore']['inputs'] if x.get('id')=='input-component-transfer-regional-gbPerMonth'),'0')
  if float(regional or 0)>0 and not any(x.get('official','').startswith('REGIONALBILLED:') for x in c.get('plannedInputs',{}).get('baseline',[])):
   c['rawRegionalDirectionComparisonVerdict']=c['pricingVerdict'];c['pricingVerdict']='NOT_COMPARABLE';c['inputVerdict']='INCOMPLETE';c['reason']='Native GUI multiplies entered intra-region GB separately for outbound and inbound legs; the public GUI emits one regional transfer component. The public GUI explicitly says to include both inbound and outbound billed traffic, while native entered GB denotes physical traffic charged once for each direction. Initial identical numeric quantities were not equivalent; native physical GB must be public aggregate billable GB divided by two. Preserve observed amounts, investigate directional input meaning, and rerun other transfer meters in isolated cases.';c['requiredQuantityConversion']='native physical intra-region GB = public aggregate inbound-plus-outbound billable GB / 2, as explicitly documented in both rendered GUIs';c['specificationEvidence']=['docs/uat/AWS_CALCULATOR_PARITY.md §5.1/7','docs/SERVICE_ONBOARDING.md §3.1.1']
 if c['serviceId']=='glue' and 'glue-crawlers-signal' in c['caseId']:
  c['rawCrawlerAssumptionComparisonVerdict']=c['pricingVerdict'];c['pricingVerdict']='NOT_COMPARABLE';c['inputVerdict']='INCOMPLETE';c['reason']='Official GUI bills crawler count times crawler duration; public GUI bills explicitly entered DPUs times run duration. The audit assumed two DPUs per crawler, but AWS pricing only demonstrates a two-DPU example and does not establish a fixed per-crawler factor. Raw observed discrepancy retained. Confirm the physical and billing equivalence before creating a pricing defect instruction; no app or price data change authorized.';c['equivalenceUnconfirmed']='public DPUs / 2 -> official crawler count is an unverified assumption';c['auxiliarySourceUrls']=['https://aws.amazon.com/glue/pricing/','https://aws.amazon.com/glue/faqs/']
 if c['serviceId']=='glue' and 'glue-catalog-signal' in c['caseId'] and c.get('awsBefore') and not any(x.get('official','').startswith('MILLION:') for x in c.get('plannedInputs',{}).get('baseline',[])):
  c['rawUnscaledCatalogComparisonVerdict']=c['pricingVerdict'];c['pricingVerdict']='NOT_COMPARABLE';c['inputVerdict']='INCOMPLETE';c['reason']='Official catalog count units are million/month, but the initial case entered raw object/request counts. Not equal quantities; retain raw amounts and rerun with explicit division by one million.'
 if c['serviceId']=='redshift' and isinstance(c.get('parameter'),str) and 'rms-provisioned' in c['parameter'] and c.get('localBefore'):
  instance=next((f['value'] for f in c['localBefore']['inputs'] if f.get('id')=='input-profile--instanceType'),None)
  if instance and not instance.startswith('ra3.'):
   c['rawSameScalarComparisonVerdict']=c['pricingVerdict'];c['pricingVerdict']='NOT_COMPARABLE';c['inputVerdict']='INCOMPLETE';c['reason']='Initial managed-storage case used dc2. AWS rendered text says managed storage is only offered on ra3. Same scalar value under an unsupported parent is not equivalent. Retry with RA3 and align dependent backup state; observed raw amounts and differences retained.'
 if c['serviceId']=='ec2' and c.get('parameter') in ['input-component-instance-quantity','input-component-instance-hours'] and 'storage-normalized' not in c['caseId'] and c.get('localBefore') and c.get('localAfter'):
  c['rawSameScalarComparisonVerdict']=c['pricingVerdict'];c['pricingVerdict']='NOT_COMPARABLE';c['inputVerdict']='INCOMPLETE';c['reason']='Changing instance count/time changes official volume-months, while published EBS Storage amount is billed as a fixed monthly amount under SPEC §6.2. Raw identical storage numbers do not establish equivalent aggregate usage. Measure an explicitly normalized storage case and confirm field meaning before attributing a defect; raw differences retained.';c['specificationEvidence']=['docs/SPEC.md §6.2','docs/estimate-quality/SPEC.md item 1 (aggregate EBS GB/month independent of IOPS count/time)','docs/uat/AWS_CALCULATOR_PARITY.md §5.1/7'];c['requiredConversionInvestigation']='Official per-volume storage GB = local aggregate GB-month × 730 / (instance count × instance hours), if aggregate meaning is confirmed. Do not change application semantics during this audit.'

for c in measured:
 if c.get('pricingVerdict')=='PASS' and not c.get('componentComparisonComplete'):
  c['totalComparisonVerdict']='PASS';c['pricingVerdict']='INCOMPLETE';c['reason']='Displayed total and delta comparison passed, but corresponding GUI component breakdowns have not yet been verified. Pricing PASS is provisional until breakdown verification.'
 for field in ['localBefore','localAfter','awsBefore','awsAfter','localDeltaUsd','awsDeltaUsd','beforeDifferenceUsd','afterDifferenceUsd','deltaDifferenceUsd']:
  c.setdefault(field,None)
 if not c.get('publicBuildId'):
  meta=next((c.get(k,{}).get('priceMeta') for k in ['setupLocal','localBefore','localAfter'] if isinstance(c.get(k),dict) and c[k].get('priceMeta')),None)
  c['publicBuildId']=meta.split('·')[-1].strip() if meta else None
 c['pagesCommitSha']=read('manifest.json',{}).get('pagesCommitSha')
 if any(c.get(k) is None for k in ['localBefore','localAfter','awsBefore','awsAfter']):c['unmeasuredAmountReason']=c.get('reason','Incomplete measurement; no amount inferred.')

for c in measured:
 row=next((x for x in rows if x['rowId']==c.get('correspondenceRowId')),None)
 if row:c['officialFieldIds']=row['officialFieldIds'];c['localFieldIds']=row['localFieldIds'];c['inputVerdict']='INCOMPLETE' if row['inputVerdict']=='INCOMPLETE' and c['inputVerdict']!='FAIL' else c['inputVerdict'];c['inputMetadataLimitation']=row['reason'];c['inputVerdict']='FAIL' if row['inputVerdict']=='FAIL' else c['inputVerdict']
 c.setdefault('pricingCaseMethod','Baseline created independently for a service/Region group; each numeric input change is restored through GUI controls before the next case. Case baselines reused within this execution only.')
 c['warningsAndLimitations']=list(set(c.get('warningsAndLimitations',[])+['Input metadata and complete service parity not certified by a pricing PASS.']))
 allcases.append(c);write('cases/'+c['serviceId']+'/'+c['caseId']+'.json',c)
# Every observed row gets a stable individual case record even when numerical measurement is impossible or still unfinished.
for row in rows:
 if row['caseIds'] and row['inputVerdict']!='FAIL':continue
 service=row['serviceId'];id=service+'-'+('missing' if row['inputVerdict']=='FAIL' else 'excluded' if row['classification']=='SPEC_EXCLUDED' else 'investigate')+'-'+sid(row['rowId']);row['caseIds']=list(dict.fromkeys(row['caseIds']+[id]))
 fields=[official[n] for n in row['officialFieldIds']];localfields=[local[n] for n in row['localFieldIds']]
 fo=(next((o for o in fields[0]['observations'] if o['condition'].get('value') in row.get('missingLocalCandidates',[])),fields[0]['observations'][0]) if fields else None);lo=localfields[0]['observations'][0] if localfields else next(({'file':o['observation'],'screen':o['screen'],'condition':o['condition']} for o in L if o['serviceId']==service and fo and o['condition'].get('region')==fo['condition'].get('region')),None) or next(({'file':o['observation'],'screen':o['screen'],'condition':o['condition']} for o in L if o['serviceId']==service and o['condition']['variant']=='default'),None)
 reason=row['reason'];c={'caseId':id,'serviceId':service,'profile':{'local':lo['condition'].get('profile',{}).get('value') if lo else None,'official':fo['condition'] if fo else None},'region':{'local':lo['condition'].get('region') if lo else None,'official':fo['condition'].get('region') if fo else None},'parameter':[x['label'] for x in fields+localfields],'officialFieldIds':row['officialFieldIds'],'localFieldIds':row['localFieldIds'],'correspondenceRowId':row['rowId'],'comparisonScope':'input availability and metadata; prices unmeasured','inputVerdict':row['inputVerdict'],'pricingVerdict':'NOT_COMPARABLE' if row['inputVerdict']=='FAIL' or row['classification']=='SPEC_EXCLUDED' else 'INCOMPLETE','reason':reason,'executionState':'INPUT_OBSERVATION_RECORDED' if row['inputVerdict']=='FAIL' else 'PENDING_SEMANTIC_INVESTIGATION','observedAt':now,'publicBuildId':'20261013T095030Z-78197541','urls':{'local':'https://nobleneet.github.io/AWSPricingCalculator_forTAE/','aws':registry.get(service,{}).get('url')},'allInputs':{'localObservation':lo['file'] if lo else None,'officialObservation':fo['file'] if fo else None,'units':'Read full rendered labels and options in the independent observation JSON; no units inferred.'},'localBefore':None,'localAfter':None,'awsBefore':None,'awsAfter':None,'localDeltaUsd':None,'awsDeltaUsd':None,'amountDifferenceUsd':None,'toleranceUsd':'0.01','unmeasuredAmountReason':'No valid equal-input numerical comparison executed for this input row. Missing input remains an input FAIL.' if row['inputVerdict']=='FAIL' else 'GUI price case not yet executed; no historical price reused.','evidence':{'local':lo,'aws':fo},'specificationEvidence':row.get('specificationEvidence',[]),'resumeRequirements':['Verify same public build and current AWS price assumptions','Complete missing parent-condition inventory','Configure an independent equivalent estimate in both real GUIs','Measure baseline and changed monthly totals and components']}
 c['correspondenceClassification']=row['classification'];c['candidateComparison']={k:row[k] for k in ['missingLocalCandidates','excludedCandidates','observedOfficialOptions','observedLocalOptions','limitation'] if k in row};c['renderedInputs']={'local':read(lo['file'],{}).get('fields',[]) if lo else [],'official':read(fo['file'],{}).get('fields',[]) if fo else []};c['severity']='HIGH' if c['inputVerdict']=='FAIL' else None;allcases.append(c);write('cases/'+service+'/'+id+'.json',c)
write('field-correspondence.json',rows);write('cases.json',[{k:v for k,v in c.items() if k in ['caseId','serviceId','profile','region','parameter','officialFieldIds','localFieldIds','correspondenceRowId','comparisonScope','plannedInputs','urls']} for c in allcases]);write('consolidated-cases.json',allcases)
write('coverage-matrix.json',{'runId':runid,'inventoryComplete':False,'rows':rows,'regions':regions,'services':[{'serviceId':s['id'],'profiles':sorted(profiles.get(s['id'],[])),'officialObservedFields':sum(v['serviceId']==s['id'] for v in official.values()),'officialTotalFields':None,'localObservedFields':sum(v['serviceId']==s['id'] for v in local.values()),'localTotalFields':None,'unconfirmedConditions':read('inventory-remaining.json',{})} for s in services]})
failures=[c for c in allcases if c['inputVerdict']=='FAIL' or c['pricingVerdict']=='FAIL']
for c in allcases:
 id=c['caseId'];casefile='../../cases/'+c['serviceId']+'/'+id+'.json'
 if c in failures:
  directory='failures/'+id;write(directory+'/comparison.json',c)
  (R/directory).mkdir(parents=True,exist_ok=True)
  for side in ['local','aws']:
   for when in ['Before','After']:
    ev=c.get(side+when) or ((c.get('evidence') or {}).get(side) if when=='Before' else None);screen=ev.get('screen') if isinstance(ev,dict) else None
    if screen and (R/screen).exists():
     import shutil
     target=R/directory/(side.lower()+'-'+when.lower()+'.png')
     if not target.exists() or not os.path.samefile(R/screen,target):
      temporary=target.with_name(target.name+'.tmp-copy');shutil.copyfile(R/screen,temporary);os.replace(temporary,target)
    totalScreen=ev.get('totalScreen') if isinstance(ev,dict) else None
    if totalScreen and (R/totalScreen).exists():
     import shutil
     target=R/directory/(side.lower()+'-'+when.lower()+'-total.png')
     if not target.exists() or not os.path.samefile(R/totalScreen,target):
      temporary=target.with_name(target.name+'.tmp-copy');shutil.copyfile(R/totalScreen,temporary);os.replace(temporary,target)
  content=f'''# {id} 個別修正指示書

本書を修正依頼として扱い、最新版リポジトリとAGENTSを読み、原因調査→安全な修正→検証→必要なPR/公開確認まで進めよ。
このUATセッションでは修正を実行していない。別途本書を修正依頼として渡されたセッションで作業せよ。

サービス: {c['serviceId']}。Profile: {json.dumps(c['profile'],ensure_ascii=False)}。Region: {json.dumps(c['region'],ensure_ascii=False)}。
重大度: {c.get('severity') or ('HIGH' if c['inputVerdict']=='FAIL' else 'MEDIUM')}。影響範囲は当該入力・条件について確認し、他Profile/Regionへ未確認のまま一般化するな。
公開URL: {c['urls']['local']}。公式URL: {c['urls']['aws']}。
実行ID: {runid}。計測/記録日時: {c.get('finishedAt',c.get('observedAt',c.get('startedAt')))}。公開build: {c.get('publicBuildId')}。
不具合観測: {c['reason']}
入力判定: {c['inputVerdict']}。料金判定: {c['pricingVerdict']}。許容差: 0.01 USD/月。

## 再現せよ

1. 公開URLを実ブラウザで開き、新規Projectと構成案を作成して当該サービスを追加せよ。上記Profile/Regionと原記録の全入力・単位・デフォルトを設定せよ。
2. 公式URLを開き、原記録のRegionと機能/親selector条件を設定し、主要・詳細・任意セクションを展開せよ。原記録にある全入力を画面で照合せよ。
3. 入力欠落では原記録の公式入力を表示させ、公開版の全Profile/任意セクションに同等入力が存在するか再確認せよ。金額未測定を差額0と解釈するな。
4. 料金差異では原記録のbaseline全値を設定し、表示月額・内訳を保存せよ。change値だけ変更し、他入力を確認した上で月額・差分を再測定せよ。

全入力・単位・条件・変更前後値は本書末尾の機械可読原記録を参照せよ。記録済み表示値のみ用い、内部計算値をGUI実測の代用にするな。
[元ケースJSON]({casefile})、[comparison.json](comparison.json)、[対応表](../../field-correspondence.json)、[公式棚卸し](../../aws-field-inventory.json)、[公開棚卸し](../../local-field-inventory.json)を確認せよ。
スクリーンショットは原記録の相対パス（結果ルート基準）および同ディレクトリに複製した local-before.png / local-after.png / aws-before.png / aws-after.png が存在する範囲を参照せよ。取得済みの場合は local-before-total.png / local-after-total.png にDrawerを閉じた可視の月額合計画面を保存している。未取得の画面を取得済みと扱うな。

## 原因を確定して修正せよ

観測済み事実は下記JSONとGUI証跡に限定せよ。EC2の台数・稼働時間によるEBS差、Oracleの稼働率によるInsights差では、集計量/台数当たり容量/モニタリング時間の同等性と現行正本の指定を先に確認せよ。公式GUIと一致させるためだけに現行の入力意味や保存データ互換性を変えるな。価格正本・仕様差が確認できれば料金NOT_COMPARABLEまたは仕様問題として根拠を報告せよ。
原因仮説: Definition/UI未取り込み、Mapping/数量変換/条件分岐、公開Price DBの対応範囲・単価更新差などの可能性がある。いずれも未検証であり、差額だけで実装バグと断定するな。
最新版のService Definition、Pricing Mapping、生成Price DB、Billing Transform、UIを必要な範囲で調査し、根本原因を確定せよ。未確認のファイル名・関数名を原因と決め打ちするな。
入力欠落では docs/SERVICE_ONBOARDING.md §5–6 と現行契約を照合して必要なOn-Demand入力と依存条件を実装せよ。許容された明示的仕様除外が新たに確認できた場合は、根拠節と比較不能範囲を報告し、推測で仕様を増やすな。
期待動作: 同等の料金入力を設定でき、同等条件の合計・対応内訳・変更差分が0.01 USD以内で整合すること。計算対象外条件があれば現行正本に従い明示すること。
金額をハードコードするな。生成Price DBを手編集するな。service-specific意味はMappingへ置き、generic coreへサービス名分岐を入れるな。他サービスへの影響とvalidation scopeを保全せよ。原因不明なら先に調査せよ。

## 正本と回帰・公開確認

最新版リポジトリの AGENTS.md、docs/SPEC.md、docs/PRICING_ARCHITECTURE.md、docs/PRICING_MAPPING_ARCHITECTURE.md、docs/SERVICE_ONBOARDING.md、docs/ONBOARDING_PROMOTION_QUEUE.md、docs/AUTONOMOUS_IMPLEMENTATION.md、docs/IMPLEMENTATION_PLAN.md をAGENTS指定順序で読め。
変更前に影響する既存unit/Golden/E2Eを棚卸しし、当該サービスのnarrow test、Mapping validation、Golden、サービス別browser E2Eを更新・実行せよ。通過後に全体validation/test/E2Eの適用対象を実行せよ。
サービス拡張はreonboard/<serviceId>で進め、必要なPRとonboarding-readyキュー、serialized promotion、Price DB publication、Pages deploymentを確認せよ。公開後は本ケースの公式/公開GUI再比較と、同じ課金Componentを使う他Profile/Region/サービスの回帰確認を実施せよ。
完了条件: 根本原因と仕様根拠が説明でき、必要な入力・数量・料金の回帰チェックが通り、必要な公開反映とGUI再比較が完了していること。権限・公開障害等で残課題があれば、失敗した操作、外部条件、取得済み証跡、再開手順を報告せよ。

## 機械可読原記録（自己完結した再現情報）

```json
{json.dumps(c,ensure_ascii=False,indent=2)}
```
'''
  (R/directory/'fix-instructions.md').write_text(content)
  if c['inputVerdict']=='FAIL' and not c.get('localAfter'):
   for side in ['local','aws']:
    obsolete=R/directory/(side+'-after.png')
    if obsolete.exists():obsolete.rename(R/directory/('superseded-unmeasured-duplicate-'+side+'-after.png'))
 elif c['pricingVerdict'] in ['BLOCKED','NOT_COMPARABLE','INCOMPLETE'] or c['inputVerdict']=='INCOMPLETE':
  directory='investigations/'+id;(R/directory).mkdir(parents=True,exist_ok=True)
  (R/directory/'instructions.md').write_text(f'# {id} 調査・再実行指示\n\n実装バグ修正依頼と区別せよ。アプリ・Price DB・公開サイトを変更するな。\n\n理由: {c["reason"]}\n\n[個別原記録]({casefile})と[対応表](../../field-correspondence.json)を読み、同一公開buildと価格前提を確認して、実ブラウザGUIで未確認条件を棚卸しし、等価入力の基準値と変更後月額・内訳を保存せよ。保存済みの過去PASSやAPI計算値で今回の未測定を埋めるな。アクセス/GUI制約が続く場合は有界3回まで試し、実際の表示とエラーを記録せよ。仕様差がある場合は根拠節と比較範囲を記録してNOT_COMPARABLEを維持せよ。\n\n元ケースに全入力・単位・URL・操作履歴・証跡・再開情報を保存している。原記録のnull金額は未測定であり0ではない。\n')
summary=[]
for s in services:
 service=s['id'];cs=[c for c in allcases if c['serviceId']==service];rs=[r for r in rows if r['serviceId']==service]
 inputcounts=collections.Counter(r['inputVerdict'] for r in rs);pc=collections.Counter(c['pricingVerdict'] for c in cs);cl=collections.Counter(r['classification'] for r in rs)
 maxdiff=max([abs(float(c.get('afterDifferenceUsd') or 0)) for c in cs if c.get('afterDifferenceUsd') is not None],default=None)
 summary.append({'serviceId':service,'name':s['name'].split('\n')[0],'overallVerdict':'FAIL' if any(c in failures for c in cs) else 'INCOMPLETE','inputVerdicts':dict(inputcounts),'pricingVerdicts':dict(pc),'classificationCounts':dict(cl),'classifications':{k:[r['rowId'] for r in rs if r['classification']==k] for k in cl},'profiles':sorted(profiles.get(service,[])),'targetRegions':regions,'measuredRegions':sorted({c['region'] for c in cs if isinstance(c['region'],str) and c['pricingVerdict'] in ['PASS','FAIL']}),'caseCount':len(cs),'officialObservedFieldCount':sum(v['serviceId']==service for v in official.values()),'officialFullFieldCount':None,'localObservedFieldCount':sum(v['serviceId']==service for v in local.values()),'localFullFieldCount':None,'officialConfirmationRate':{'confirmedObservedFields':len({n for r in rs if r['classification'] in ['MISSING_LOCAL','SPEC_EXCLUDED','MISMATCHED','MATCHED'] for n in r['officialFieldIds']}),'observedDenominator':sum(v['serviceId']==service for v in official.values()),'fullDenominator':None,'reason':'Inventory not complete; observed denominator is a lower bound, not total official fields.'},'pricingInspectionRate':{'measuredLocalFields':len({c['parameter'] for c in cs if isinstance(c['parameter'],str) and c['pricingVerdict'] in ['PASS','FAIL']}),'observedTargetLocalFields':sum(v['serviceId']==service for v in local.values()),'fullBidirectionalTargetFields':None,'reason':'Union and conditional field inventory incomplete; no full inspection rate can be claimed.'},'maximumObservedAbsoluteDifferenceUsd':maxdiff})
write('summary.json',{'runId':runid,'status':'INCOMPLETE','allServicesVisited':len({o['serviceId'] for o in A})==len(services),'fullScopeCompleted':False,'counts':dict(collections.Counter(c['pricingVerdict'] for c in allcases)),'inputFailureCases':sum(c['inputVerdict']=='FAIL' for c in allcases),'failures':len(failures),'services':summary,'storage':read('manifest.json',{}).get('storage'),'limitations':read('inventory-remaining.json',{}),'unmeasuredAmountsAreNull':True})
with (R/'summary.csv').open('w') as f:
 w=csv.DictWriter(f,fieldnames=['serviceId','overallVerdict','officialObservedFieldCount','officialFullFieldCount','localObservedFieldCount','localFullFieldCount','caseCount','PASS','FAIL','BLOCKED','NOT_COMPARABLE','INCOMPLETE','maxDifferenceUsd']);w.writeheader()
 for s in summary:w.writerow({k:s.get(k) for k in w.fieldnames if k in s}|{v:s['pricingVerdicts'].get(v,0) for v in ['PASS','FAIL','BLOCKED','NOT_COMPARABLE','INCOMPLETE']}|{'maxDifferenceUsd':s['maximumObservedAbsoluteDifferenceUsd']})
md=f'# AWS Calculator Parity Test {runid}\n\n状態: **INCOMPLETE**。公開版・公式の17サービスへ実ブラウザで到達したが、全料金関連項目・全条件の検査完了ではない。未確認/未測定をPASSに数えない。アプリ・Price DBの修正、push/deployは実施していない。\n\n公開Price Data build: `20261013T095030Z-78197541`。UTC開始 2026-10-13 12:04:55、JST開始 2026-10-13 21:04:55。許容差0.01 USD/月。\n\n| Service | Input FAIL | Price PASS | Price FAIL | BLOCKED | NOT_COMPARABLE | INCOMPLETE | 観測済み公式項目 | 観測済み公開項目 | 最大実測差 USD |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n'
for s in summary:md+=f'| {s["serviceId"]} | {s["inputVerdicts"].get("FAIL",0)} | {s["pricingVerdicts"].get("PASS",0)} | {s["pricingVerdicts"].get("FAIL",0)} | {s["pricingVerdicts"].get("BLOCKED",0)} | {s["pricingVerdicts"].get("NOT_COMPARABLE",0)} | {s["pricingVerdicts"].get("INCOMPLETE",0)} | {s["officialObservedFieldCount"]} | {s["localObservedFieldCount"]} | {s["maximumObservedAbsoluteDifferenceUsd"]} |\n'
md+='\n入力対応と料金比較は別集計。全項目数は未確定であり、表の項目数は観測済みの下限。公式確認率・料金検査率の完全な分母はnull。分子と観測済み分母は summary.json を参照せよ。Profile/Region範囲、個別項目分類、未確認条件、0測定の項目も coverage-matrix.json と field-correspondence.json に保持した。\n\n[FAIL個別修正指示書一覧](fix-all.md)、[ケース一覧](cases.json)、[入力対応表](field-correspondence.json)、[網羅性](coverage-matrix.json)、[未完了棚卸し条件](inventory-remaining.json)、[機械可読集計](summary.json)を参照せよ。元GUI入力・表示・証跡は個別cases JSONおよびobservations配下へ保存した。\n\n保管先: manifest.json の storage.durableArchive に最新のリポジトリ外チェックポイントとSHAを保持している。保存日時・状態・取得手順を確認せよ。\n'
(R/'summary.md').write_text(md)
fix=f'# FAIL修正指示書一覧 {runid}\n\nFAIL件数: {len(failures)}。入力欠落のFAILでは月額未測定でもFAILを維持した。検証セッションで修正は実行していない。\n\n推奨順: HIGHの入力欠落をサービス単位で根拠確認し、次に再現済み料金差を調査せよ。クラスター仮説: 同一サービスの複数欠落は初期採用範囲の不足が共通原因の可能性がある（未検証）。料金差にはMapping/単位/丸め/料金更新差や入力非等価性の可能性がある（未検証）。各個別書で根本原因を確定せよ。\n\n'
for c in failures:fix+=f'- [{c["caseId"]}](failures/{c["caseId"]}/fix-instructions.md) — {c["serviceId"]} / input={c["inputVerdict"]} / pricing={c["pricingVerdict"]}\n'
fix+='\n必要な回帰範囲: 該当サービスの全Profile・6正式Region・同一Billing Transform/Mappingを使用するComponentと他サービス。narrow/Golden/E2Eを先行させ、その後全体validation、必要な公開反映、公式/公開GUI再比較を行え。未確認/比較不能は investigations 配下の調査指示書に分離している。\n'
(R/'fix-all.md').write_text(fix)
print(json.dumps({'cases':len(allcases),'failures':len(failures),'observedLocalFields':len(local),'observedOfficialFields':len(official),'pricing':dict(collections.Counter(c['pricingVerdict'] for c in allcases))},ensure_ascii=False))
