import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const AWS_ORIGIN = 'https://pricing.us-east-1.amazonaws.com';
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
export async function checkSources(config, previous = {}, fetcher = fetch) {
  const sources = {};
  for (const serviceCode of config.serviceCodes) {
    const metadataUrl = `${AWS_ORIGIN}/offers/v1.0/aws/${serviceCode}/current/region_index.json`;
    const metadata = await fetchJson(metadataUrl, fetcher);
    const relative = metadata.regions?.[config.region]?.currentVersionUrl;
    if (!relative || !relative.startsWith(`/offers/v1.0/aws/${serviceCode}/`)) throw new Error(`Missing or invalid source ${serviceCode}/${config.region}`);
    const sourceUrl = `${AWS_ORIGIN}${relative}`;
    sources[serviceCode] = { serviceCode, region: config.region, sourceUrl, metadataUrl, publicationDate: metadata.publicationDate, version: relative.split('/')[5], changed: previous[serviceCode]?.sourceUrl !== sourceUrl };
  }
  return { schemaVersion: 1, status: Object.values(sources).some(s => s.changed) ? 'CHANGED' : 'NO_CHANGE', sources };
}
export async function downloadSources(metadata, directory, fetcher = fetch) {
  await mkdir(directory, { recursive: true });
  const files = [];
  for (const source of Object.values(metadata.sources)) {
    if (!source.changed) continue;
    const raw = await fetchJson(source.sourceUrl, fetcher);
    if (raw.offerCode !== source.serviceCode || raw.version !== source.version) throw new Error('AWS source/version mismatch');
    const file = path.join(directory, `${source.serviceCode}.json`);
    await writeFile(file, JSON.stringify(raw)); files.push(file);
  }
  return files;
}
