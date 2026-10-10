import { checkSources } from './source.js';
import { normalize } from './normalize.js';
import { validatePriceData } from './semantics.js';
import { loadPackages, readJson } from './package-loader.js';

const metadata = await checkSources({ serviceCodes: ['AmazonRDS', 'AmazonCloudWatch'], regions: ['ap-northeast-1', 'ap-northeast-3', 'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2'] });
const candidateData = {};
for (const item of Object.values(metadata.sources)) {
  console.log('SOURCE', item.serviceCode, item.region, item.sourceUrl);
  const response = await fetch(item.sourceUrl, { signal: AbortSignal.timeout(360000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${item.sourceUrl}`);
  const raw = await response.json();
  candidateData[`${item.serviceCode}/${item.region}`] = normalize(raw, item.region, 'audit').data;
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
  const samples = rows.filter(x =>
    (item.serviceCode === 'AmazonRDS' && x.operation === 'CreateDBInstance:0005' &&
      ((x.pf === 'Database Storage' && x.volume === 'General Purpose' && x.deploy === 'Multi-AZ')
        || (x.pf === 'Storage Snapshot' && x.engine === 'Oracle')))
    || (item.serviceCode === 'AmazonCloudWatch' && x.operation === 'RDS-Oracle:Provisioned')
  );
  for (const sample of item.region === 'ap-northeast-1' ? samples : []) console.log('RAW_SAMPLE', JSON.stringify({
    code:item.serviceCode,
    product:raw.products[sample.sku],
    terms:raw.terms?.OnDemand?.[sample.sku] ?? {}
  }));

  const cardinalities = item.serviceCode === 'AmazonRDS'
    ? {
        gp2Single: rows.filter(x=>x.engine==='Oracle' && x.pf==='Database Storage' && x.operation==='CreateDBInstance:0005' && x.volume==='General Purpose' && x.deploy==='Single-AZ' && x.dims.some(d=>d.unit==='GB-Mo')).length,
        gp2Multi: rows.filter(x=>x.engine==='Oracle' && x.pf==='Database Storage' && x.operation==='CreateDBInstance:0005' && x.volume==='General Purpose' && x.deploy==='Multi-AZ' && x.dims.some(d=>d.unit==='GB-Mo')).length,
        gp3Single: rows.filter(x=>x.engine==='Oracle' && x.pf==='Database Storage' && x.operation==='CreateDBInstance:0005' && x.volume==='General Purpose-GP3' && x.deploy==='Single-AZ' && x.dims.some(d=>d.unit==='GB-Mo')).length,
        gp3Multi: rows.filter(x=>x.engine==='Oracle' && x.pf==='Database Storage' && x.operation==='CreateDBInstance:0005' && x.volume==='General Purpose-GP3' && x.deploy==='Multi-AZ' && x.dims.some(d=>d.unit==='GB-Mo')).length,
        backup: rows.filter(x=>x.engine==='Oracle' && x.pf==='Storage Snapshot' && x.operation==='CreateDBInstance:0005' && x.deploy==='Single-AZ' && x.dims.some(d=>d.unit==='GB-Mo')).length
      }
    : {
        insights: rows.filter(x=>x.pf==='CloudWatch Database Insights' && x.operation==='RDS-Oracle:Provisioned' && x.group==='CW-DatabaseInsights' && x.engineType==='RDS Oracle' && x.config==='Provisioned' && !x.retention && x.dims.some(d=>d.unit==='vCPU-Hours')).length
      };
  console.log('AUDIT_CARDINALITY', JSON.stringify({region:item.region,code:item.serviceCode,counts:cardinalities}));
  for(const [name,count] of Object.entries(cardinalities)) if(count!==1) throw new Error(`Mapping cardinality for ${name} in ${item.serviceCode}/${item.region}: ${count}`);
  console.log('MATCHED', item.serviceCode, rows.length);
  const summary = new Map();
  for (const x of rows) {
    const key = [x.pf,x.operation,x.kind,x.engine,x.edition,x.volume,x.deploy,x.license,x.group,x.config,x.engineType,x.retention,JSON.stringify(x.dims.map(d=>[d.unit,d.usd]))].join('|');
    let g = summary.get(key);
    if(!g){g={...x,count:0};delete g.sku;summary.set(key,g)}
    g.count++;
  }
  if (item.region !== 'ap-northeast-1') continue;
  for(const entry of [...summary.values()].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))) console.log('CANDIDATE', JSON.stringify(entry));
}

const pkg = (await loadPackages()).find(x => x.service.id === 'rds-oracle');
const common = await readJson('pricing/normalization/common.json');
const normalizers = {
  AmazonRDS: await readJson('pricing/normalization/services/AmazonRDS.json'),
  AmazonCloudWatch: await readJson('pricing/normalization/services/AmazonCloudWatch.json')
};
const semantic = validatePriceData([pkg], candidateData, common, normalizers);
console.log('SEMANTIC_RESULT', JSON.stringify({issues:semantic.issues.slice(0,25),issueCount:semantic.issues.length,coverage:semantic.coverage,branches:semantic.branches,resolutionCount:semantic.resolutions?.length}));
if (semantic.issues.length) throw new Error(`Oracle source semantic validation failed: ${semantic.issues.length} issues`);
