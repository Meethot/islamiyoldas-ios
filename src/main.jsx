import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'

import ErrorBoundary from './components/ErrorBoundary.jsx'
import { UserProvider } from './context/UserContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { LocationProvider } from './context/LocationContext.jsx'
import QueryProvider from './providers/QueryProvider.jsx'
import { initAnalytics } from './services/analyticsService'
import { Haptics } from '@capacitor/haptics'
import { Preferences } from '@capacitor/preferences'

// Initialize Amplitude Analytics
initAnalytics();

// Intercept Haptics globally to respect user settings
const originalImpact = Haptics.impact;
const originalVibrate = Haptics.vibrate;
const originalSelectionStart = Haptics.selectionStart;
const originalSelectionChanged = Haptics.selectionChanged;
const originalSelectionEnd = Haptics.selectionEnd;
const originalNotification = Haptics.notification;

const isHapticsEnabled = async () => {
    try {
        const { value } = await Preferences.get({ key: 'hapticsEnabled' });
        return value !== 'false';
    } catch { return true; }
};

Haptics.impact = async (options) => {
    if (await isHapticsEnabled()) return originalImpact.call(Haptics, options);
};

Haptics.vibrate = async (options) => {
    if (await isHapticsEnabled()) return originalVibrate.call(Haptics, options);
};

Haptics.selectionStart = async () => {
    if (await isHapticsEnabled()) return originalSelectionStart.call(Haptics);
};

Haptics.selectionChanged = async () => {
    if (await isHapticsEnabled()) return originalSelectionChanged.call(Haptics);
};

Haptics.selectionEnd = async () => {
    if (await isHapticsEnabled()) return originalSelectionEnd.call(Haptics);
};

Haptics.notification = async (options) => {
    if (await isHapticsEnabled()) return originalNotification.call(Haptics, options);
};

// Disable selection and context menu globally for security
document.addEventListener('contextmenu', (e) => e.preventDefault());

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <LocationProvider>
          <UserProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </UserProvider>
        </LocationProvider>
      </QueryProvider>
    </ErrorBoundary>
  </StrictMode>
);
