import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPackages, readJson } from '../../tools/pricing-cli/package-loader.js';
import { normalize } from '../../tools/pricing-cli/normalize.js';
import { evaluateService } from '../../src/pricing/core.js';

const pkg=(await loadPackages()).find(p=>p.service.id==='redshift');
const regions=['ap-northeast-1','ap-northeast-3','us-east-1','us-east-2','us-west-1','us-west-2'];

for (const region of regions) {
 test('Redshift on-demand mapping is unambiguous in '+region, async () => {
  const name = region === 'ap-northeast-1' ? 'tests/fixtures/aws/AmazonRedshift.json' : 'tests/fixtures/aws/AmazonRedshift.'+region+'.json';
  const raw = await readJson(name);
  const products=normalize(raw,region).data.products;
  const base={region,hoursPerMonth:'730'};
  const provisioned=structuredClone(pkg.golden.find(x=>x.id==='tokyo-redshift-provisioned'));
  const result=evaluateService(pkg,provisioned,base,products);
  assert.notEqual(result.amountUsd,null,JSON.stringify(result.issues));
  assert.equal(result.components['node-compute'].billingQuantity,'730');
  assert.equal(result.components['node-compute'].resolution.product.attributes.instanceType,'dc2.8xlarge');
  const serverless=structuredClone(pkg.golden.find(x=>x.id==='tokyo-redshift-serverless'));
  const s=evaluateService(pkg,serverless,base,products);
  assert.notEqual(s.amountUsd,null,JSON.stringify(s.issues));
  assert.equal(s.components['serverless-compute'].billingQuantity,'3904');
  assert.match(s.components['serverless-compute'].resolution.product.attributes.usagetype,/Redshift:ServerlessUsage$/);
  const rg=structuredClone(provisioned);
  rg.selectors.instanceType='rg.large';
  rg.components['backup-rg']={enabled:true,inputs:{backupGb:'10'}};
  rg.components['rms-provisioned']={enabled:true,inputs:{managedGb:'10'}};
  const r=evaluateService(pkg,rg,base,products);
  assert.notEqual(r.amountUsd,null,JSON.stringify(r.issues));
  assert.equal(r.components['backup-rg'].billingQuantity,'10');
  assert.equal(r.components['backup-tiered'].state,'disabled');
 });
}
