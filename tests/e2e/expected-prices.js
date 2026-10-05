import { readJson } from '../../tools/pricing-cli/package-loader.js';
import { verifyRawPrice } from '../../tools/pricing-cli/golden.js';
import { money, sum } from '../../src/pricing/decimal.js';

export const activeBuildId = (await readJson('pricing/generated/manifest.json')).activeBuildId;
export async function goldenAmount(service, goldenId, overrides = {}) {
  const golden = await readJson(`services/${service}/golden/${goldenId}.json`), definition = await readJson(`services/${service}/service.json`), raw = await readJson(`tests/fixtures/aws/${definition.priceSource.serviceCode}.json`);
  const amounts = Object.entries(golden.verification).map(([id, verification]) => verifyRawPrice(raw, { ...verification, quantity: overrides[id] ?? verification.quantity }).amountUsd);
  return { raw: sum(amounts).toString(), display: money(sum(amounts)) };
}
export const expected = {
  ec2: await goldenAmount('ec2', 'linux-small'),
  ec2Edited: await goldenAmount('ec2', 'linux-small', { instance: '100' }),
  s3: await goldenAmount('s3', 'standard'),
  lambda: await goldenAmount('lambda', 'x86', { requests: '0', duration: '0' }),
  ebs: await goldenAmount('ebs', 'gp3-extra', { storage: '100', iops: '0', throughput: '0' })
};
