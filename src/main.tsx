import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { isTauri } from '@tauri-apps/api/core';
import { MantineProvider } from '@mantine/core';
import { App } from './app/app.tsx';
import { torinTheme } from './app/theme.ts';
import { LocaleProvider } from './i18n/context.tsx';
import '@mantine/core/styles/baseline.css';
import '@mantine/core/styles/default-css-variables.css';
import '@mantine/core/styles/global.css';
import '@mantine/core/styles/UnstyledButton.css';
import '@mantine/core/styles/CloseButton.css';
import '@mantine/core/styles/Loader.css';
import '@mantine/core/styles/Input.css';
import '@mantine/core/styles/InlineInput.css';
import '@mantine/core/styles/Button.css';
import '@mantine/core/styles/Checkbox.css';
import '@mantine/core/styles/Popover.css';
import '@mantine/core/styles/ScrollArea.css';
import '@mantine/core/styles/Combobox.css';
import '@mantine/core/styles/Tabs.css';
import '@mantine/core/styles/NavLink.css';
import '@mantine/core/styles/Paper.css';
import '@mantine/core/styles/Card.css';
import '@mantine/core/styles/Badge.css';
import '@mantine/core/styles/ThemeIcon.css';
import '@mantine/core/styles/Alert.css';
import '@mantine/core/styles/Code.css';
import '@mantine/core/styles/Progress.css';
import '@mantine/core/styles/Overlay.css';
import '@mantine/core/styles/ModalBase.css';
import '@mantine/core/styles/Drawer.css';
import '@fontsource/be-vietnam-pro/latin-400.css';
import '@fontsource/be-vietnam-pro/latin-600.css';
import '@fontsource/be-vietnam-pro/vietnamese-400.css';
import '@fontsource/be-vietnam-pro/vietnamese-600.css';
import './style.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={torinTheme} forceColorScheme="light" withCssVariables={false} withGlobalClasses={false}>
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </MantineProvider>
  </StrictMode>,
);
if (import.meta.env.PROD && !isTauri() && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.register('./sw.js').catch(() => {});
}
