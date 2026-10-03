import { ResourceCache } from './resource-cache.js';

const validId = value => typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value);
export class DefinitionStore {
  constructor({ base = './services', fetcher = fetch } = {}) { this.base = base; this.cache = new ResourceCache(fetcher); }
  catalog() {
    return this.cache.load('catalog', () => this.cache.json(`${this.base}/catalog.json`, data => data.schemaVersion === 1 && Array.isArray(data.services) && data.services.every(service => validId(service.id) && typeof service.label === 'string' && typeof service.serviceCode === 'string')));
  }
  package(serviceId) {
    if (!validId(serviceId)) return Promise.reject(Object.assign(Error('Invalid service ID'), { code: 'INVALID_DATA' }));
    return this.cache.load(serviceId, async () => {
      const service = await this.cache.json(`${this.base}/${serviceId}/service.json`, data => data.schemaVersion === 1 && data.id === serviceId && Array.isArray(data.profiles) && data.profiles.every(validId) && data.profiles.includes(data.defaultProfile) && data.priceSource?.serviceCode);
      const pkg = { service, profiles: {}, components: {} };
      await Promise.all(service.profiles.map(async id => {
        const profile = await this.cache.json(`${this.base}/${serviceId}/profiles/${id}.json`, data => data.schemaVersion === 1 && data.id === id && Array.isArray(data.components) && data.components.every(validId) && Array.isArray(data.selectors) && Array.isArray(data.fixedFilters));
        pkg.profiles[id] = profile;
      }));
      const componentIds = [...new Set(Object.values(pkg.profiles).flatMap(p => p.components))];
      await Promise.all(componentIds.map(async id => {
        pkg.components[id] = await this.cache.json(`${this.base}/${serviceId}/components/${id}.json`, data => data.schemaVersion === 1 && data.id === id && data.priceQuery?.expect === 'singleSku' && data.calculation?.model === 'unit' && Array.isArray(data.selectors) && Array.isArray(data.usageInputs) && Array.isArray(data.limitations));
      }));
      return pkg;
    });
  }
}
