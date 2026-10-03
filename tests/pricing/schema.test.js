import test from 'node:test';
import assert from 'node:assert/strict';
import { schemaValidator } from '../../tools/schema.js';

test('central schemas load and reject unknown fields / executable query', async () => {
  for (const name of ['service', 'profile', 'component']) assert.equal(typeof await schemaValidator(`service-definition/${name}`), 'function');
  const validate = await schemaValidator('service-definition/service');
  const service = { schemaVersion: 1, id: 'example', label: 'Example', priceSource: { serviceCode: 'Example' }, profiles: ['standard'], defaultProfile: 'standard' };
  assert.equal(validate(service), true);
  assert.equal(validate({ ...service, price: '1' }), false);
});
