import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import Decimal from '../../vendor/decimal.mjs';
const D=Decimal.clone({precision:80});
const root=process.argv[2]??'docs/estimate-quality/runs/20261011-quality';
const PUBLIC='https://nobleneet.github.io/AWSPricingCalculator_forTAE/';
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1100}});
page.on('dialog',dialog=>dialog.accept());
const records=[];let currentService,currentProfile;await mkdir(`${root}/screenshots`,{recursive:true});
async function settle(){await page.waitForTimeout(120);await page.locator('#drawer-content > .state').first().waitFor({state:'visible'});for(let i=0;i<100;i++){const text=await page.locator('#drawer-content > .state').first().innerText();if(!text.includes('読込中'))return;await page.waitForTimeout(100);}throw Error('Recalculation did not finish');}
async function field(key,value){
 if(key.startsWith('toggle.')){await page.locator(`[data-toggle="${key.slice(7)}"]`).setChecked(value);await settle();if(await page.locator(`[data-toggle="${key.slice(7)}"]`).isChecked()!==value)throw Error(`Toggle did not reflect ${key}`);return;}
 const [component,id]=key.split('.'),selector=component==='profile'?`#input-profile--${id}`:`#input-component-${component}-${id}`;
 const input=page.locator(selector);await input.waitFor({state:'attached'});
 const details=input.locator('xpath=ancestor::details');if(await details.count()&&!await input.isVisible())await details.locator('summary').click();
 const tag=await input.evaluate(x=>x.tagName);if(tag==='SELECT')await input.selectOption(value);else{await input.fill(value);await input.press('Tab');}await settle();if(await page.locator(selector).inputValue()!==value)throw Error(`Input did not reflect ${key}=${value}`);
}
async function configure(serviceId,profileId,fields){
 currentService=serviceId;currentProfile=profileId;
 await page.goto(PUBLIC,{waitUntil:'domcontentloaded'});await page.locator('#price-meta').filter({hasText:/Price Data \d{4}-\d{2}-\d{2}/}).waitFor();
 if(await page.getByRole('button',{name:'最初の構成案を作る'}).count()===0)await page.getByRole('button',{name:'新規Project',exact:true}).click();
 await page.getByRole('button',{name:'最初の構成案を作る'}).click();await page.getByRole('button',{name:'サービスを追加',exact:true}).click();await page.locator(`[data-service="${serviceId}"]`).click();
 await page.locator('#drawer-profile').waitFor();if(profileId)await page.locator('#drawer-profile').selectOption(profileId);await settle();await page.locator('#drawer-region').selectOption('ap-northeast-1');await settle();
 for(const [key,value]of Object.entries(fields))await field(key,value);
}
function displayedNumber(text){const m=text.match(/\$([\d,.]+)/);return m?new D(m[1].replaceAll(',','')):null;}
async function observe(id,scope){
 const components={},componentScreens={};
 for(const componentId of scope){
  const price=page.locator(`[data-component-id="${componentId}"] .component-price`),details=price.locator('xpath=ancestor::details');
  if(await details.count()&&!await price.isVisible())await details.locator('summary').click();
  await price.waitFor({state:'visible'});await price.scrollIntoViewIfNeeded();
  components[componentId]=await price.innerText();
  const screen=`screenshots/${id}-${componentId}.png`;
  await page.screenshot({path:`${root}/${screen}`});componentScreens[componentId]=screen;
 }
 const serviceMonthly=await page.locator('td[data-instance] .amount').last().innerText(),state=await page.locator('#drawer-content > .state').first().innerText(),meta=await page.locator('#price-meta').innerText();
 await page.screenshot({path:`${root}/screenshots/${id}.png`});
 const renderedInputs=await page.locator('#drawer-content input,#drawer-content select').evaluateAll(xs=>xs.map(x=>({id:x.id,type:x.type,value:x.type==='checkbox'?x.checked:x.value,disabled:x.disabled,ariaInvalid:x.getAttribute('aria-invalid'),label:x.labels?.[0]?.innerText??null,minimum:x.getAttribute('min'),maximum:x.getAttribute('max'),step:x.getAttribute('step'),options:x.tagName==='SELECT'?[...x.options].map(o=>({value:o.value,label:o.textContent})):undefined})));
 const observation={observedAt:new Date().toISOString(),url:page.url(),serviceId:currentService,profileId:currentProfile,serviceMonthly,components,componentScreens,state,drawerText:await page.locator('#drawer-content').innerText(),priceMeta:meta,renderedInputs,screen:`screenshots/${id}.png`};
 observation.scopeMonthlyUsd=sumDisplay(observation)?.toString()??null;return observation;
}
function sumDisplay(observation){let total=new D(0);for(const text of Object.values(observation.components)){if(text.startsWith('<'))return null;const amount=displayedNumber(text);if(!amount)return null;total=total.plus(amount);}return total;}
async function save(){await writeFile(`${root}/public-results.json`,JSON.stringify({runId:'20261011-quality',publicUrl:PUBLIC,records},null,2)+'\n');}
const mode=process.argv[3]??'all';
const baselines=new Map();
if(mode==='all'||mode==='tier'){
 const official=JSON.parse(await readFile(`${root}/official-tier-results.json`,'utf8'));
 for(const reference of official.filter(reference=>reference.kind!=='BASELINE')){
  const isS3=reference.id.startsWith('s3'),fields=isS3?{'storage.gbMonths':reference.inputs.storageGb,'write-requests.requests':'0','read-requests.requests':'0'}:{'profile.ebsVolumeType':'io2','ebs.storageGb':new D(reference.inputs.storageGb).times(reference.inputs.volumeCount).times(reference.inputs.volumeHours).div(730).toString(),'ebs-io2-iops.provisionedIops':reference.inputs.iops,'ebs-io2-iops.volumeCount':reference.inputs.volumeCount,'ebs-io2-iops.volumeHours':reference.inputs.volumeHours};
  const scope=isS3?['storage','write-requests','read-requests']:['ebs','ebs-io2-iops','ebs-io2-iops-tier2','ebs-io2-iops-tier3'];
  const record={id:reference.id,kind:'OFFICIAL_GUI',comparisonScope:scope,inputs:fields,official:reference,guiVerdict:'INCOMPLETE',requiredAction:'VERIFY_DEPLOYED_FIX'};
  try{await configure(isS3?'s3':'ec2','standard',fields);record.own=await observe(`public-${reference.id}`,scope);const amount=sumDisplay(record.own);record.amountDifferenceUsd=amount?.minus(reference.monthlyUsd).toString()??null;
   const group=isS3?'s3':'io2';if(!baselines.has(group))baselines.set(group,{id:reference.id,own:record.own,amount,official:reference});
   const baseline=baselines.get(group);record.baseline=baseline.own;record.baselineId=baseline.id;record.officialBaseline=baseline.official;record.ownDeltaUsd=amount&&baseline.amount?amount.minus(baseline.amount).toString():null;record.officialDeltaUsd=new D(reference.monthlyUsd).minus(baseline.official.monthlyUsd).toString();record.deltaDifferenceUsd=record.ownDeltaUsd===null?null:new D(record.ownDeltaUsd).minus(record.officialDeltaUsd).toString();
   record.guiVerdict=amount&&baseline.amount&&amount.minus(reference.monthlyUsd).abs().lte('.01')&&baseline.amount.minus(baseline.official.monthlyUsd).abs().lte('.01')&&new D(record.deltaDifferenceUsd).abs().lte('.01')?'PASS':amount?'FAIL':'BLOCKED';record.exactDisplayMatch=record.amountDifferenceUsd==='0';record.requiredAction=record.guiVerdict==='PASS'?'RESOLVED':'INVESTIGATE_PRICE_MISMATCH';
  }catch(error){record.guiVerdict='BLOCKED';record.reason=error.message;}
  records.push(record);await save();console.log(record.id,record.guiVerdict,record.amountDifferenceUsd);
 }
}
if(mode==='all'||mode==='alternative'){
 const list=JSON.parse(await readFile(`${root}/alternative-cases.json`,'utf8')).cases;
 for(const test of list){const record={...test,kind:'ALTERNATIVE_PRICE_LIST'};
  try{await configure(test.serviceId,test.profileId,test.baselineFields);record.baseline=await observe(`public-${test.id}-baseline`,test.comparisonScope);for(const [key,value]of Object.entries(test.fields))await field(key,value);record.own=await observe(`public-${test.id}`,test.comparisonScope);
   let valid=true;for(const evidence of test.priceEvidence){const expected=new D(evidence.quantity).times(evidence.price.priceUsd),text=record.own.components[evidence.componentId],observed=displayedNumber(text),baseline=displayedNumber(record.baseline.components[evidence.componentId]);valid&&=Boolean(baseline&&baseline.isZero());if(text.startsWith('<'))valid&&=expected.gt(0)&&expected.lt('.01');else valid&&=Boolean(observed&&observed.minus(expected).abs().lte('.01'));}
   const before=sumDisplay(record.baseline),after=sumDisplay(record.own);record.displayedDeltaUsd=before&&after?after.minus(before).toString():null;record.alternativeAmountDifferenceUsd=after?.minus(test.expectedAlternativeMonthlyUsd).toString()??null;record.alternativeDeltaDifferenceUsd=record.displayedDeltaUsd===null?null:new D(record.displayedDeltaUsd).minus(test.expectedAlternativeMonthlyUsd).toString();if(after)valid&&=new D(record.alternativeAmountDifferenceUsd).abs().lte('.01')&&new D(record.alternativeDeltaDifferenceUsd).abs().lte('.01');record.displayVerification=after?'WITHIN_ONE_CENT':'UPPER_BOUND_ONLY';record.alternativeVerdict=valid?'ALTERNATIVE_VERIFIED':'FAIL';record.requiredAction=valid?'COMPARISON_LIMIT_DOCUMENTED':'INVESTIGATE_PRICE_MISMATCH';
  }catch(error){record.alternativeVerdict='BLOCKED';record.reason=error.message;record.requiredAction='RETRY_MEASUREMENT';}
  records.push(record);await save();console.log(record.id,record.alternativeVerdict);
 }
}
if(mode==='all'||mode==='extra'){
 const official=JSON.parse(await readFile(`${root}/official-extra-results.json`,'utf8'));
 const raw=JSON.parse(await readFile(`${root}/AWSEvents-selected-public-products.json`,'utf8'));
 function independentRate(usageType){const products=Object.values(raw.products).filter(p=>p.attributes.usagetype===usageType);if(products.length!==1)throw Error('Independent rate product is ambiguous');const product=products[0],terms=Object.values(raw.terms.OnDemand[product.sku]);if(terms.length!==1)throw Error('Independent term is ambiguous');const dimensions=Object.values(terms[0].priceDimensions).filter(d=>new D(d.pricePerUnit.USD).gt(0));if(dimensions.length!==1)throw Error('Independent paid dimension is ambiguous');return {sku:product.sku,rateCode:dimensions[0].rateCode,priceUsd:dimensions[0].pricePerUnit.USD,sourceUrl:raw.sourceUrl,version:raw.version};}
 for(const reference of official.filter(reference=>reference.kind!=='BASELINE')){
  const scheduler=reference.id.startsWith('scheduler'),quantity=scheduler?null:new D(reference.inputs.archivedEventsMillions).times(1000000).times(reference.inputs.payloadKb).div(1024*1024),scope=scheduler?['scheduler']:['archive-processing','archive-storage'];
  const fields=scheduler?{'profile.schedulerInvocationsMillions':reference.inputs.schedulerInvocationsMillions}:{'profile.archiveEventsMillions':reference.inputs.archivedEventsMillions,'profile.payloadSizeKb':reference.inputs.payloadKb,'profile.archiveStorageGbMonth':quantity.toString()};
  const baselineFields=scheduler?{'profile.schedulerInvocationsMillions':'14'}:{'profile.archiveEventsMillions':'0','profile.payloadSizeKb':'1','profile.archiveStorageGbMonth':'0'};
  const record={id:reference.id,kind:'OFFICIAL_GUI',serviceId:'eventbridge',inputs:fields,baselineFields,comparisonScope:scope,official:reference,guiVerdict:'INCOMPLETE'};
  try{
   await configure('eventbridge','standard',baselineFields);record.baseline=await observe(`public-${reference.id}-baseline`,scope);for(const [key,value]of Object.entries(fields))await field(key,value);record.own=await observe(`public-${reference.id}`,scope);
   const amount=sumDisplay(record.own),before=sumDisplay(record.baseline);record.amountDifferenceUsd=amount?.minus(reference.monthlyUsd).toString()??null;record.ownDeltaUsd=amount&&before?amount.minus(before).toString():null;
   const nativeRejected=reference.text.includes('cannot be in decimal');
   if(!scheduler||nativeRejected){record.guiVerdict='NOT_COMPARABLE';record.reason=scheduler?'Official GUI rejects decimal million-count input; displayed zero is not a valid measurement.':'Official displayed calculations use 0.000001 GB per 1 KB event before multiplication; published binary conversion retains the unrounded value.';record.priceEvidence=scheduler?[independentRate('APN1-ScheduledInvocation')]:[independentRate('APN1-ArchivedEvents-Bytes'),independentRate('APN1-TimedStorage-ByteHrs')];record.expectedAlternativeMonthlyUsd=scheduler?D.max(new D(reference.inputs.schedulerInvocationsMillions).minus(14),0).times(1000000).times(record.priceEvidence[0].priceUsd).toString():quantity.times(record.priceEvidence.reduce((sum,p)=>sum.plus(p.priceUsd),new D(0))).toString();
    record.officialBaseline=official.find(x=>x.id===(scheduler?'scheduler-14':'archive-zero'));
    const expected=new D(record.expectedAlternativeMonthlyUsd),bounded=Object.values(record.own.components).some(t=>t.startsWith('<'));record.alternativeVerdict=before?.isZero()&&(amount?amount.minus(expected).abs().lte('.01'):bounded&&expected.gt(0)&&expected.lt('.01'))?'ALTERNATIVE_VERIFIED':'FAIL';record.requiredAction=record.alternativeVerdict==='ALTERNATIVE_VERIFIED'?'COMPARISON_LIMIT_DOCUMENTED':'INVESTIGATE_PRICE_MISMATCH';
   }else{record.officialBaseline=official.find(x=>x.id==='scheduler-14');record.officialDeltaUsd=new D(reference.monthlyUsd).minus(record.officialBaseline.monthlyUsd).toString();record.deltaDifferenceUsd=record.ownDeltaUsd===null?null:new D(record.ownDeltaUsd).minus(record.officialDeltaUsd).toString();const upperBound=Object.values(record.own.components).every(t=>t.startsWith('<'))&&new D(reference.monthlyUsd).isZero();record.guiVerdict=before?.isZero()&&(amount&&amount.minus(reference.monthlyUsd).abs().lte('.01')&&new D(record.deltaDifferenceUsd).abs().lte('.01')||upperBound)?'PASS':amount?'FAIL':'BLOCKED';record.displayVerification=upperBound?'UPPER_BOUND_ONLY':'WITHIN_ONE_CENT';record.exactDisplayMatch=!upperBound&&record.amountDifferenceUsd==='0';if(upperBound)record.absoluteAndDeltaDifferenceRangeUsd={lowerInclusive:'0',upperExclusive:'0.01'};record.allowanceReason=new D(reference.inputs.schedulerInvocationsMillions).lte(14)?'ALL_WITHIN_14_MILLION_REMAINING_ALLOWANCE':'EXCESS_IS_BILLED';record.requiredAction=record.guiVerdict==='PASS'?'RESOLVED':'INVESTIGATE_PRICE_MISMATCH';}
  }catch(error){record.guiVerdict='BLOCKED';record.reason=error.message;record.requiredAction='RETRY_MEASUREMENT';}
  records.push(record);await save();console.log(record.id,record.guiVerdict,record.alternativeVerdict??'');
 }
}
if(mode==='all'||mode==='functional'){
 async function functional(id,changes,invalid,scope){id=`validation-${id}`;const record={id,serviceId:currentService,profileId:currentProfile,kind:'INPUT_VALIDATION',inputs:changes,expectedInvalid:invalid,comparisonScope:scope,guiVerdict:null,functionalVerdict:'INCOMPLETE'};try{record.baseline=await observe(`public-${id}-baseline`,scope);for(const [key,value]of Object.entries(changes))await field(key,value);record.own=await observe(`public-${id}`,scope);const amounts=Object.values(record.own.components),hasMissing=amounts.some(t=>!displayedNumber(t));record.functionalVerdict=invalid?hasMissing&&record.own.serviceMonthly==='—'?'FUNCTIONAL_PASS':'FAIL':!hasMissing&&record.own.serviceMonthly.startsWith('$')?'FUNCTIONAL_PASS':'FAIL';record.requiredAction=record.functionalVerdict==='FUNCTIONAL_PASS'?'RESOLVED':'INVESTIGATE_VALIDATION';}catch(error){record.functionalVerdict='BLOCKED';record.reason=error.message;record.requiredAction='RETRY_MEASUREMENT';}records.push(record);await save();console.log(id,record.functionalVerdict);}
 await configure('rds','standard',{});
 await functional('rds-2-nodes-physical',{'instance.quantity':'2'},false,['storage']);
 await functional('rds-storage-duration-too-short',{'storage.storageHours':'729'},true,['storage']);
 await functional('rds-storage-duration-recovered',{'storage.storageHours':'730'},false,['storage']);
 await functional('rds-capacity-under-minimum',{'storage.capacityGb':'19'},true,['storage']);
 await functional('rds-capacity-over-maximum',{'storage.capacityGb':'65537'},true,['storage']);
 await functional('rds-capacity-recovered',{'storage.capacityGb':'20'},false,['storage']);
 await functional('rds-aggregate-under-physical-minimum',{'storage.usageMode':'aggregate','storage.gbMonths':'20'},true,['storage']);
 await functional('rds-aggregate-at-physical-minimum',{'storage.gbMonths':'40'},false,['storage']);
 await functional('rds-short-duration-small-aggregate',{'instance.hours':'10','storage.gbMonths':'1'},false,['storage']);
 await configure('aurora-postgresql','limitless-io-optimized',{});
 await functional('aurora-limitless-under-minimum',{'limitless-compute.averageAcus':'15'},true,['limitless-compute']);
 await functional('aurora-limitless-short-capacity',{'limitless-compute.averageAcus':'16','limitless-compute.computeHours':'0.5'},false,['limitless-compute']);
 await functional('aurora-limitless-short-aggregate',{'limitless-compute.usageMode':'aggregate','limitless-compute.acuHours':'8'},false,['limitless-compute']);
 await configure('aurora-postgresql','serverless-standard',{});
 await functional('aurora-zero-storage-zero-io',{'io-requests.requests':'0','storage.gbMonths':'0'},false,['storage','io-requests']);
 await functional('aurora-io-with-zero-storage',{'io-requests.requests':'1'},true,['io-requests']);
 await functional('aurora-io-with-storage-recovered',{'storage.gbMonths':'1'},false,['storage','io-requests']);
}
await browser.close();
