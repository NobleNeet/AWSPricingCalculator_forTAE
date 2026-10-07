export function buildIndex(products, buildId, serviceCode, region) {
  const values = {};
  for (const product of products) {
    for (const [key, value] of Object.entries(product.attributes)) {
      (values[key] ??= new Set()).add(value);
    }
  }
  return {
    schemaVersion: 1,
    buildId,
    serviceCode,
    region,
    attributes: Object.fromEntries(
      Object.entries(values)
        .sort()
        .map(([key, entries]) => [
          key,
          [...entries].sort((a, b) => String(a).localeCompare(String(b), 'en', { numeric: true }))
        ])
    )
  };
}
