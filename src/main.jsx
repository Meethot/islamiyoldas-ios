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

Haptics.impact = async (options) => {
    try {
        const { value } = await Preferences.get({ key: 'hapticsEnabled' });
        if (value !== 'false') return originalImpact.call(Haptics, options);
    } catch { return originalImpact.call(Haptics, options); }
};

Haptics.vibrate = async (options) => {
    try {
        const { value } = await Preferences.get({ key: 'hapticsEnabled' });
        if (value !== 'false') return originalVibrate.call(Haptics, options);
    } catch { return originalVibrate.call(Haptics, options); }
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
