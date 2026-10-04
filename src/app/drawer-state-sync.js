import { appState, definitions } from './app.js';
import { fillDefinitionDefaults, detailStateKey } from './drawer-state-model.js';

function domDetailStateKey(details, index = 0) {
  const summary = details.querySelector(':scope > summary')?.textContent?.trim() ?? 'details';
  const fieldset = details.closest('fieldset');
  const legend = fieldset?.querySelector(':scope > legend')?.textContent?.trim();
  return detailStateKey(summary, legend, index);
}

function relabelSelect(select, labels) {
  if (!select) return;
  [...select.options].forEach(option => {
    if (labels[option.value]) option.textContent = labels[option.value];
  });
}

function applyLambdaPresentation(root, content) {
  if (root.getElementById('drawer-title')?.textContent?.trim() !== 'AWS Lambda') return;
  relabelSelect(content.querySelector('#input-profile--architecture'), {
    'AWS-Lambda-Duration': 'x86',
    'AWS-Lambda-Duration-ARM': 'arm64'
  });
  relabelSelect(content.querySelector('#input-profile--snapStartMode'), {
    disabled: 'Disabled',
    'java-managed-no-charge': 'Java managed runtime (no additional SnapStart charge)',
    'billable-runtime': 'Billable SnapStart runtime'
  });
  [...content.querySelectorAll('fieldset')].forEach(fieldset => {
    const notice = [...fieldset.querySelectorAll(':scope > .notice-text')]
      .find(node => node.textContent?.includes('無効中'));
    const hasComponentControls = fieldset.querySelector('[data-field], [data-toggle]');
    fieldset.hidden = Boolean(notice && !hasComponentControls);
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
      if (saved !== undefined) details.open = saved;
    });
    applyLambdaPresentation(root, content);
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
