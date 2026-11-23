import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/public-sans/latin-ext-400.css';
import '@fontsource/public-sans/latin-400.css';
import '@fontsource/public-sans/latin-ext-500.css';
import '@fontsource/public-sans/latin-500.css';
import '@fontsource/public-sans/latin-ext-600.css';
import '@fontsource/public-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-ext-500.css';
import '@fontsource/plus-jakarta-sans/latin-500.css';
import '@fontsource/plus-jakarta-sans/latin-ext-600.css';
import '@fontsource/plus-jakarta-sans/latin-600.css';
import '@fontsource/plus-jakarta-sans/latin-ext-700.css';
import '@fontsource/plus-jakarta-sans/latin-700.css';
import '@fontsource/jetbrains-mono/latin-ext-400.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-ext-500.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import '@fontsource/jetbrains-mono/latin-ext-600.css';
import '@fontsource/jetbrains-mono/latin-600.css';
import App from './App.tsx';
import './index.css';
import { initPwaUpdates } from './pwa/pwaUpdateManager.ts';

void initPwaUpdates();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
