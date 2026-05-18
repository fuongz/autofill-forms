import type { FormField, InitFormResponse } from '../common/types';

const statusEl = document.getElementById('status') as HTMLDivElement;
const formEl = document.getElementById('fields-form') as HTMLFormElement;
const applyButton = document.getElementById('apply-button') as HTMLButtonElement;

let activeTabId: number | null = null;

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    setStatus('No active tab available.');
    renderEmpty('Open a page with a form, then reopen the extension popup.');
    return;
  }

  activeTabId = tab.id;

  try {
    const response = (await chrome.tabs.sendMessage(tab.id, {
      type: 'INIT_FORM',
    })) as InitFormResponse;
    const fields = response?.fields ?? [];

    if (fields.length === 0) {
      setStatus(`No fillable fields found on ${tab.url ? new URL(tab.url).hostname : 'this page'}.`);
      renderEmpty('This extension scans form fields with a `name` attribute. Try a different page or reload the tab.');
      return;
    }

    setStatus(`Detected ${fields.length} field${fields.length === 1 ? '' : 's'} on ${response.hostname}.`);
    renderFields(fields);
    applyButton.disabled = false;
  } catch {
    setStatus('Unable to reach the content script on this page.');
    renderEmpty('Chrome blocks extensions on some built-in pages. Try a normal website with a form.');
  }
}

function setStatus(message: string) {
  statusEl.textContent = message;
}

function renderEmpty(message: string) {
  formEl.innerHTML = `<div class="empty">${message}</div>`;
  applyButton.disabled = true;
}

function renderFields(fields: FormField[]) {
  formEl.innerHTML = '';

  fields.forEach(field => {
    const wrapper = document.createElement('div');
    wrapper.className = 'field';
    if (field.isHidden) {
      wrapper.classList.add('field-hidden');
    }

    const label = document.createElement('label');
    label.htmlFor = field.name;
    label.textContent = field.label || field.name;
    wrapper.appendChild(label);

    if (field.placeholder) {
      const placeholderHint = document.createElement('div');
      placeholderHint.className = 'field-placeholder';
      placeholderHint.textContent = `Placeholder: ${field.placeholder}`;
      wrapper.appendChild(placeholderHint);
    }

    if (field.isHidden) {
      const hiddenBadge = document.createElement('span');
      hiddenBadge.className = 'field-badge';
      hiddenBadge.textContent = 'Hidden on page';
      wrapper.appendChild(hiddenBadge);
    }

    if (field.type === 'select') {
      const select = document.createElement('select');
      select.name = field.name;
      select.id = field.name;

      (field.options ?? []).forEach(option => {
        const optionEl = document.createElement('option');
        optionEl.value = option.value;
        optionEl.textContent = option.label;
        if (field.defaultValue === option.value) {
          optionEl.selected = true;
        }
        select.appendChild(optionEl);
      });

      wrapper.appendChild(select);
    } else if (field.type === 'textarea') {
      const textarea = document.createElement('textarea');
      textarea.name = field.name;
      textarea.id = field.name;
      textarea.value = field.defaultValue ?? '';
      textarea.placeholder = field.placeholder ?? '';
      wrapper.appendChild(textarea);
    } else {
      const input = document.createElement('input');
      input.type = field.type === 'hidden' ? 'text' : field.type;
      input.name = field.name;
      input.id = field.name;
      input.value = field.defaultValue ?? '';
      input.placeholder = field.placeholder ?? '';
      wrapper.appendChild(input);
    }

    formEl.appendChild(wrapper);
  });
}

function collectValues() {
  const data = new FormData(formEl);
  const values: Record<string, string> = {};
  data.forEach((value, key) => {
    values[key] = String(value);
  });
  return values;
}

applyButton.addEventListener('click', async () => {
  if (!activeTabId) return;

  applyButton.disabled = true;
  applyButton.textContent = 'Applying...';

  try {
    await chrome.tabs.sendMessage(activeTabId, {
      type: 'APPLY_FORM_DATA',
      data: collectValues(),
    });
    applyButton.textContent = 'Applied';
    setTimeout(() => {
      applyButton.textContent = 'Apply values';
      applyButton.disabled = false;
    }, 1000);
  } catch {
    applyButton.textContent = 'Failed';
    setStatus('Could not apply values to the page. Reload the tab and try again.');
    setTimeout(() => {
      applyButton.textContent = 'Apply values';
      applyButton.disabled = false;
    }, 1200);
  }
});

void init();
