import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCoverage } from '../../tools/pricing-cli/inventory.js';

const json = async file => JSON.parse(await readFile(new URL(file, import.meta.url), 'utf8'));

test('SQL Server BYOM MirrorUsage added in November 2026 stays out of PostgreSQL estimates', async () => {
  for (const service of ['rds', 'aurora-postgresql']) {
    const coverage = await json(`../../services/${service}/coverage.json`);
    for (const instanceType of ['m8id.large', 'm8id.12xl', 'r8id.96xl']) for (const licenseModel of ['Bring your own media', 'License included']) {
      const categories = [{
        productFamily: 'Database Instance',
        operation: 'CreateDBInstance:0050',
        usageTypeClass: `MirrorUsage:db.${instanceType}`,
        unit: 'Hrs',
        discriminators: { databaseEngine: 'SQL Server', deploymentOption: 'Multi-AZ', licenseModel },
        shapeSignatures: ['[{"unit":"Hrs","allowance":false}]']
      }];
      const result = validateCoverage(categories, coverage);
      assert.deepEqual(result.issues, [], `${service} / ${instanceType} / ${licenseModel}`);
      assert.equal(result.summary.ignored, 1, `${service} / ${instanceType}`);
    }
  }
});

test('new unsupported S3 Vector and Table Migration meters have one explicit coverage classification', async () => {
  const coverage = await json('../../services/s3/coverage.json');
  for (const [operation, usageTypeClass, unit] of [
    ['', 'TableMigration-Sync-Objects', 'Objects'],
    ['QueryVectors', 'Vectors-Query-ProcessedBytes-Text', 'GB']
  ]) {
    const categories = [{ productFamily: '', operation, usageTypeClass, unit, discriminators: {}, shapeSignatures: [`[{"unit":"${unit}","allowance":false}]`] }];
    const result = validateCoverage(categories, coverage);
    assert.deepEqual(result.issues, [], usageTypeClass);
    assert.equal(result.summary.ignored, 1, usageTypeClass);
  }
});
