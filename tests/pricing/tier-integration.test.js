import test from 'node:test';
import assert from 'node:assert/strict';
import { tierAmount } from '../../src/pricing/tiers.js';
import { calculate } from '../../src/pricing/calculation.js';
import { applyPlanBilling } from '../../src/pricing/plan-billing.js';
import { loadPackages, readJson } from '../../tools/pricing-cli/package-loader.js';
import { normalize } from '../../tools/pricing-cli/normalize.js';
import { evaluateService } from '../../src/pricing/core.js';
import { decimal, sum } from '../../src/pricing/decimal.js';

const dimensions = [['0', '51200', '.025'], ['51200', '512000', '.024'], ['512000', 'Inf', '.023']].map(([beginRange, endRange, price]) => ({ beginRange, endRange, unit: 'GB-Mo', pricePerUnit: { USD: price } }));

test('tier boundaries integrate only each paid range without intermediate rounding', () => {
  for (const [quantity, expected] of [['0','0'], ['51199','1279.975'], ['51200','1280'], ['51201','1280.024'], ['512000','12339.2'], ['512001','12339.223']]) assert.equal(tierAmount(quantity, dimensions).toString(), expected);
  assert.equal(tierAmount('2', dimensions, '51199').toString(), '.049'.replace(/^\./,'0.'));
  assert.throws(() => tierAmount('1', [dimensions[0], dimensions[2]]), /Invalid paid tier/);
  // Removing a free dimension must not accidentally grant an allowance.
  assert.equal(tierAmount('2', [{...dimensions[0], beginRange:'100', endRange:'Inf'}]).toString(), '0.05');
});

test('S3 rows share a Plan/Region tier and other Plans or Regions are independent', () => {
  const result = quantity => ({state:'ready',amountUsd:tierAmount(quantity, dimensions).toString(),issues:[],components:{storage:{billingQuantity:quantity,amountUsd:tierAmount(quantity,dimensions).toString(),billingGroup:{id:'storage',scope:'plan-region',policy:'tiered'},resolution:{product:{sku:'s3'},dimensions}}}});
  const entries=[{id:'a',planId:'p',region:'Tokyo',result:result('30000')},{id:'b',planId:'p',region:'Tokyo',result:result('30000')},{id:'c',planId:'q',region:'Tokyo',result:result('30000')},{id:'d',planId:'p',region:'Osaka',result:result('30000')}];
  const output=applyPlanBilling(entries);
  assert.equal(output.get('a').amountUsd,'750'); assert.equal(output.get('b').amountUsd,'741.2');
  assert.equal(output.get('c').amountUsd,'750'); assert.equal(output.get('d').amountUsd,'750');
  assert.equal(entries[1].result.amountUsd,'750');
  assert.equal(sum([output.get('a').amountUsd,output.get('b').amountUsd]).toString(),tierAmount('60000',dimensions).toString());
});

test('io2 uses three actual AWS SKUs; apply per-volume boundaries before duration and count', async () => {
  const pkg=(await loadPackages()).find(p=>p.service.id==='ec2');
  const base=await readJson('tests/fixtures/aws/AmazonEC2.json'),extra=await readJson('tests/fixtures/aws/AmazonEC2.supplement.json');
  const raw={...base,products:{...base.products,...extra.products},terms:{OnDemand:{...base.terms.OnDemand,...extra.terms.OnDemand}}};
  const data=normalize(raw,'ap-northeast-1').data.products;
  const golden=structuredClone(pkg.golden[0]); golden.selectors.ebsVolumeType='io2';
  for (const iops of ['31999','32000','32001','63999','64000','64001','80000','256000']) {
    golden.components['ebs-io2-iops']={inputs:{provisionedIops:iops,volumeCount:'2',volumeHours:'365'}};
    const result=evaluateService(pkg,golden,{region:'ap-northeast-1'},data);
    assert.notEqual(result.amountUsd,null,JSON.stringify(result.issues));
    // Independent published-SKU oracle: explicit per-band rates, no core integration.
    const n=decimal(iops),a=n.gt('32000')?decimal('32000'):n,b=n.minus('32000').gt('0')?(n.gt('64000')?decimal('32000'):n.minus('32000')):decimal('0'),c=n.gt('64000')?n.minus('64000'):decimal('0');
    const actual=sum(['ebs-io2-iops','ebs-io2-iops-tier2','ebs-io2-iops-tier3'].map(id=>result.components[id].amountUsd));
    assert.equal(actual.toString(),a.times('.074').plus(b.times('.0518')).plus(c.times('.03626')).toString());
  }
});

test('time division keeps full decimal precision and invalid divisors fail closed',()=>{
  const calculation={model:'unit',usage:{combine:'multiply',sources:[{value:{type:'transformed',valueFrom:'component.hours',transforms:[{type:'divide',divisor:'730'}]}}]},transforms:[],outputUnit:'GB-Mo'};
  const result=calculate(calculation,{component:{hours:'1'}},dimensions[0]);
  assert.equal(result.amountUsd,decimal('1').div('730').times('.025').toString());
  calculation.usage.sources[0].value.transforms[0].divisor='0';
  assert.throws(()=>calculate(calculation,{component:{hours:'1'}},dimensions[0]),/Divisor must be positive/);
});
