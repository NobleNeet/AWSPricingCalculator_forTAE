import test from 'node:test';
import assert from 'node:assert/strict';
import { fillDefinitionDefaults, detailStateKey } from '../../src/app/drawer-state-model.js';

test('fillDefinitionDefaults hydrates newly added profile and component defaults without overwriting saved values', () => {
  const pkg = {
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
      streaming: {
        defaultEnabled: true,
        selectors: [],
        usageInputs: [{ id: 'responseMb', default: '6' }]
      },
      snapstart: {
        defaultEnabled: false,
        selectors: [],
        usageInputs: []
      }
    }
  };
  const instance = {
    profileId: 'standard',
    selectors: { architecture: 'arm' },
    components: { streaming: { enabled: true, inputs: { responseMb: '12' } } }
  };

  assert.equal(fillDefinitionDefaults(pkg, instance), true);
  assert.deepEqual(instance.selectors, {
    architecture: 'arm',
    streamingRequestsPerMonth: '0',
    snapStartMode: 'disabled'
  });
  assert.equal(instance.components.streaming.inputs.responseMb, '12');
  assert.deepEqual(instance.components.snapstart, { enabled: false, inputs: {} });
  assert.equal(fillDefinitionDefaults(pkg, instance), false);
});

test('detailStateKey distinguishes profile and component details deterministically', () => {
  assert.equal(detailStateKey('Advanced', undefined, 0), 'profile:Advanced:0');
  assert.equal(detailStateKey('Advanced', 'Compute duration', 3), 'component:Compute duration:Advanced:3');
});
