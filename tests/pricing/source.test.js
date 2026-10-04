import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSources, sourceKey } from '../../tools/pricing-cli/source.js';

test('checkSources expands every service across configured regions and preserves unchanged entries', async () => {
  const fetcher = async url => ({
    ok: true,
    json: async () => ({
      publicationDate: '2026-10-01T00:00:00Z',
      regions: {
        'ap-northeast-1': { currentVersionUrl: '/offers/v1.0/aws/Example/20261001000000/ap-northeast-1/index.json' },
        'us-east-1': { currentVersionUrl: '/offers/v1.0/aws/Example/20261001000000/us-east-1/index.json' }
      }
    })
  });
  const tokyoKey = sourceKey('Example', 'ap-northeast-1');
  const previous = { [tokyoKey]: { sourceUrl: 'https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/Example/20261001000000/ap-northeast-1/index.json' } };
  const result = await checkSources({ serviceCodes: ['Example'], regions: ['ap-northeast-1', 'us-east-1'] }, previous, fetcher);
  assert.deepEqual(Object.keys(result.sources).sort(), ['Example/ap-northeast-1', 'Example/us-east-1']);
  assert.equal(result.sources[tokyoKey].changed, false);
  assert.equal(result.sources['Example/us-east-1'].changed, true);
  assert.equal(result.status, 'CHANGED');
});

test('legacy single region configuration remains accepted', async () => {
  const fetcher = async () => ({ ok: true, json: async () => ({ publicationDate: '2026-10-01T00:00:00Z', regions: { 'ap-northeast-1': { currentVersionUrl: '/offers/v1.0/aws/Example/20261001000000/ap-northeast-1/index.json' } } }) });
  const result = await checkSources({ serviceCodes: ['Example'], region: 'ap-northeast-1' }, {}, fetcher);
  assert.equal(result.sources['Example/ap-northeast-1'].region, 'ap-northeast-1');
});
