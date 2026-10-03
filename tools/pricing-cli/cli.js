#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { loadPackages } from './package-loader.js';
import { validateDefinitions } from './validate-definitions.js';
import { report } from './report.js';
import { issue } from '../../src/pricing/issues.js';

const commands = ['validate-definitions', 'validate-price-data', 'run-golden', 'normalize', 'inventory', 'classify-change', 'build', 'check-source', 'download'];
export async function run(command, options = {}) {
  if (!commands.includes(command)) throw new Error(`Unknown command: ${command}`);
  if (command === 'validate-definitions') return report(command, await validateDefinitions(await loadPackages(options.services ?? 'services')));
  return report(command, [issue('NOT_IMPLEMENTED', `${command} is not implemented.`)]);
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    const { positionals, values } = parseArgs({ allowPositionals: true, options: Object.fromEntries(['services', 'input', 'output', 'previous', 'build-id', 'raw', 'region'].map(key => [key, { type: 'string' }])) });
    const result = await run(positionals[0], values);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.summary.error ? 1 : 0;
  } catch (error) {
    process.stdout.write(`${JSON.stringify(report(process.argv[2], [issue('TOOL_FAILURE', error.message)]), null, 2)}\n`);
    process.exitCode = 2;
  }
}
