import { checkSources } from './source.js';

const metadata = await checkSources({ serviceCodes: ['AmazonRDS', 'AmazonCloudWatch'], regions: ['ap-northeast-1'] });
for (const item of Object.values(metadata.sources)) {
  console.log('SOURCE', item.serviceCode, item.region, item.sourceUrl);
  const response = await fetch(item.sourceUrl, { signal: AbortSignal.timeout(360000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${item.sourceUrl}`);
  const raw = await response.json();
  const rows = [];
  for (const [sku, product] of Object.entries(raw.products)) {
    const a = product.attributes || {};
    const pf = product.productFamily || '';
    const kind = String(a.usagetype || '');
    const operation = String(a.operation || '');
    const isOracleStorage = item.serviceCode === 'AmazonRDS' && (a.databaseEngine === 'Oracle' || /RDS/i.test(kind)) && /storage|backup|snapshot|iops/i.test(pf + ' ' + kind + ' ' + (a.volumeType || '') + ' ' + operation);
    const isInsights = item.serviceCode === 'AmazonCloudWatch' && /DatabaseInsights|Database Insights/i.test(pf + ' ' + kind + ' ' + operation + ' ' + (a.group || ''));
    if (!isOracleStorage && !isInsights) continue;
    const terms = Object.values(raw.terms?.OnDemand?.[sku] ?? {});
    const dims = terms.flatMap(t => Object.values(t.priceDimensions || {}).map(d => ({unit:d.unit,usd:d.pricePerUnit?.USD,description:d.description?.slice(0,110)})));
    rows.push({sku,pf,operation,kind,engine:a.databaseEngine,edition:a.databaseEdition,volume:a.volumeType,deploy:a.deploymentOption,license:a.licenseModel,group:a.group,config:a.instanceConfigurationType,engineType:a.databaseEngineType,retention:a.retention,dims});
  }
  console.log('MATCHED', item.serviceCode, rows.length);
  const summary = new Map();
  for (const x of rows) {
    const key = [x.pf,x.operation,x.kind,x.engine,x.edition,x.volume,x.deploy,x.license,x.group,x.config,x.engineType,x.retention,JSON.stringify(x.dims.map(d=>[d.unit,d.usd]))].join('|');
    let g = summary.get(key);
    if(!g){g={...x,count:0};delete g.sku;summary.set(key,g)}
    g.count++;
  }
  for(const entry of [...summary.values()].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))) console.log('CANDIDATE', JSON.stringify(entry));
}
