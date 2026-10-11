import { readFile, writeFile } from 'node:fs/promises';
import Decimal from '../../vendor/decimal.mjs';
const D=Decimal.clone({precision:80});
const root=process.argv[2]??'docs/estimate-quality/runs/20261011-quality';
const raw=Object.fromEntries(await Promise.all(['AmazonEC2','AmazonECS','AmazonRDS','AWSEvents'].map(async code=>[code,JSON.parse(await readFile(`${root}/${code}-selected-public-products.json`,'utf8'))])));
function price(code,usageType){
 const data=raw[code],products=Object.values(data.products).filter(p=>p.attributes.usagetype===usageType);
 if(products.length!==1)throw Error(`Independent source: ${usageType}: ${products.length} products`);
 const product=products[0],terms=Object.values(data.terms.OnDemand[product.sku]).filter(t=>t.effectiveDate<=data.publicationDate),date=terms.map(t=>t.effectiveDate).sort().at(-1),current=terms.filter(t=>t.effectiveDate===date);
 if(current.length!==1)throw Error('Ambiguous term');
 const dimensions=Object.values(current[0].priceDimensions).filter(d=>new D(d.pricePerUnit.USD).gt(0));
 if(dimensions.length!==1)throw Error('Ambiguous paid rate');
 const dimension=dimensions[0];return {sku:product.sku,rateCode:dimension.rateCode,unit:dimension.unit,priceUsd:dimension.pricePerUnit.USD,sourceUrl:data.sourceUrl,version:data.version,publicationDate:data.publicationDate};
}
const cases=[];
function alternative(id,serviceId,profileId,fields,components,formula,baselineFields={}){
 const baselineOverrides=Object.keys(baselineFields).length?baselineFields:serviceId==='fargate'?{'profile.tasksPerDay':'0'}:{'profile.archiveEventsMillions':'0','profile.archiveStorageGbMonth':'0'};
 baselineFields={...fields,...baselineOverrides};
 if(serviceId==='fargate'&&!fields['profile.tasksPerDay'])fields={...fields,'profile.tasksPerDay':'1'};
 const expected=components.reduce((total,item)=>total.plus(new D(item.quantity).times(item.price.priceUsd)),new D(0));
 cases.push({id,serviceId,profileId,region:'ap-northeast-1',projectHours:'730',baselineFields,fields,comparisonScope:components.map(c=>c.componentId),formula,expectedAlternativeMonthlyUsd:expected.toString(),priceEvidence:components,guiVerdict:'NOT_COMPARABLE',alternativeVerdict:'INCOMPLETE',requiredAction:'ALTERNATIVE_VERIFICATION'});
}
for(const hours of ['1','100'])alternative(`dedicated-independent-region-hours-${hours}`,'ec2','standard',{'profile.tenancy':'Dedicated','dedicated-region-fee.hours':hours},[{componentId:'dedicated-region-fee',quantity:hours,price:price('AmazonEC2','APN1-DedicatedUsage')}],'One regional fee, no instance-count multiplier; regional fee hours are explicit and independent of row compute hours. Baseline zero represents regional charge carried elsewhere.',{'profile.tenancy':'Dedicated','dedicated-region-fee.hours':'0'});
const linux=(architecture,memory,duration='1')=>{
 const arm=architecture==='ARM',prefix=arm?'APN1-Fargate-ARM':'APN1-Fargate',hours=new D('730').div(24).times(duration);
 return [{componentId:arm?'linux-arm-vcpu':'linux-x86-vcpu',quantity:hours.times(32).toString(),price:price('AmazonECS',`${prefix}-vCPU-Hours:perCPU`)},{componentId:arm?'linux-arm-memory':'linux-x86-memory',quantity:hours.times(memory).toString(),price:price('AmazonECS',`${prefix}-GB-Hours`)}];
};
for(const architecture of ['x86','ARM'])for(const memory of ['60','120','244'])alternative(`fargate-32-${architecture}-${memory}`,'fargate','standard',{'profile.operatingSystem':'Linux','profile.cpuArchitecture':architecture,'profile.linuxVcpuPerTask':'32','profile.linuxMemoryGbPerTask':memory},linux(architecture,memory),'32 vCPU and 60/120/244 GiB; resources × hours/task × tasks/day × 730/24 days');
alternative('fargate-32-x86-short','fargate','standard',{'profile.linuxVcpuPerTask':'32','profile.linuxMemoryGbPerTask':'60','profile.averageDurationHours':'0.5'},linux('x86','60','0.5'),'Valid Linux 32-vCPU configuration, half-hour duration');
for(const gb of ['20','21','200'])alternative(`fargate-windows-storage-${gb}`,'fargate','standard',{'profile.operatingSystem':'Windows','profile.ephemeralStorageGb':gb},[{componentId:'windows-ephemeral-storage',quantity:new D(gb).minus(20).times(730).div(24).toString(),price:price('AmazonECS','APN1-Fargate-EphemeralStorage-GB-Hours')}],'Windows platform ≥1.0.0; only excess above 20 GiB × task-hours',{'profile.operatingSystem':'Windows','profile.ephemeralStorageGb':'20'});
for(const profile of ['serverless-standard','serverless-io-optimized'])for(const gb of ['0','1','100000'])alternative(`aurora-${profile}-export-${gb}`,'aurora-postgresql',profile,{[`snapshot-export.processedGb`]:gb,'toggle.snapshot-export':true},[{componentId:'snapshot-export',quantity:gb,price:price('AmazonRDS','APN1-Aurora:SnapshotExportToS3')}],'Full snapshot size processed per export × exact PostgreSQL SnapshotExport SKU; S3 and KMS separate',{'toggle.snapshot-export':true,'snapshot-export.processedGb':'0'});
for(const profile of ['serverless-standard','serverless-io-optimized','limitless-io-optimized']){
 const component=profile==='limitless-io-optimized'?'limitless-compute':profile,acus=profile==='limitless-io-optimized'?'16':'1',usageType=profile==='serverless-standard'?'APN1-Aurora:ServerlessV2Usage':profile==='serverless-io-optimized'?'APN1-Aurora:ServerlessV2IOOptimizedUsage':'APN1-Aurora:IO-OptimizedLimitlessACUUsage-Limitless';
 alternative(`aurora-${profile}-short-capacity`,'aurora-postgresql',profile,{[`${component}.usageMode`]:'capacity',[`${component}.averageAcus`]:acus,[`${component}.computeHours`]:'0.5'},[{componentId:component,quantity:new D(acus).times('.5').toString(),price:price('AmazonRDS',usageType)}],'Valid physical capacity × half-hour duration; official GUI lacks independent monthly compute duration');
 cases.at(-1).baselineFields={[`${component}.usageMode`]:'aggregate',[`${component}.acuHours`]:'0'};
}
alternative('aurora-limitless-short-aggregate','aurora-postgresql','limitless-io-optimized',{'limitless-compute.usageMode':'aggregate','limitless-compute.acuHours':'8'},[{componentId:'limitless-compute',quantity:'8',price:price('AmazonRDS','APN1-Aurora:IO-OptimizedLimitlessACUUsage-Limitless')}],'8 ACU-hours is valid for 16 ACU × half-hour; no universal full-month 11680 ACU-hour minimum',{'limitless-compute.usageMode':'aggregate','limitless-compute.acuHours':'0'});
alternative('aurora-one-io-with-storage','aurora-postgresql','serverless-standard',{'storage.gbMonths':'1','io-requests.requests':'1'},[{componentId:'io-requests',quantity:'1',price:price('AmazonRDS','APN1-Aurora:StorageIOUsage')}],'A valid single I/O with positive storage; official ServerlessV2 GUI offers per-month rate but rejects 1/month because of its 0.0166/hour minimum. Public display only establishes a below-one-cent bound.',{'storage.gbMonths':'1','io-requests.requests':'0'});
for(const events of ['1','100','1000'])alternative(`archive-processing-only-${events}m`,'eventbridge','standard',{'profile.archiveEventsMillions':events,'profile.archiveStorageGbMonth':'0','profile.payloadSizeKb':'1'},[{componentId:'archive-processing',quantity:new D(events).times(1000000).div(1024*1024).toString(),price:price('AWSEvents','APN1-ArchivedEvents-Bytes')},{componentId:'archive-storage',quantity:'0',price:price('AWSEvents','APN1-TimedStorage-ByteHrs')}],'Processing only: events × KB/1024²; no stored GB-month');
for(const gb of ['1','100','1000'])alternative(`archive-existing-storage-only-${gb}`,'eventbridge','standard',{'profile.archiveEventsMillions':'0','profile.archiveStorageGbMonth':gb},[{componentId:'archive-processing',quantity:'0',price:price('AWSEvents','APN1-ArchivedEvents-Bytes')},{componentId:'archive-storage',quantity:gb,price:price('AWSEvents','APN1-TimedStorage-ByteHrs')}],'Existing archive storage only: no new processing; GB-month × storage SKU');
await writeFile(`${root}/alternative-cases.json`,JSON.stringify({runId:'20261011-quality',generatedAt:new Date().toISOString(),note:'Fresh representative cases; historical case IDs and old screenshots are unavailable in this checkout. Expected prices use independent raw AWS Price List extraction, never application Core or Price DB.',cases},null,2)+'\n');
console.log(`${cases.length} alternative cases generated`);
