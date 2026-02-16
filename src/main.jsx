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

// Initialize Amplitude Analytics
initAnalytics();

// Disable selection and context menu globally for security
document.addEventListener('contextmenu', (e) => e.preventDefault());

createRoot(document.getElementById('root')).render(
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
  </StrictMode>,
)
