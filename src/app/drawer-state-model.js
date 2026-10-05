function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

export function migrateDefinitionInputs(pkg, instance) {
  const profile = pkg.profiles[instance.profileId];
  if (!profile) return false;
  let changed = false;
  instance.selectors ??= {};
  const hasEphemeralStorage = profile.selectors.some(input => input.id === 'ephemeralStorageMb');
  if (pkg.service?.id === 'lambda' && hasEphemeralStorage && Object.prototype.hasOwnProperty.call(instance.selectors, 'additionalStorageMb') && !Object.prototype.hasOwnProperty.call(instance.selectors, 'ephemeralStorageMb')) {
    const legacy = Number(instance.selectors.additionalStorageMb);
    const total = Number.isFinite(legacy) ? Math.min(10240, Math.max(512, legacy + 512)) : 512;
    instance.selectors.ephemeralStorageMb = String(total);
    delete instance.selectors.additionalStorageMb;
    changed = true;
  }

  const hasEbsVolumeType = profile.selectors.some(input => input.id === 'ebsVolumeType');
  if (pkg.service?.id === 'ec2' && hasEbsVolumeType) {
    const legacyEbs = instance.components?.ebs;
    if (!Object.prototype.hasOwnProperty.call(instance.selectors, 'ebsVolumeType') && legacyEbs) {
      if (legacyEbs.enabled === false) instance.selectors.ebsVolumeType = 'none';
      else if (Object.prototype.hasOwnProperty.call(legacyEbs.inputs ?? {}, 'volumeType')) instance.selectors.ebsVolumeType = clone(legacyEbs.inputs.volumeType);
      changed = true;
    }
    if (legacyEbs && Object.prototype.hasOwnProperty.call(legacyEbs.inputs ?? {}, 'volumeType')) {
      delete legacyEbs.inputs.volumeType;
      changed = true;
    }
    if (legacyEbs?.enabled === false) {
      legacyEbs.enabled = true;
      changed = true;
    }
  }
  return changed;
}

export function fillDefinitionDefaults(pkg, instance) {
  const profile = pkg.profiles[instance.profileId];
  if (!profile) return false;
  let changed = migrateDefinitionInputs(pkg, instance);
  instance.selectors ??= {};
  for (const input of profile.selectors) {
    if (input.default === undefined || Object.prototype.hasOwnProperty.call(instance.selectors, input.id)) continue;
    instance.selectors[input.id] = clone(input.default);
    changed = true;
  }
  instance.components ??= {};
  for (const componentId of profile.components) {
    const definition = pkg.components[componentId];
    if (!definition) continue;
    if (!instance.components[componentId]) {
      instance.components[componentId] = { enabled: definition.defaultEnabled ?? true, inputs: {} };
      changed = true;
    }
    const saved = instance.components[componentId];
    if (saved.enabled === undefined) {
      saved.enabled = definition.defaultEnabled ?? true;
      changed = true;
    }
    saved.inputs ??= {};
    for (const input of [...definition.selectors, ...definition.usageInputs]) {
      if (input.default === undefined || Object.prototype.hasOwnProperty.call(saved.inputs, input.id)) continue;
      saved.inputs[input.id] = clone(input.default);
      changed = true;
    }
  }
  return changed;
}

export function detailStateKey(summary, legend, index = 0) {
  return `${legend ? `component:${legend}` : 'profile'}:${summary || 'details'}:${index}`;
}
