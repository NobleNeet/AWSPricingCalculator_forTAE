import https from 'node:https';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const region=process.argv[2]??'ap-northeast-1';
const url='https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonRedshift/current/'+region+'/index.json';
const output=process.argv[3]??'redshift-offer-audit.json';
const raw='/tmp/redshift-offer-'+region+'.json';
await new Promise((resolve,reject)=>{
 const req=https.get(url,{timeout:600000},res=>{
  if(res.statusCode!==200){res.resume();reject(new Error('AWS offer HTTP '+res.statusCode));return;}
  const file=fs.createWriteStream(raw);res.pipe(file);
  file.on('finish',()=>file.close(resolve));file.on('error',reject);res.on('error',reject);
 });req.on('timeout',()=>req.destroy(new Error('AWS offer request timeout')));req.on('error',reject);
});
const data=JSON.parse(fs.readFileSync(raw,'utf8'));
const counts=new Map(), representatives=new Map();
const products=data.products||{};
for(const [sku,p] of Object.entries(products)){
 const a=p.attributes||{};
 const key=[p.productFamily||'',a.usagetype||'',a.operation||'',a.instanceType||'',a.instanceTypeGroup||''].join('|');
 counts.set(key,(counts.get(key)||0)+1);
 if(!representatives.has(key))representatives.set(key,{sku,productFamily:p.productFamily,attributes:a});
}
const terms=data.terms?.OnDemand||{};
const grouped=[];
for(const [key,count] of counts){
 const p=representatives.get(key);
 const entry={key,count,...p};
 const term=terms[p.sku];
 if(term){entry.dimensions=Object.values(term).flatMap(t=>Object.values(t.priceDimensions||{}).map(d=>({description:d.description,unit:d.unit,beginRange:d.beginRange,endRange:d.endRange,USD:d.pricePerUnit?.USD}))); }
 grouped.push(entry);
}
const result={source:url,publicationDate:data.publicationDate,version:data.version,formatVersion:data.formatVersion,productCount:Object.keys(products).length,groups:grouped.sort((a,b)=>a.key.localeCompare(b.key))};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log('AWS offer:',url,'products:',result.productCount,'groups:',grouped.length,'saved:',output);

console.log('REDSHIFT_AUDIT_JSON='+JSON.stringify(result));
