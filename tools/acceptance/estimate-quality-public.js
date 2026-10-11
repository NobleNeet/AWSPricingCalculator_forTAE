import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import Decimal from '../../vendor/decimal.mjs';
const D=Decimal.clone({precision:80});
const root=process.argv[2]??'docs/estimate-quality/runs/20261011-quality';
const PUBLIC='https://nobleneet.github.io/AWSPricingCalculator_forTAE/';
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:1100}});
page.on('dialog',dialog=>dialog.accept());
const records=[];await mkdir(`${root}/screenshots`,{recursive:true});
async function settle(){await page.waitForTimeout(120);await page.locator('#drawer-content > .state').first().waitFor({state:'visible'});for(let i=0;i<100;i++){const text=await page.locator('#drawer-content > .state').first().innerText();if(!text.includes('読込中'))return;await page.waitForTimeout(100);}throw Error('Recalculation did not finish');}
async function field(key,value){
 if(key.startsWith('toggle.')){await page.locator(`[data-toggle="${key.slice(7)}"]`).setChecked(value);await settle();return;}
 const [component,id]=key.split('.'),selector=component==='profile'?`#input-profile--${id}`:`#input-component-${component}-${id}`;
 const input=page.locator(selector);await input.waitFor({state:'attached'});
 const details=input.locator('xpath=ancestor::details');if(await details.count()&&!await input.isVisible())await details.locator('summary').click();
 const tag=await input.evaluate(x=>x.tagName);if(tag==='SELECT')await input.selectOption(value);else{await input.fill(value);await input.press('Tab');}await settle();
}
async function configure(serviceId,profileId,fields){
 await page.goto(PUBLIC,{waitUntil:'domcontentloaded'});await page.locator('#price-meta').filter({hasText:'Price Data'}).waitFor();
 if(await page.getByRole('button',{name:'最初の構成案を作る'}).count()===0)await page.getByRole('button',{name:'新規Project',exact:true}).click();
 await page.getByRole('button',{name:'最初の構成案を作る'}).click();await page.getByRole('button',{name:'サービスを追加',exact:true}).click();await page.locator(`[data-service="${serviceId}"]`).click();
 await page.locator('#drawer-profile').waitFor();if(profileId)await page.locator('#drawer-profile').selectOption(profileId);await settle();
 for(const [key,value]of Object.entries(fields))await field(key,value);
}
function displayedNumber(text){const m=text.match(/\$([\d,.]+)/);return m?new D(m[1].replaceAll(',','')):null;}
async function observe(id,scope){
 const components=Object.fromEntries(await Promise.all(scope.map(async componentId=>[componentId,await page.locator(`[data-component-id="${componentId}"] .component-price`).innerText()])));
 const serviceMonthly=await page.locator('td[data-instance] .amount').last().innerText(),state=await page.locator('#drawer-content > .state').first().innerText(),meta=await page.locator('#price-meta').innerText();
 await page.screenshot({path:`${root}/screenshots/${id}.png`});
 return {observedAt:new Date().toISOString(),url:page.url(),serviceMonthly,components,state,priceMeta:meta,screen:`screenshots/${id}.png`};
}
function sumDisplay(observation){let total=new D(0);for(const text of Object.values(observation.components)){if(text.startsWith('<'))return null;const amount=displayedNumber(text);if(!amount)return null;total=total.plus(amount);}return total;}
async function save(){await writeFile(`${root}/public-results.json`,JSON.stringify({runId:'20261011-quality',publicUrl:PUBLIC,records},null,2)+'\n');}
const mode=process.argv[3]??'all';
if(mode==='all'||mode==='tier'){
 const official=JSON.parse(await readFile(`${root}/official-tier-results.json`,'utf8'));
 for(const reference of official){
  const isS3=reference.id.startsWith('s3'),fields=isS3?{'storage.gbMonths':reference.inputs.storageGb,'write-requests.requests':'0','read-requests.requests':'0'}:{'profile.ebsVolumeType':'io2','ebs.storageGb':reference.inputs.storageGb,'ebs-io2-iops.provisionedIops':reference.inputs.iops,'ebs-io2-iops.volumeCount':reference.inputs.volumeCount,'ebs-io2-iops.volumeHours':reference.inputs.volumeHours};
  const scope=isS3?['storage','write-requests','read-requests']:['ebs','ebs-io2-iops','ebs-io2-iops-tier2','ebs-io2-iops-tier3'];
  const record={id:reference.id,kind:'OFFICIAL_GUI',comparisonScope:scope,inputs:fields,official:reference,guiVerdict:'INCOMPLETE',requiredAction:'VERIFY_DEPLOYED_FIX'};
  try{await configure(isS3?'s3':'ec2','standard',fields);record.own=await observe(`public-${reference.id}`,scope);const amount=sumDisplay(record.own);record.amountDifferenceUsd=amount?.minus(reference.monthlyUsd).toString()??null;record.guiVerdict=amount&&amount.minus(reference.monthlyUsd).abs().lte('.01')?'PASS':amount?'FAIL':'BLOCKED';record.exactDisplayMatch=record.amountDifferenceUsd==='0';}catch(error){record.guiVerdict='BLOCKED';record.reason=error.message;}
  records.push(record);await save();console.log(record.id,record.guiVerdict,record.amountDifferenceUsd);
 }
}
if(mode==='all'||mode==='alternative'){
 const list=JSON.parse(await readFile(`${root}/alternative-cases.json`,'utf8')).cases;
 for(const test of list){const record={...test,kind:'ALTERNATIVE_PRICE_LIST'};
  try{await configure(test.serviceId,test.profileId,test.baselineFields);record.baseline=await observe(`public-${test.id}-baseline`,test.comparisonScope);for(const [key,value]of Object.entries(test.fields))await field(key,value);record.own=await observe(`public-${test.id}`,test.comparisonScope);
   let valid=true;for(const evidence of test.priceEvidence){const expected=new D(evidence.quantity).times(evidence.price.priceUsd),text=record.own.components[evidence.componentId],observed=displayedNumber(text);if(text.startsWith('<'))valid&&=expected.gt(0)&&expected.lt('.01');else valid&&=Boolean(observed&&observed.minus(expected).abs().lte('.01'));}
   const before=sumDisplay(record.baseline),after=sumDisplay(record.own);record.displayedDeltaUsd=before&&after?after.minus(before).toString():null;record.alternativeVerdict=valid?'ALTERNATIVE_VERIFIED':'FAIL';record.requiredAction=valid?'COMPARISON_LIMIT_DOCUMENTED':'INVESTIGATE_PRICE_MISMATCH';
  }catch(error){record.alternativeVerdict='BLOCKED';record.reason=error.message;record.requiredAction='RETRY_MEASUREMENT';}
  records.push(record);await save();console.log(record.id,record.alternativeVerdict);
 }
}
await browser.close();
