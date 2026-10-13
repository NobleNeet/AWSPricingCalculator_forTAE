#!/usr/bin/env node
// Focused audit of published EC2/CloudWatch pricing-meters, without an EC2-wide semantic rebuild.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.cwd();
const manifest = JSON.parse(await readFile(path.join(base, 'pricing/generated/manifest.json'), 'utf8'));
const buildId = process.argv[2] ?? manifest.activeBuildId;
const regions = (process.argv[3] ?? 'ap-northeast-1').split(',');
const source = async (code, region) => {
  try {
    const file = path.join(base, 'pricing/generated/builds', buildId, 'indexes', code, region, 'index.json');
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
};
const has = (index, fragment) => {
  if (!index) return false;
  return Object.values(index.attributes?.usagetype ?? [])
    .some(value => typeof value === 'string' && value.includes(fragment));
};
let gaps = 0;
for (const region of regions) {
  const [transfer, cw] = await Promise.all([source('AWSDataTransfer', region), source('AmazonCloudWatch', region)]);
  const rows = [
    { meter: 'EC2 detailed monitoring', code: 'AmazonCloudWatch', present: has(cw, 'MetricMonitorUsage') },
    { meter: 'EC2 internet outbound', code: 'AWSDataTransfer', present: has(transfer, 'DataTransfer-Out-Bytes') },
    { meter: 'EC2 regional transfer', code: 'AWSDataTransfer', present: has(transfer, 'DataTransfer-Regional-Bytes') },
    { meter: 'EC2 interregion outbound', code: 'AWSDataTransfer', present: has(transfer, 'AWS-Out-Bytes') }
  ];
  for (const row of rows) {
    if (!row.present) gaps++;
    process.stdout.write(JSON.stringify({ buildId, region, ...row, status: row.present ? 'INDEXED' : 'MISSING' }) + '\n');
  }
}
if (gaps) {
  console.error('Price DB is not ready for priced EC2 monitoring/transfer parity: ' + gaps + ' missing meter categories.');
  process.exitCode = 1;
}
