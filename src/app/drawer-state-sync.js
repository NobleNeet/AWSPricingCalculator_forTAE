import { appState, definitions, replaceProject } from './app.js';
import { fillDefinitionDefaults, detailStateKey } from './drawer-state-model.js';

function domDetailStateKey(details, index = 0) {
  const summary = details.querySelector(':scope > summary')?.textContent?.trim() ?? 'details';
  const fieldset = details.closest('fieldset');
  const legend = fieldset?.querySelector(':scope > legend')?.textContent?.trim();
  return detailStateKey(summary, legend, index);
}

function setOptionLabel(option, label) {
  if (label && option.textContent !== label) option.textContent = label;
}

function decorateLambdaDrawer(content) {
  const architecture = content.querySelector('#input-profile--architecture');
  if (!architecture) return;
  const labels = {
    'AWS-Lambda-Duration': 'x86',
    'AWS-Lambda-Duration-ARM': 'arm64'
  };
  [...architecture.options].forEach(option => setOptionLabel(option, labels[option.value]));
  const snapStart = content.querySelector('#input-profile--snapStartMode');
  if (snapStart) {
    const snapLabels = {
      disabled: 'Disabled',
      'java-managed-no-charge': 'Java managed runtime (no SnapStart surcharge)',
      'billable-runtime': 'Billable runtime'
    };
    [...snapStart.options].forEach(option => setOptionLabel(option, snapLabels[option.value]));
  }
  [...content.querySelectorAll('fieldset')].forEach(fieldset => {
    const manualToggle = fieldset.querySelector('[data-toggle]');
    const inactive = [...fieldset.querySelectorAll('.notice-text')].some(node => node.textContent.includes('無効中'));
    const userFields = fieldset.querySelector('[data-field]');
    const hidden = !manualToggle && !userFields && inactive;
    if (fieldset.hidden !== hidden) fieldset.hidden = hidden;
  });
}

export function installDrawerStateSync({ root = document, state = appState, definitionStore = definitions } = {}) {
  const workspace = root.getElementById('workspace');
  const drawer = root.getElementById('service-drawer');
  const content = root.getElementById('drawer-content');
  if (!workspace || !drawer || !content) return () => {};

  const openDetails = new Map();
  let replayingEdit = false;

  const captureDetailState = () => {
    [...content.querySelectorAll('details')].forEach((details, index) => openDetails.set(domDetailStateKey(details, index), details.open));
  };
  const restoreDetailState = () => {
    [...content.querySelectorAll('details')].forEach((details, index) => {
      const saved = openDetails.get(domDetailStateKey(details, index));
      if (saved !== undefined && details.open !== saved) details.open = saved;
    });
    decorateLambdaDrawer(content);
  };

  const onToggle = event => {
    if (!(event.target instanceof HTMLDetailsElement)) return;
    const details = [...content.querySelectorAll('details')];
    const index = details.indexOf(event.target);
    openDetails.set(domDetailStateKey(event.target, index), event.target.open);
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
      // The normal editor path reports Definition loading failures.
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

  queueMicrotask(restoreDetailState);
  return () => {
    workspace.removeEventListener('click', onEdit, true);
    content.removeEventListener('toggle', onToggle, true);
    drawer.removeEventListener('close', onClose);
    observer.disconnect();
  };
}

async function hydrateLoadedProject() {
  const state = appState();
  let changed = false;
  for (const instance of Object.values(state.serviceInstances)) {
    try {
      const pkg = await definitions.package(instance.serviceId);
      changed = fillDefinitionDefaults(pkg, instance) || changed;
    } catch {
      // Preserve unavailable services exactly as restored.
    }
  }
  if (changed) await replaceProject(state);
}

if (typeof document !== 'undefined') {
  installDrawerStateSync();
  await hydrateLoadedProject();
}
