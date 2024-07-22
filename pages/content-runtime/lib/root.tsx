import { createRoot } from 'react-dom/client';
import App from '@lib/app';
// eslint-disable-next-line
// @ts-ignore
import injectedStyle from '@lib/index.css?inline';

const root = document.createElement('div');
root.id = 'chrome-extension-autofill-forms-runtime-content-view-root';

document.body.append(root);

const rootIntoShadow = document.createElement('div');
rootIntoShadow.id = 'shadow-root';

const shadowRoot = root.attachShadow({ mode: 'open' });
shadowRoot.appendChild(rootIntoShadow);

/** Inject styles into shadow dom */
const globalStyleSheet = new CSSStyleSheet();
globalStyleSheet.replaceSync(injectedStyle);
shadowRoot.adoptedStyleSheets = [globalStyleSheet];
shadowRoot.appendChild(rootIntoShadow);
createRoot(rootIntoShadow).render(<App />);
