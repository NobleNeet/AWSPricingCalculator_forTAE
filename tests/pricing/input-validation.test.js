import test from 'node:test';
import assert from 'node:assert/strict';
import { numberInputError } from '../../src/pricing/input-validation.js';
import { activeInputs } from '../../src/pricing/core.js';
import { readFile } from 'node:fs/promises';
const load = async path => JSON.parse(await readFile(new URL('../../'+path, import.meta.url), 'utf8'));
const input = (pkg,id) => [...(pkg.selectors??[]),...(pkg.usageInputs??[])].find(x=>x.id===id);
test('numeric validation rejects invalid restored values and handles decimal boundaries without clamping', () => {
  const i={id:'x',label:'x',type:'number',exclusiveMinimum:'0',maximum:'730'};
  for(const v of ['0','-1','730.0000000000000000000001','NaN','Infinity','']) assert.ok(numberInputError(i,v),v);
  for(const v of ['0.0000000000000000000001','0.5','730']) assert.equal(numberInputError(i,v),null,v);
  assert.throws(()=>activeInputs([i],{x:'0'},{},[],[]),e=>e.issue.code==='INVALID_INPUT');
  assert.deepEqual(activeInputs([i],{x:'0.5'},{},[],[]),{x:'0.5'});
  assert.equal(numberInputError({...i,integer:true},'1.5'),'x: 整数を入力してください。');
  assert.deepEqual(activeInputs([{...i,enabledWhen:{field:'profile.use',op:'eq',value:true}}],{x:'0'},{profile:{use:false}},[],[]),{});
});
test('resource counts reject zero/fractional values and DB hours preserve short valid use', async () => {
  for(const service of ['ec2','rds','aurora-postgresql']){
    const pkg=await load(`services/${service}/components/instance.json`),quantity=input(pkg,'quantity');
    for(const v of ['0','0.5','1.5'])assert.ok(numberInputError(quantity,v));
    assert.equal(numberInputError(quantity,'1'),null);
    const hours=input(pkg,'hours');assert.ok(numberInputError(hours,'1460'));assert.equal(numberInputError(hours,'0.5'),null);
    if(service!=='ec2')assert.ok(numberInputError(hours,'0'));
  }
});
test('zero duration is rejected while fractional usage and zero-volume disabled components remain supported', async () => {
  for(const [path,id,positive] of [
    ['services/fargate/profiles/standard.json','averageDurationHours','0.0001'],
    ['services/codebuild/components/build-minutes.json','averageBuildMinutes','0.5'],
    ['services/lambda/profiles/standard.json','averageDurationMs','1'],
    ['services/ebs/components/storage.json','gbMonths','0.1'],
    ['services/rds/components/storage.json','gbMonths','1']
  ]){const i=input(await load(path),id);assert.ok(numberInputError(i,'0'));assert.equal(numberInputError(i,positive),null);}
  const c=await load('services/aurora-postgresql/components/limitless-compute.json');assert.equal(input(c,'acuHours').default,'11680');assert.equal(numberInputError(input(c,'acuHours'),'1'),null);
  const monitoring=await load('services/aurora-postgresql/components/database-insights-limitless.json');
  assert.equal(numberInputError(input(monitoring,'monitoredAcus'),'1'),null);
  assert.equal(numberInputError(input(monitoring,'monitoredAcus'),'0'),null);
  const io=await load('services/aurora-postgresql/components/io-requests.json');assert.equal(numberInputError(input(io,'requests'),'1'),null);
});
