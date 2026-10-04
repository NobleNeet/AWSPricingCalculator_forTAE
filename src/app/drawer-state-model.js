function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function migrateLegacyProfileValues(pkg, profile, instance) {
  let changed = false;
  if (pkg.service?.id === 'lambda' && profile.selectors.some(input => input.id === 'ephemeralStorageMb')) {
    const hasNewValue = Object.prototype.hasOwnProperty.call(instance.selectors, 'ephemeralStorageMb');
    const hasLegacyValue = Object.prototype.hasOwnProperty.call(instance.selectors, 'additionalStorageMb');
    if (!hasNewValue && hasLegacyValue) {
      const additional = Number(instance.selectors.additionalStorageMb);
      if (Number.isFinite(additional)) {
        instance.selectors.ephemeralStorageMb = String(additional + 512);
        changed = true;
      }
    }
    if (hasLegacyValue) {
      delete instance.selectors.additionalStorageMb;
      changed = true;
    }
  }
  return changed;
}

export function fillDefinitionDefaults(pkg, instance) {
  const profile = pkg.profiles[instance.profileId];
  if (!profile) return false;
  let changed = false;
  instance.selectors ??= {};
  changed = migrateLegacyProfileValues(pkg, profile, instance) || changed;
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
