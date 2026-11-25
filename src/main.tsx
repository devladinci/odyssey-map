import '@fontsource/cormorant-garamond/cyrillic-600.css';
import '@fontsource/cormorant-garamond/cyrillic-700.css';
import '@fontsource/pt-sans/cyrillic-400.css';
import '@fontsource/pt-sans/cyrillic-400-italic.css';
import '@fontsource/pt-sans/cyrillic-700.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-700.css';
import '@fontsource/pt-sans/latin-400.css';
import '@fontsource/pt-sans/latin-400-italic.css';
import '@fontsource/pt-sans/latin-700.css';
import '@fontsource/cormorant-garamond/latin-ext-600.css';
import '@fontsource/cormorant-garamond/latin-ext-700.css';
import '@fontsource/pt-sans/latin-ext-400.css';
import '@fontsource/pt-sans/latin-ext-400-italic.css';
import '@fontsource/pt-sans/latin-ext-700.css';
import './styles.css';
import { render } from 'preact';
import { App } from './ui/App';
import { initMap } from './map/mapview';
import * as S from './state';
import { HEROES, ITEMS, THEMES } from './content';

render(<App />, document.getElementById('app')!);
initMap().then(map => { (window as unknown as { odysseyMap: unknown }).odysseyMap = map; });

// A handle for the automated walk-through (scripts/smoke.mjs). It is not part of the built site.
if (import.meta.env.DEV) (window as unknown as { odysseyApp: unknown }).odysseyApp = { S, ITEMS, HEROES, THEMES };

// Offline copy: only in the built site, so it never gets in the way while developing.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register(new URL('sw.js', document.baseURI)).catch(() => {}); });
}
