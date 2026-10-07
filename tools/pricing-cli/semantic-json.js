export function semanticStable(value) {
  if (Array.isArray(value)) return value.map(semanticStable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map(key => [key, semanticStable(value[key])])
    );
  }
  return value;
}

export const semanticEncode = value => `${JSON.stringify(semanticStable(value), null, 2)}\n`;
