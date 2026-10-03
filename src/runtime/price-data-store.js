import { ResourceCache } from './resource-cache.js';

const safeId = value => typeof value === 'string' && /^[a-zA-Z0-9-]+$/.test(value);
const safePath = value => typeof value === 'string' && /^(sources|indexes)\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+\/(products|index)\.json$/.test(value);
export class PriceDataStore {
  constructor({ base = './pricing/generated', fetcher = fetch } = {}) {
    this.base = base; this.cache = new ResourceCache(fetcher); this.buildId = null; this.stale = false;
  }
  initialize() {
    return this.cache.load('build-manifest', async () => {
      if (!this.buildId) {
        const manifest = await this.cache.json(`${this.base}/manifest.json`, data => data.schemaVersion === 1 && safeId(data.activeBuildId) && typeof data.publicationDate === 'string');
        this.buildId = manifest.activeBuildId;
      }
      const manifest = await this.cache.json(`${this.base}/builds/${this.buildId}/build-manifest.json`, data => data.schemaVersion === 1 && data.buildId === this.buildId && data.currency === 'USD' && typeof data.publicationDate === 'string' && data.sources && Object.values(data.sources).every(regions => Object.values(regions).every(source => safePath(source.productsPath) && safePath(source.indexPath))));
      this.publicationDate = manifest.publicationDate;
      return manifest;
    });
  }
  async resource(serviceCode, region, kind) {
    const manifest = await this.initialize();
    const source = manifest.sources[serviceCode]?.[region];
    if (!source) throw Object.assign(Error(`Unsupported Price Data: ${serviceCode}/${region}`), { code: 'INVALID_DATA' });
    const key = `${this.buildId}/${serviceCode}/${region}/${kind}`;
    return this.cache.load(key, () => this.cache.json(`${this.base}/builds/${this.buildId}/${source[`${kind}Path`]}`, data => data.schemaVersion === 1 && data.buildId === this.buildId && data.serviceCode === serviceCode && data.region === region && (kind === 'products' ? Array.isArray(data.products) && data.products.every(p => typeof p.sku === 'string' && p.attributes && p.terms?.onDemand?.length === 1) : data.attributes && typeof data.attributes === 'object'), source[`${kind}Sha256`]));
  }
  products(code, region) { return this.resource(code, region, 'products'); }
  index(code, region) { return this.resource(code, region, 'index'); }
  async checkLatest() {
    try {
      const latest = await this.cache.json(`${this.base}/manifest.json`, data => data.schemaVersion === 1 && safeId(data.activeBuildId));
      this.stale = latest.activeBuildId !== this.buildId;
    } catch { this.stale = this.cache.values.has('build-manifest'); }
    return this.stale;
  }
  state(code, region, kind = 'products') { return this.cache.status.get(`${this.buildId}/${code}/${region}/${kind}`) ?? { state: 'loading' }; }
}
