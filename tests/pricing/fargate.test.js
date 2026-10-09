import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPackages } from '../../tools/pricing-cli/package-loader.js';
import { calculate } from '../../src/pricing/calculation.js';
import { decimal } from '../../src/pricing/decimal.js';

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

test('Fargate monthly quantities use the common hours for every resource meter', async () => {
  const pkg = (await loadPackages()).find(item => item.service.id === 'fargate');
  const profile = {
    tasksPerDay: '3', averageDurationHours: '2', linuxVcpuPerTask: '0.25',
    linuxMemoryGbPerTask: '0.5', windowsVcpuPerTask: '1', windowsMemoryGbPerTask: '2', ephemeralStorageGb: '25'
  };
  const resource = {
    'linux-x86-vcpu': '0.25', 'linux-arm-vcpu': '0.25', 'windows-vcpu': '1', 'windows-os': '1',
    'linux-x86-memory': '0.5', 'linux-arm-memory': '0.5', 'windows-memory': '2',
    'linux-ephemeral-storage': '5', 'windows-ephemeral-storage': '5'
  };
  for (const hours of ['0', '24', '720', '730', '744']) {
    for (const [id, component] of Object.entries(pkg.components)) {
      const actual = calculate(component.calculation, { project: { hoursPerMonth: hours }, profile },
        { unit: component.calculation.outputUnit, pricePerUnit: { USD: '1' } });
      // Independently form resource-hours first, then convert the common monthly hours into days.
      const expected = decimal(resource[id]).times('3').times('2').times(hours).div('24');
      assert.ok(decimal(actual.billingQuantity).minus(expected).abs().lt('1e-74'), `${id} at ${hours} hours`);
    }
  }
});

test('Fargate applies each task minimum before multiplying the monthly task count', async () => {
  const pkg = (await loadPackages()).find(item => item.service.id === 'fargate');
  for (const [id, hours] of [['linux-x86-vcpu', '0.0166666666666667'], ['windows-vcpu', '0.0833333333333333']]) {
    const component = pkg.components[id];
    const actual = calculate(component.calculation,
      { project: { hoursPerMonth: '720' }, profile: { tasksPerDay: '2', averageDurationHours: '0.001', linuxVcpuPerTask: '1', windowsVcpuPerTask: '1' } },
      { unit: 'hours', pricePerUnit: { USD: '1' } });
    assert.ok(decimal(actual.billingQuantity).minus(decimal(hours).times('60')).abs().lt('1e-74'));
  }
});
