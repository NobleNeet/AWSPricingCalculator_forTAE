import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SERVICES_DIR = 'services';
const CATALOG_PATH = join(SERVICES_DIR, 'catalog.json');

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function loadExistingCatalog() {
  try {
    return await readJson(CATALOG_PATH);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { schemaVersion: 1, services: [] };
    }
    throw error;
  }
}

async function loadServiceDefinitions() {
  const entries = await readdir(SERVICES_DIR, { withFileTypes: true });
  const services = new Map();

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const servicePath = join(SERVICES_DIR, entry.name, 'service.json');
    let definition;
    try {
      definition = await readJson(servicePath);
    } catch (error) {
      if (error?.code === 'ENOENT') continue;
      throw new Error(`Failed to read ${servicePath}: ${error.message}`);
    }

    const serviceCode = definition?.priceSource?.serviceCode;
    if (!definition?.id || !definition?.label || !Array.isArray(definition?.profiles) || !serviceCode) {
      throw new Error(
        `${servicePath} must define id, label, profiles[], and priceSource.serviceCode`,
      );
    }
    if (definition.id !== entry.name) {
      throw new Error(`${servicePath}: id ${definition.id} must match directory ${entry.name}`);
    }
    if (services.has(definition.id)) {
      throw new Error(`Duplicate service id: ${definition.id}`);
    }

    services.set(definition.id, {
      available: true,
      id: definition.id,
      label: definition.label,
      profiles: definition.profiles,
      serviceCode,
    });
  }

  return services;
}

function buildCatalog(existing, definitions) {
  const existingEntries = Array.isArray(existing?.services) ? existing.services : [];
  const existingById = new Map(existingEntries.map((entry) => [entry.id, entry]));
  const orderedIds = existingEntries
    .map((entry) => entry.id)
    .filter((id) => definitions.has(id));

  const newIds = [...definitions.keys()]
    .filter((id) => !existingById.has(id))
    .sort((a, b) => a.localeCompare(b));

  const services = [...orderedIds, ...newIds].map((id) => {
    const generated = definitions.get(id);
    const previous = existingById.get(id);
    return {
      ...generated,
      available: typeof previous?.available === 'boolean' ? previous.available : true,
    };
  });

  return { schemaVersion: 1, services };
}

const existing = await loadExistingCatalog();
const definitions = await loadServiceDefinitions();
const catalog = buildCatalog(existing, definitions);
await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
console.log(`Generated ${CATALOG_PATH} with ${catalog.services.length} services.`);
