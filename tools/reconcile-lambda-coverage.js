import { readFile, writeFile } from 'node:fs/promises';

const path = 'services/lambda/coverage.json';
const coverage = JSON.parse(await readFile(path, 'utf8'));

const mappings = new Map([
  ['Request', 'requests'],
  ['Lambda-GB-Second', 'duration'],
  ['Lambda-GB-Second-ARM', 'duration'],
  ['Lambda-Storage-GB-Second', 'ephemeral-storage-x86'],
  ['Lambda-Storage-GB-Second-ARM', 'ephemeral-storage-arm'],
  ['Lambda-Provisioned-Concurrency', 'provisioned-capacity-x86'],
  ['Lambda-Provisioned-Concurrency-ARM', 'provisioned-capacity-arm'],
  ['Lambda-Provisioned-GB-Second', 'provisioned-duration-x86'],
  ['Lambda-Provisioned-GB-Second-ARM', 'provisioned-duration-arm'],
  ['Lambda-SnapStart-Cached-GB-S', 'snapstart-cache'],
  ['Lambda-SnapStart-Restored-GB', 'snapstart-restore'],
  ['Lambda-Streaming-Response-Processed-Bytes', 'response-streaming-x86'],
  ['Lambda-Streaming-Response-Processed-Bytes-ARM', 'response-streaming-arm']
]);

const seen = new Map([...mappings.keys()].map(key => [key, 0]));
for (const category of coverage.categories) {
  const usageType = category.filters.find(filter => filter.field === 'usageTypeClass' && filter.op === 'eq')?.value;
  if (!mappings.has(usageType)) continue;
  seen.set(usageType, seen.get(usageType) + 1);
  category.status = 'mapped';
  category.componentId = mappings.get(usageType);
  delete category.reason;
  delete category.limitationId;
}

const invalid = [...seen].filter(([, count]) => count !== 1);
if (invalid.length) {
  throw new Error(`Expected exactly one coverage rule for each implemented Lambda meter: ${JSON.stringify(invalid)}`);
}

await writeFile(path, `${JSON.stringify(coverage, null, 2)}\n`);
console.log(`Mapped ${mappings.size} implemented Lambda pricing categories.`);
