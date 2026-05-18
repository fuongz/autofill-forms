import type { ContentMessage, FormField, FieldType, InitFormResponse } from '../common/types';
import { getStoredMapping, mergeStoredMapping } from '../common/storage';

const supportedInputTypes = new Set<FieldType>([
  'text',
  'email',
  'hidden',
  'number',
  'password',
  'search',
  'tel',
  'url',
]);

function isFillableElement(element: Element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement;
}

function getFieldType(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): FieldType | null {
  if (element instanceof HTMLSelectElement) return 'select';
  if (element instanceof HTMLTextAreaElement) return 'textarea';

  const inputType = (element.getAttribute('type') || 'text').toLowerCase() as FieldType;
  return supportedInputTypes.has(inputType) ? inputType : null;
}

function getFieldLabel(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string {
  const ariaLabel = element.getAttribute('aria-label')?.trim();
  if (ariaLabel) return ariaLabel;

  const explicitLabel = element.id ? document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(element.id)}"]`) : null;
  if (explicitLabel?.textContent?.trim()) return explicitLabel.textContent.trim();

  const wrappedLabel = element.closest('label');
  if (wrappedLabel?.textContent?.trim()) return wrappedLabel.textContent.trim().split('\n')[0].trim();

  const placeholder = element.getAttribute('placeholder')?.trim();
  if (placeholder) return placeholder;

  return element.getAttribute('name')?.trim() || element.id || 'Unnamed field';
}

function getFieldOptions(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  if (!(element instanceof HTMLSelectElement)) {
    return null;
  }

  return Array.from(element.options).map(option => ({
    label: option.textContent?.trim() || option.value,
    value: option.value,
  }));
}

function getFieldPlaceholder(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string | null {
  if (element instanceof HTMLSelectElement) {
    return null;
  }

  const placeholder = element.getAttribute('placeholder')?.trim();
  return placeholder || null;
}

function isElementHidden(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean {
  if (element instanceof HTMLInputElement && element.type === 'hidden') {
    return true;
  }

  if (element.hidden) {
    return true;
  }

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return true;
  }

  return element.getClientRects().length === 0;
}

function collectFields(): FormField[] {
  const fields: FormField[] = [];
  const seen = new Set<string>();
  const storedMapping = getStoredMapping();

  document.querySelectorAll('form input, form select, form textarea').forEach(element => {
    if (!isFillableElement(element) || element.disabled) return;

    const name = element.name?.trim();
    if (!name || seen.has(name)) return;

    const type = getFieldType(element);
    if (!type) return;

    seen.add(name);
    fields.push({
      name,
      label: getFieldLabel(element),
      type,
      options: getFieldOptions(element),
      defaultValue: storedMapping[name] ?? element.value ?? null,
      placeholder: getFieldPlaceholder(element),
      isHidden: isElementHidden(element),
    });
  });

  return fields;
}

function setElementValue(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string) {
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function applyFormData(data: Record<string, string>) {
  document.querySelectorAll('form input, form select, form textarea').forEach(element => {
    if (!isFillableElement(element) || !element.name) return;

    const nextValue = data[element.name];
    if (typeof nextValue === 'string') {
      setElementValue(element, nextValue);
    }
  });
}

chrome.runtime.onMessage.addListener((message: ContentMessage, _sender, sendResponse) => {
  if (message.type === 'INIT_FORM') {
    const response: InitFormResponse = {
      hostname: window.location.hostname,
      fields: collectFields(),
    };
    sendResponse(response);
    return true;
  }

  if (message.type === 'APPLY_FORM_DATA') {
    const mergedData = mergeStoredMapping(message.data);
    applyFormData(mergedData);
    sendResponse({ success: true });
    return true;
  }

  return false;
});

applyFormData(getStoredMapping());
