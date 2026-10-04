function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

export function fillDefinitionDefaults(pkg, instance) {
  const profile = pkg.profiles[instance.profileId];
  if (!profile) return false;
  let changed = false;
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
