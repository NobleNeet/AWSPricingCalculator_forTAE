import Ajv from 'ajv';
import { readFile } from 'node:fs/promises';

export async function schemaValidator(name) {
  const schema = JSON.parse(await readFile(new URL(`../schemas/${name}.schema.json`, import.meta.url), 'utf8'));
  return new Ajv({ allErrors: true, strict: true, strictRequired: false }).compile(schema);
}
