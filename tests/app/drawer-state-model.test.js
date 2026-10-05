import test from 'node:test';
import assert from 'node:assert/strict';
import { fillDefinitionDefaults, migrateDefinitionInputs, detailStateKey } from '../../src/app/drawer-state-model.js';

test('fillDefinitionDefaults hydrates newly added profile and component defaults without overwriting saved values', () => {
  const pkg = {
    service: { id: 'test' },
    profiles: {
      standard: {
        selectors: [
          { id: 'architecture', default: 'x86' },
          { id: 'streamingRequestsPerMonth', default: '0' },
          { id: 'snapStartMode', default: 'disabled' }
        ],
        components: ['streaming', 'snapstart']
      }
    },
    components: {
      streaming: { defaultEnabled: true, selectors: [], usageInputs: [{ id: 'responseMb', default: '6' }] },
      snapstart: { defaultEnabled: false, selectors: [], usageInputs: [] }
    }
  };
  const instance = {
    profileId: 'standard',
    selectors: { architecture: 'arm' },
    components: { streaming: { enabled: true, inputs: { responseMb: '12' } } }
  };

  assert.equal(fillDefinitionDefaults(pkg, instance), true);
  assert.deepEqual(instance.selectors, { architecture: 'arm', streamingRequestsPerMonth: '0', snapStartMode: 'disabled' });
  assert.equal(instance.components.streaming.inputs.responseMb, '12');
  assert.deepEqual(instance.components.snapstart, { enabled: false, inputs: {} });
  assert.equal(fillDefinitionDefaults(pkg, instance), false);
});

test('legacy Lambda additional ephemeral storage migrates to AWS total-storage input', () => {
  const pkg = {
    service: { id: 'lambda' },
    profiles: { standard: { selectors: [{ id: 'ephemeralStorageMb', default: '512' }], components: [] } },
    components: {}
  };
  const instance = { profileId: 'standard', selectors: { additionalStorageMb: '512' }, components: {} };
  assert.equal(migrateDefinitionInputs(pkg, instance), true);
  assert.deepEqual(instance.selectors, { ephemeralStorageMb: '1024' });
  assert.equal(migrateDefinitionInputs(pkg, instance), false);
});

test('legacy EC2 embedded EBS volume type migrates to profile selector', () => {
  const pkg = {
    service: { id: 'ec2' },
    profiles: { standard: { selectors: [{ id: 'ebsVolumeType', default: 'gp3' }], components: ['ebs'] } },
    components: { ebs: { selectors: [], usageInputs: [{ id: 'storageGb', default: '30' }] } }
  };
  const instance = {
    profileId: 'standard',
    selectors: {},
    components: { ebs: { enabled: true, inputs: { volumeType: 'st1', storageGb: '200' } } }
  };
  assert.equal(fillDefinitionDefaults(pkg, instance), true);
  assert.equal(instance.selectors.ebsVolumeType, 'st1');
  assert.deepEqual(instance.components.ebs, { enabled: true, inputs: { storageGb: '200' } });
  assert.equal(fillDefinitionDefaults(pkg, instance), false);
});

test('disabled legacy EC2 EBS migrates to none without leaving component disabled', () => {
  const pkg = {
    service: { id: 'ec2' },
    profiles: { standard: { selectors: [{ id: 'ebsVolumeType', default: 'gp3' }], components: ['ebs'] } },
    components: { ebs: { selectors: [], usageInputs: [{ id: 'storageGb', default: '30' }] } }
  };
  const instance = {
    profileId: 'standard',
    selectors: {},
    components: { ebs: { enabled: false, inputs: { volumeType: 'gp3', storageGb: '30' } } }
  };
  assert.equal(fillDefinitionDefaults(pkg, instance), true);
  assert.equal(instance.selectors.ebsVolumeType, 'none');
  assert.equal(instance.components.ebs.enabled, true);
  assert.equal(instance.components.ebs.inputs.volumeType, undefined);
});

test('detailStateKey distinguishes profile and component details deterministically', () => {
  assert.equal(detailStateKey('Advanced', undefined, 0), 'profile:Advanced:0');
  assert.equal(detailStateKey('Advanced', 'Compute duration', 3), 'component:Compute duration:Advanced:3');
});
