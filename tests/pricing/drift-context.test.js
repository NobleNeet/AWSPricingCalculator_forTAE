import test from 'node:test';
import assert from 'node:assert/strict';
import { packageWithDependencies, productMatcher, productsForCase } from '../../tools/pricing-cli/drift-context.js';
import { matches } from '../../src/pricing/filter.js';
import { evaluateService } from '../../src/pricing/core.js';
import { loadPackage, readJson } from '../../tools/pricing-cli/package-loader.js';
import { normalize } from '../../tools/pricing-cli/normalize.js';
import { defaults } from '../../tools/pricing-cli/semantics.js';

test('io2 tier drift evaluates its provisioned-IOPS parent and retains rate changes', async () => {
  const pkg = await loadPackage('services/ec2');
  const fixtureProducts = normalize(await readJson('tests/fixtures/aws/AmazonEC2.json'), 'ap-northeast-1').data.products;
  const products = [...fixtureProducts, ...['', '.tier2', '.tier3'].map((suffix, index) => ({
    sku: `io2-test-${index}`, serviceCode: 'AmazonEC2', usageType: `APN1-EBS:VolumeP-IOPS.io2${suffix}`,
    productFamily: 'Storage', attributes: { regionCode: 'ap-northeast-1' },
    terms: { onDemand: [{ priceDimensions: [{ unit: 'IOPS-Mo', beginRange: '0', endRange: 'Inf', pricePerUnit: { USD: ['0.074', '0.0518', '0.03626'][index] } }] }] }
  }))];
  const instance = defaults(pkg);
  instance.selectors.ebsVolumeType = 'io2';
  for (const id of ['ebs-io2-iops', 'ebs-io2-iops-tier2', 'ebs-io2-iops-tier3']) instance.components[id].enabled = true;
  instance.components['ebs-io2-iops'].inputs.provisionedIops = '80000';
  const project = { region: 'ap-northeast-1', hoursPerMonth: '730' };
  for (const [id, expected] of [['ebs-io2-iops-tier2', '1657.6'], ['ebs-io2-iops-tier3', '580.16']]) {
    const dependencyPackage = packageWithDependencies(pkg, instance.profileId, id);
    const scoped = productsForCase(dependencyPackage, instance, project, productMatcher(products));
    const result = evaluateService(dependencyPackage, instance, project, scoped.products, scoped.profileProducts);
    assert.equal(result.components[id].amountUsd, expected, JSON.stringify(result.issues));
    assert.ok(!result.issues.some(issue => issue.code === 'MISSING_USAGE'));
  }
});

test('drift retains transitive input and attribute dependencies in evaluation order', () => {
  const pkg = { profiles: { p: { components: ['a', 'unused', 'b', 'c'] } }, components: {
    a: {}, unused: {}, b: { source: { type: 'resolvedComponentAttribute', componentId: 'a' } },
    c: { nested: [{ type: 'resolvedComponentInput', componentId: 'b' }] }
  } };
  assert.deepEqual(packageWithDependencies(pkg, 'p', 'c').profiles.p.components, ['a', 'b', 'c']);
  assert.deepEqual(pkg.profiles.p.components, ['a', 'unused', 'b', 'c']);
  pkg.components.a = { source: { type: 'resolvedComponentInput', componentId: 'outside' } };
  assert.throws(() => packageWithDependencies(pkg, 'p', 'c'), /outside profile/);
});

test('indexed products preserve strict filter semantics and duplicate SKU candidates', () => {
  const products = [{ sku: 'a', attributes: { x: '1', y: 'A' } },
    { sku: 'b', attributes: { x: '2', y: 'A' } },
    { sku: 'b', attributes: { x: '2', y: 'B' } }, { sku: 'c', attributes: {} }];
  const select = productMatcher(products), context = { profile: { x: '2' } };
  for (const filters of [
    [{ field: 'attributes.x', op: 'eq', valueFrom: 'profile.x' }],
    [{ field: 'attributes.x', op: 'in', value: ['1', '2'] }, { field: 'attributes.y', op: 'neq', value: 'A' }],
    [{ field: 'attributes.x', op: 'notIn', value: ['1'] }],
    [{ field: 'attributes.x', op: 'exists' }], [{ field: 'attributes.x', op: 'notExists' }]
  ]) assert.deepEqual(select(filters, context), products.filter(product => matches(product, filters, context)));
  assert.equal(select([{ field: 'attributes.x', op: 'eq', valueFrom: 'component.missingDefault' }], context).length, 4);
});

test('drift capacity cases keep compute parents; missing and ambiguous parent SKUs still fail', async () => {
  const pkg = await loadPackage('services/rds');
  const products = normalize(await readJson('tests/fixtures/aws/AmazonRDS.json'), 'ap-northeast-1').data.products;
  const instance = structuredClone(pkg.golden[0]);
  instance.components.instance.inputs.quantity = '2';
  instance.components.storage = { enabled: true, inputs: { usageMode: 'capacity', capacityGb: '20', storageHours: '730' } };
  const project = { region: 'ap-northeast-1' };
  const dependencyPackage = packageWithDependencies(pkg, instance.profileId, 'storage');
  assert.ok(dependencyPackage.profiles[instance.profileId].components.includes('instance'));
  const evaluate = pool => {
    const scoped = productsForCase(dependencyPackage, instance, project, productMatcher(pool));
    return evaluateService(dependencyPackage, instance, project, scoped.products, scoped.profileProducts);
  };
  const expected = evaluateService(pkg, instance, project, products);
  const actual = evaluate(products);
  assert.equal(actual.components.storage.amountUsd, expected.components.storage.amountUsd);
  assert.equal(actual.components.storage.billingQuantity, '40');
  assert.ok(!actual.issues.some(issue => issue.code === 'MISSING_USAGE'));
  const parentSku = actual.components.instance.resolution.product.sku;
  const missing = evaluate(products.filter(product => product.sku !== parentSku));
  assert.equal(missing.amountUsd, null);
  assert.ok(missing.issues.some(issue => ['SKU_NOT_FOUND', 'MISSING_USAGE'].includes(issue.code)));
  const duplicate = structuredClone(products.find(product => product.sku === parentSku));
  duplicate.sku += '-duplicate';
  assert.ok(evaluate([...products, duplicate]).issues.some(issue => issue.code === 'AMBIGUOUS_SKU'));
  const changed = structuredClone(products);
  const storageSku = actual.components.storage.resolution.product.sku;
  for (const term of changed.find(product => product.sku === storageSku).terms.onDemand)
    for (const dimension of term.priceDimensions) dimension.pricePerUnit.USD = '1';
  assert.notEqual(evaluate(changed).components.storage.amountUsd, actual.components.storage.amountUsd);
});
