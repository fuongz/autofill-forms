import { createRoot } from 'react-dom/client';
import App from '@src/app';
// eslint-disable-next-line
// @ts-ignore
import tailwindcssOutput from '@src/tailwind-output.css?inline';

const root = document.createElement('div');
root.id = 'chrome-extension-autofill-forms-content-view-root';

document.body.append(root);

const rootIntoShadow = document.createElement('div');
rootIntoShadow.id = 'shadow-root';

const shadowRoot = root.attachShadow({ mode: 'open' });
shadowRoot.appendChild(rootIntoShadow);

chrome.runtime.sendMessage({
  from: 'content',
  subject: 'showPageAction',
});

// Forms
const mappingKey = '__autofill_forms_mapping_data';
const rawMappingData = localStorage.getItem(mappingKey);
const mappingData: { [key: string]: string } = rawMappingData ? JSON.parse(rawMappingData) : {};
const forms = document.querySelectorAll('form');

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  let response_data: Array<{
    name: string | null;
    label: string | null;
    type: string | null;
    options: null | Array<{ label: string; value: string }>;
    defaultValue: null | string;
  }> = [];

  if (msg._af__from === 'popup' && msg._af__subject === 'contentScript') {
    localStorage.setItem(mappingKey, JSON.stringify({ ...mappingData, ...msg.data }));
    handleAutoFill({ ...mappingData, ...msg.data });
  }

  if (msg._af__from === 'popup' && msg._af__subject === 'initForm') {
    if (forms && forms.length > 0) {
      forms.forEach(form => {
        const inputs = form.querySelectorAll('input,select,textarea');
        inputs.forEach(input => {
          if (input.getAttribute('type') !== 'hidden' && input.getAttribute('disabled') === null) {
            let inputType = input.getAttribute('type');
            if (!inputType && input.tagName === 'SELECT') {
              inputType = 'select';
            }

            if (!inputType && input.tagName === 'TEXTAREA') {
              inputType = 'textarea';
            }

            let inputOptions: Array<{ label: string; value: string }> | null = null;
            if (input.tagName === 'SELECT') {
              inputOptions = [];
              input.querySelectorAll('option').forEach(option => {
                inputOptions?.push({
                  label: option.innerText,
                  value: option.value,
                });
              });
            }

            response_data.push({
              name: input.getAttribute('name') as string,
              label:
                input?.parentElement?.tagName === 'LABEL'
                  ? input?.parentElement.innerText.trim().split('\n')[0]
                  : input.getAttribute('placeholder'),
              type: inputType,
              options: inputOptions,
              defaultValue:
                typeof mappingData[input.getAttribute('name') as string] !== 'undefined'
                  ? mappingData[input.getAttribute('name') as string]
                  : null,
            });
          }
        });
      });
    }
    response({ hostname: location.hostname, data: response_data });
  }
});

function handleAutoFill(data: { [key: string]: string }) {
  if (forms && forms.length > 0) {
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input');
      inputs.forEach(input => {
        if (input && input.name && typeof data[input.name] !== 'undefined') {
          input.value = data[input.name];
        }
      });
    });
  }
}

handleAutoFill(mappingData);

/** Inject styles into shadow dom */
const globalStyleSheet = new CSSStyleSheet();
globalStyleSheet.replaceSync(tailwindcssOutput);
shadowRoot.adoptedStyleSheets = [globalStyleSheet];
shadowRoot.appendChild(rootIntoShadow);
createRoot(rootIntoShadow).render(<App />);
