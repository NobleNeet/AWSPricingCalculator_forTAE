import { appState, definitions } from './app.js';

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

export function detailStateKey(details, index = 0) {
  const summary = details.querySelector(':scope > summary')?.textContent?.trim() ?? 'details';
  const fieldset = details.closest('fieldset');
  const legend = fieldset?.querySelector(':scope > legend')?.textContent?.trim();
  return `${legend ? `component:${legend}` : 'profile'}:${summary}:${index}`;
}

export function installDrawerStateSync({ root = document, state = appState, definitionStore = definitions } = {}) {
  const workspace = root.getElementById('workspace');
  const drawer = root.getElementById('service-drawer');
  const content = root.getElementById('drawer-content');
  if (!workspace || !drawer || !content) return () => {};

  const openDetails = new Map();
  let replayingEdit = false;

  const captureDetailState = () => {
    [...content.querySelectorAll('details')].forEach((details, index) => openDetails.set(detailStateKey(details, index), details.open));
  };
  const restoreDetailState = () => {
    [...content.querySelectorAll('details')].forEach((details, index) => {
      const saved = openDetails.get(detailStateKey(details, index));
      if (saved !== undefined) details.open = saved;
    });
  };

  const onToggle = event => {
    if (!(event.target instanceof HTMLDetailsElement)) return;
    const details = [...content.querySelectorAll('details')];
    const index = details.indexOf(event.target);
    openDetails.set(detailStateKey(event.target, index), event.target.open);
  };
  content.addEventListener('toggle', onToggle, true);

  const observer = new MutationObserver(() => queueMicrotask(restoreDetailState));
  observer.observe(content, { childList: true, subtree: true });

  const onEdit = async event => {
    const button = event.target.closest?.('[data-action="edit"][data-instance]');
    if (!button || replayingEdit) return;
    const instanceId = button.dataset.instance;
    const instance = state().serviceInstances[instanceId];
    if (!instance) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    captureDetailState();
    try {
      const pkg = await definitionStore.package(instance.serviceId);
      fillDefinitionDefaults(pkg, instance);
    } catch {
      // The normal editor path will report Definition loading failures.
    }
    const current = root.querySelector(`[data-action="edit"][data-instance="${CSS.escape(instanceId)}"]`);
    if (!current) return;
    replayingEdit = true;
    try { current.click(); }
    finally { replayingEdit = false; }
  };
  workspace.addEventListener('click', onEdit, true);

  const onClose = () => openDetails.clear();
  drawer.addEventListener('close', onClose);

  return () => {
    workspace.removeEventListener('click', onEdit, true);
    content.removeEventListener('toggle', onToggle, true);
    drawer.removeEventListener('close', onClose);
    observer.disconnect();
  };
}

if (typeof document !== 'undefined') installDrawerStateSync();
