import { loadProductsForSkus, loadProductsMatching } from './product-chunks.js';

export async function loadCandidateForPublish(directory, metadata, publishSkus = {}) {
  const data = {};
  for (const [key, source] of Object.entries(metadata.sources ?? {})) {
    if (Object.hasOwn(publishSkus, key)) {
      data[key] = await loadProductsForSkus(directory, source, publishSkus[key]);
      continue;
    }
    // A scoped validation run produces SKU selections only for sources it actually
    // revalidated. Sources outside that scope are already validated in the active
    // build and must be carried forward, not interpreted as an empty SKU set.
    data[key] = (await loadProductsMatching(directory, source)).data;
  }
  return { metadata, data };
}
