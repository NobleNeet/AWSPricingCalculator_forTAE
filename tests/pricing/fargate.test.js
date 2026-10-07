import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPackages } from '../../tools/pricing-cli/package-loader.js';

test('Fargate drawer definition follows the On-Demand resource contract', async () => {
  const pkg = (await loadPackages()).find(item => item.service.id === 'fargate');
  assert.ok(pkg);
  const profile = pkg.profiles.standard;
  assert.deepEqual(profile.selectors.find(x => x.id === 'operatingSystem').options.values, ['Linux', 'Windows']);
  assert.deepEqual(profile.selectors.find(x => x.id === 'cpuArchitecture').options.values, ['x86', 'ARM']);
  assert.deepEqual(profile.selectors.find(x => x.id === 'linuxVcpuPerTask').options.values, ['0.25', '0.5', '1', '2', '4', '8', '16', '32']);
  assert.deepEqual(profile.selectors.find(x => x.id === 'windowsVcpuPerTask').options.values, ['1', '2', '4']);
  assert.equal(profile.selectors.find(x => x.id === 'tasksPerDay').default, '1');
  assert.equal(profile.selectors.find(x => x.id === 'ephemeralStorageGb').default, '20');
  assert.equal(pkg.components['linux-x86-vcpu'].calculation.usage.sources[2].value.transforms[0].value, '0.0166666666666667');
  assert.equal(pkg.components['windows-vcpu'].calculation.usage.sources[2].value.transforms[0].value, '0.0833333333333333');
});
