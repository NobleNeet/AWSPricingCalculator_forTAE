import https from 'node:https';

function get(url) {
  return new Promise((resolve,reject)=>{
    https.get(url,{timeout:180000},res=>{
      if(res.statusCode!==200){res.resume();reject(new Error(url+' HTTP '+res.statusCode));return;}
      const chunks=[];res.on('data',b=>chunks.push(b));res.on('end',()=>resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error',reject);
  });
}
const index=JSON.parse(await get('https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/index.json'));
const codes=Object.keys(index.offers).filter(k=>/elb|loadbalanc|privatelink|vpc/i.test(k+' '+JSON.stringify(index.offers[k])));
console.log('MATCHING_OFFERS',JSON.stringify(codes));
for(const code of [...new Set([...codes.filter(k=>/ELB|Vpc|VPC|Private/i.test(k)), 'AWSELB'])]){
  try {
    const url='https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/'+code+'/current/ap-northeast-1/index.json';
    const data=JSON.parse(await get(url));
    console.log('OFFER',code,'version',data.version,'date',data.publicationDate,'total',Object.keys(data.products||{}).length);
    const selectedProducts=Object.fromEntries(Object.entries(data.products||{}).filter(([sku,p])=>code==='AWSELB'||(p.attributes?.endpointType==='Gateway Load Balancer Endpoint')));
    const selectedTerms=Object.fromEntries(Object.entries(data.terms?.OnDemand||{}).filter(([sku])=>Object.hasOwn(selectedProducts,sku)));
    console.log('FIXTURE_JSON='+JSON.stringify({formatVersion:data.formatVersion,offerCode:code,version:data.version,publicationDate:data.publicationDate,products:selectedProducts,terms:{OnDemand:selectedTerms},attributesList:{}}));

    const grouped=new Map();
    for(const [sku,p] of Object.entries(data.products||{})){
      const a=p.attributes||{};
      const key=[p.productFamily||'',a.usagetype||'',a.operation||''].join('|');
      if(grouped.has(key))continue;
      const term=Object.values(data.terms?.OnDemand?.[sku]||{}).flatMap(t=>Object.values(t.priceDimensions||{}));
      grouped.set(key,{productFamily:p.productFamily,attributes:a,dimensions:term.map(d=>({unit:d.unit,description:d.description,rate:d.pricePerUnit?.USD,beginRange:d.beginRange,endRange:d.endRange}))});
    }
    for(const [key,val] of grouped)console.log('METER',code,key,JSON.stringify(val).slice(0,1500));
  }catch(e){console.error('OFFER_ERROR',code,e.message);}
}


const { readFileSync } = await import('node:fs');
const mappingIds=JSON.parse(readFileSync('services/elastic-load-balancing/service.json','utf8')).pricingMappings;
const mappingSet=mappingIds.map(id=>JSON.parse(readFileSync('services/elastic-load-balancing/pricing-mappings/'+id+'.json','utf8')));
for(const region of ['ap-northeast-1','ap-northeast-3','us-east-1','us-east-2','us-west-1','us-west-2']){
  const regionData={};
  for(const code of ['AWSELB','AmazonVPC']){
    const data=JSON.parse(await get('https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/'+code+'/current/'+region+'/index.json'));
    regionData[code]=data;
  }
  for(const mapping of mappingSet){
    const code=mapping.priceSource.serviceCode;
    const d=regionData[code];
    const matched=Object.values(d.products||{}).filter(p=>mapping.productMatchers.every(m=>{
      const value=m.field==='operation'?p.attributes?.operation:(m.field.startsWith('attributes.')?p.attributes?.[m.field.slice(11)]:p[m.field]);
      return m.op==='eq'?value===m.value:(m.op==='in'&&m.values?.includes(value));
    }));
    const withDimension=matched.filter(p=>Object.values(d.terms?.OnDemand?.[p.sku]||{}).some(t=>Object.values(t.priceDimensions||{}).some(dim=>mapping.dimensionMatchers.every(m=>m.op==='eq'&&dim[m.field]===m.value))));
    console.log('REGION_AUDIT',region,mapping.id,'products',matched.length,'billable',withDimension.length);
  }
}
