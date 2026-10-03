// Small runtime subset of draft-07 used by this repository's centralized schemas.
// CI remains authoritative Ajv validation; this keeps native Browser ESM self-contained.
export function validateSchema(schema, value, root = schema, path = '') {
  if (schema === true) return [];
  if (schema === false) return [{ path, keyword: 'false', message: 'Value forbidden' }];
  if (schema.$ref) { const definition = schema.$ref.split('/').slice(1).reduce((node, key) => node[key], root); return validateSchema(definition, value, root, path); }
  const issues = [], add = (keyword, message) => issues.push({ path, keyword, message });
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (schema.const !== undefined && !same(schema.const, value)) add('const', 'Unexpected constant');
  if (schema.enum && !schema.enum.some(v => same(v, value))) add('enum', 'Unexpected value');
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const valid = types.some(type => type === 'null' ? value === null : type === 'array' ? Array.isArray(value) : type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value) : type === 'integer' ? Number.isInteger(value) : typeof value === type);
    if (!valid) { add('type', 'Wrong type'); return issues; }
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && [...value].length < schema.minLength) add('minLength', 'String too short');
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) add('pattern', 'Invalid format');
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) add('finite', 'Finite value required');
    if (schema.minimum !== undefined && value < schema.minimum) add('minimum', 'Value too small');
    if (schema.maximum !== undefined && value > schema.maximum) add('maximum', 'Value too large');
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) add('minItems', 'Array too short');
    if (schema.maxItems !== undefined && value.length > schema.maxItems) add('maxItems', 'Array too long');
    if (schema.uniqueItems && new Set(value.map(v => JSON.stringify(v))).size !== value.length) add('uniqueItems', 'Duplicate values');
    if (schema.items) value.forEach((v, i) => issues.push(...validateSchema(schema.items, v, root, `${path}/${i}`)));
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required ?? []) if (!Object.hasOwn(value, key)) add('required', `Missing ${key}`);
    for (const [key, v] of Object.entries(value)) {
      if (Object.hasOwn(schema.properties ?? {}, key)) issues.push(...validateSchema(schema.properties[key], v, root, `${path}/${key}`));
      else if (schema.additionalProperties === false) issues.push({ path: `${path}/${key}`, keyword: 'additionalProperties', message: 'Unknown field preserved' });
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') issues.push(...validateSchema(schema.additionalProperties, v, root, `${path}/${key}`));
    }
  }
  for (const child of schema.allOf ?? []) issues.push(...validateSchema(child, value, root, path));
  if (schema.anyOf && !schema.anyOf.some(child => !validateSchema(child, value, root, path).length)) add('anyOf', 'No valid alternative');
  if (schema.oneOf && schema.oneOf.filter(child => !validateSchema(child, value, root, path).length).length !== 1) add('oneOf', 'One valid alternative required');
  if (schema.not && !validateSchema(schema.not, value, root, path).length) add('not', 'Prohibited value');
  if (schema.if) { const branch = validateSchema(schema.if, value, root, path).length ? schema.else : schema.then; if (branch) issues.push(...validateSchema(branch, value, root, path)); }
  return issues;
}
