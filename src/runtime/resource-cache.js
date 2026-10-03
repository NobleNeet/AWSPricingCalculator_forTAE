export class ResourceCache {
  constructor(fetcher = fetch) { this.fetcher = fetcher; this.values = new Map(); this.pending = new Map(); this.status = new Map(); }
  load(key, loader) {
    if (this.values.has(key)) return Promise.resolve(this.values.get(key));
    if (this.pending.has(key)) return this.pending.get(key);
    this.status.set(key, { state: 'loading' });
    const promise = Promise.resolve().then(loader).then(value => {
      this.values.set(key, value); this.status.set(key, { state: 'ready' }); return value;
    }).catch(error => { this.status.set(key, { state: error.code === 'INVALID_DATA' ? 'invalid' : 'unavailable', message: error.message }); throw error; }).finally(() => this.pending.delete(key));
    this.pending.set(key, promise); return promise;
  }
  async json(url, validate = () => true, sha256) {
    const response = await this.fetcher(url, { cache: 'no-cache' });
    if (!response.ok) throw Error(`HTTP ${response.status}: ${url}`);
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { throw Object.assign(Error('Invalid JSON resource'), { code: 'INVALID_DATA' }); }
    if (sha256) {
      const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      const actual = [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, '0')).join('');
      if (actual !== sha256) throw Object.assign(Error('Resource checksum mismatch'), { code: 'INVALID_DATA' });
    }
    if (!validate(data)) throw Object.assign(Error(`Invalid resource: ${url}`), { code: 'INVALID_DATA' });
    return data;
  }
}
