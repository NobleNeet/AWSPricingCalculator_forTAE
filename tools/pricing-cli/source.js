import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const AWS_ORIGIN = 'https://pricing.us-east-1.amazonaws.com';
export const DOWNLOAD_CONCURRENCY = 4;
export const sourceKey = (serviceCode, region) => `${serviceCode}/${region}`;
export const configuredRegions = config => {
  const regions = Array.isArray(config.regions) ? config.regions : config.region ? [config.region] : [];
  if (!regions.length) throw new Error('At least one pricing region is required.');
  return [...new Set(regions)];
};
export async function fetchJson(url, fetcher = fetch) {
  let last;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetcher(url, { signal: AbortSignal.timeout(180000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
      return await response.json();
    } catch (error) { last = error; }
  }
  throw last;
}
function previousSource(previous, serviceCode, region) {
  return previous[sourceKey(serviceCode, region)] ?? (previous[serviceCode]?.region === region ? previous[serviceCode] : undefined);
}
export async function checkSources(config, previous = {}, fetcher = fetch) {
  const sources = {};
  const regions = configuredRegions(config);
  for (const serviceCode of config.serviceCodes) {
    const metadataUrl = `${AWS_ORIGIN}/offers/v1.0/aws/${serviceCode}/current/region_index.json`;
    const metadata = await fetchJson(metadataUrl, fetcher);
    for (const region of regions) {
      const relative = metadata.regions?.[region]?.currentVersionUrl;
      if (!relative || !relative.startsWith(`/offers/v1.0/aws/${serviceCode}/`)) throw new Error(`Missing or invalid source ${serviceCode}/${region}`);
      const sourceUrl = `${AWS_ORIGIN}${relative}`;
      const key = sourceKey(serviceCode, region);
      sources[key] = { serviceCode, region, sourceUrl, metadataUrl, publicationDate: metadata.publicationDate, version: relative.split('/')[5], changed: previousSource(previous, serviceCode, region)?.sourceUrl !== sourceUrl };
    }
  }
  return { schemaVersion: 1, status: Object.values(sources).some(s => s.changed) ? 'CHANGED' : 'NO_CHANGE', sources };
}
export async function downloadSources(metadata, directory, fetcher = fetch, concurrency = DOWNLOAD_CONCURRENCY) {
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new TypeError('Download concurrency must be a positive integer.');
  await mkdir(directory, { recursive: true });
  const changed = Object.values(metadata.sources).filter(source => source.changed);
  const files = new Array(changed.length);
  let next = 0;
  const worker = async () => {
    while (true) {
      const index = next++;
      if (index >= changed.length) return;
      const source = changed[index];
      const raw = await fetchJson(source.sourceUrl, fetcher);
      if (raw.offerCode !== source.serviceCode || raw.version !== source.version) throw new Error('AWS source/version mismatch');
      const file = path.join(directory, source.serviceCode, `${source.region}.json`);
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, JSON.stringify(raw));
      files[index] = file;
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, changed.length) }, () => worker()));
  return files;
}
