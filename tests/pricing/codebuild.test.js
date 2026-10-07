import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPackages } from '../../tools/pricing-cli/package-loader.js';

test('CodeBuild drawer follows the supplied On-Demand EC2 calculator contract', async () => {
  const pkg = (await loadPackages()).find(item => item.service.id === 'codebuild');
  assert.ok(pkg);
  assert.equal(pkg.service.priceSource.serviceCode, 'CodeBuild');
  const profile = pkg.profiles['on-demand-ec2'];
  assert.equal(profile.selectors.find(x => x.id === 'operatingSystem').default, 'Linux');
  const component = pkg.components['build-minutes'];
  assert.equal(component.selectors.find(x => x.id === 'computeType').default, 'arm1.2xlarge');
  assert.deepEqual(component.selectors.find(x => x.id === 'durationUnit').options.values, ['minutes']);
  assert.equal(component.usageInputs.find(x => x.id === 'buildsPerMonth').default, '1');
  assert.equal(component.usageInputs.find(x => x.id === 'averageBuildMinutes').default, '10');
  assert.deepEqual(component.calculation.usage.sources[1].value.transforms, [{ type: 'rounding', mode: 'ceil' }]);
});
