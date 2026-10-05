import { readJson } from '../../tools/pricing-cli/package-loader.js';
import { verifyRawPrice } from '../../tools/pricing-cli/golden.js';
import { money, sum } from '../../src/pricing/decimal.js';

export const activeBuildId = (await readJson('pricing/generated/manifest.json')).activeBuildId;

function verificationAmounts(raw, verificationById, overrides) {
  const amounts = [];
  for (const [id, verification] of Object.entries(verificationById)) {
    if (verification.meters) {
      for (const [meterId, meter] of Object.entries(verification.meters)) {
        const key = `${id}.${meterId}`;
        amounts.push(verifyRawPrice(raw, { ...meter, quantity: overrides[key] ?? meter.quantity }).amountUsd);
      }
      continue;
    }
    amounts.push(verifyRawPrice(raw, { ...verification, quantity: overrides[id] ?? verification.quantity }).amountUsd);
  }
  return amounts;
}

export async function goldenAmount(service, goldenId, overrides = {}) {
  const golden = await readJson(`services/${service}/golden/${goldenId}.json`), definition = await readJson(`services/${service}/service.json`), raw = await readJson(`tests/fixtures/aws/${definition.priceSource.serviceCode}.json`);
  const amounts = verificationAmounts(raw, golden.verification, overrides);
  return { raw: sum(amounts).toString(), display: money(sum(amounts)) };
}
export const expected = {
  ec2: await goldenAmount('ec2', 'linux-small'),
  ec2Edited: await goldenAmount('ec2', 'linux-small', { instance: '100' }),
  s3: await goldenAmount('s3', 'standard'),
  lambda: await goldenAmount('lambda', 'x86'),
  ebs: await goldenAmount('ebs', 'gp3-extra', { storage: '100', iops: '0', throughput: '0' })
};
