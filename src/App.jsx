import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation as useRouterLocation } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import AppLayout from './layouts/AppLayout';
import SplashScreen from './components/SplashScreen';
import { PrayerTimesProvider, usePrayerTimes } from './context/PrayerTimesContext';
import { useLocation } from './context/LocationContext';
import { App as CapApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { FontSizeProvider } from './context/FontSizeContext';

import { initAdMob } from './services/adService';
import { isPremium } from './services/creditService';
import { initCrashlytics, logPageView } from './services/crashService';
import { initOneSignal, setLanguageTag } from './services/pushService';
import { storageService } from './services/storageService';
import { analytics } from './services/analyticsService';

import ScrollToTop from './components/ScrollToTop';
import SwipeBackHandler from './components/SwipeBackHandler';
import ReviewPrompt from './components/ReviewPrompt';
import { useTranslation } from 'react-i18next';

// Lazy-loaded pages — parsed only when navigated to
const Learn = React.lazy(() => import('./pages/Learn'));
const Tracking = React.lazy(() => import('./pages/Tracking'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Stories = React.lazy(() => import('./pages/Stories'));
const Dhikr = React.lazy(() => import('./pages/Dhikr'));
const Qibla = React.lazy(() => import('./pages/Qibla'));
const Legal = React.lazy(() => import('./pages/Legal'));
const Murakabe = React.lazy(() => import('./pages/Murakabe'));
const Tefekkur = React.lazy(() => import('./pages/Tefekkur'));
const SleepMode = React.lazy(() => import('./pages/SleepMode'));
const DuaKosesi = React.lazy(() => import('./pages/DuaKosesi'));
const Quran = React.lazy(() => import('./pages/Quran'));
const SurahDetail = React.lazy(() => import('./pages/SurahDetail'));
const NotificationSettings = React.lazy(() => import('./pages/settings/NotificationSettings'));
const LocationSettings = React.lazy(() => import('./pages/settings/LocationSettings'));
const LegalSettings = React.lazy(() => import('./pages/settings/LegalSettings'));
const LanguageSettings = React.lazy(() => import('./pages/settings/LanguageSettings'));
const AiMentor = React.lazy(() => import('./pages/AiMentor'));
const FastingTracker = React.lazy(() => import('./pages/FastingTracker'));
const PremiumPaywall = React.lazy(() => import('./pages/PremiumPaywall'));

function App() {
  return (
    <PrayerTimesProvider>
      <FontSizeProvider>
        <AppContent />
      </FontSizeProvider>
    </PrayerTimesProvider>
  );
}

function CrashBreadcrumbs() {
  const location = useRouterLocation();
  useEffect(() => { logPageView(location.pathname); }, [location.pathname]);
  return null;
}

const APP_START_TIME = performance.now();

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [storageReady, setStorageReady] = useState(false);

  // Storage hazır olduktan sonra onboarding durumunu al
  // [DISABLED] Onboarding devre dışı — tekrar aktif etmek için aşağıdaki satırı aç ve route'u eski haline getir
  // const onboardingComplete = storageService.getItem('onboardingComplete') === 'true';
  const onboardingComplete = true; // Always skip onboarding

  // Real data readiness signals
  const { hasLocation, loading: locationLoading } = useLocation();
  const { prayerTimes, loading: prayerLoading } = usePrayerTimes();

  const locationReady = !locationLoading; // Loading finished (permission granted or not — doesn't matter)
  const prayerReady = !!prayerTimes && !prayerLoading;
  const dataReady = locationReady && prayerReady && storageReady;

  // Initialize Storage Service
  useEffect(() => {
    storageService.initialize().then(() => {
      setStorageReady(true);
    }).catch(() => {
      setStorageReady(true); // Fallback to proceed even if async storage fails
    });
  }, []);

  // Dismiss when splash's internal progress completes (or via safety max)
  useEffect(() => {
    if (!dataReady) return;
    // Small delay for splash to fill to 100% visually
    const timer = setTimeout(() => {
      setShowSplash(false);
      const loadTime = Math.round(performance.now() - APP_START_TIME);
      const isFirstOpen = !storageService.getItem('has_launched_before');
      analytics.appLoaded(loadTime, isFirstOpen);
      analytics.firstScreenVisible(onboardingComplete ? 'home' : 'onboarding', loadTime);
      if (isFirstOpen) storageService.setItem('has_launched_before', 'true');
    }, 800);
    return () => clearTimeout(timer);
  }, [dataReady]);

  // Max safety: 5s (cache-first strategy makes normal path much faster)
  useEffect(() => {
    const max = setTimeout(() => setShowSplash(false), 5000);
    return () => clearTimeout(max);
  }, []);

  // Prefetch popular pages after splash — eliminates first-nav delay
  useEffect(() => {
    if (showSplash) return;
    const t = setTimeout(() => {
      import('./pages/Tracking');
      import('./pages/Dhikr');
      import('./pages/Learn');
      import('./pages/Stories');
      import('./pages/Profile');
    }, 500);
    return () => clearTimeout(t);
  }, [showSplash]);

  // Defer non-critical third-party initializations to prevent blocking JS thread on mount
  useEffect(() => {
    const t1 = setTimeout(initAdMob, 2000);
    const t2 = setTimeout(initCrashlytics, 3000);
    const t3 = setTimeout(initOneSignal, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // Sync app language to OneSignal for segment-based notifications
  const { i18n } = useTranslation();
  useEffect(() => {
    const t = setTimeout(() => setLanguageTag(i18n.language), 4500);
    return () => clearTimeout(t);
  }, [i18n.language]);

  // IAP init — sets up transaction listeners + verifies subscription
  useEffect(() => {
    if (!storageReady) return;
    const t = setTimeout(() => {
      import('@/services/purchaseService').then(({ initializePurchases }) => {
        initializePurchases();
      }).catch(() => { });
    }, 100);
    return () => clearTimeout(t);
  }, [storageReady]);

  // Track app lifecycle + dismiss ezan notifications on foreground
  useEffect(() => {
    const listener = CapApp.addListener('appStateChange', (state) => {
      analytics.appStateChanged(state.isActive ? 'foreground' : 'background');
      if (state.isActive) {
        LocalNotifications.removeAllDeliveredNotifications().catch(() => { });
      }
    });

    let notifReceivedListener;
    let notifActionListener;

    const setupNotificationListeners = async () => {
      try {
        notifReceivedListener = await LocalNotifications.addListener('localNotificationReceived', (notification) => {
          let type = 'general';
          if (notification.extra && notification.extra.type) {
            type = notification.extra.type;
          } else if (notification.id >= 1001 && notification.id <= 1003) {
            type = 'prayer_time';
          } else if (notification.id === 2000) {
            type = 'dhikr_reminder';
          }
          analytics.notificationReceived(type);
        });

        notifActionListener = await LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
          const notification = notificationAction.notification;
          let type = 'general';
          if (notification.extra && notification.extra.type) {
            type = notification.extra.type;
          } else if (notification.id >= 1001 && notification.id <= 1003) {
            type = 'prayer_time';
          } else if (notification.id === 2000) {
            type = 'dhikr_reminder';
          }
          analytics.notificationTapped(type);
        });
      } catch (e) {
        console.log('Notification listener setup error:', e);
      }
    };

    setupNotificationListeners();

    return () => { 
      listener.then(l => l.remove()); 
      if (notifReceivedListener) notifReceivedListener.remove();
      if (notifActionListener) notifActionListener.remove();
    };
  }, []);

  if (showSplash) return <SplashScreen dataReady={dataReady} />;

  return (
    <>
      {/* Full-screen app container — no phone frame for native builds */}
      <div className="w-full h-[100dvh] bg-background relative overflow-hidden font-sans">
        <Router>
          <ScrollToTop />
          <SwipeBackHandler />
          <CrashBreadcrumbs />
          <ReviewPrompt />
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/premium" element={<PremiumPaywall />} />

              <Route element={<AppLayout />}>
                {/* [DISABLED] Onboarding gate — tekrar aktif etmek için: onboardingComplete ? <Home /> : <Navigate to="/onboarding" replace /> */}
                <Route path="/" element={<Home />} />
                <Route path="/learn" element={<Learn />} />
                <Route path="/stories" element={<Stories />} />
                <Route path="/tracking" element={<Tracking />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/dhikr" element={<Dhikr />} />
                <Route path="/tefekkur" element={<Tefekkur />} />
                <Route path="/uyku" element={<SleepMode />} />
                <Route path="/dua" element={<DuaKosesi />} />
                <Route path="/quran" element={<Quran />} />
                <Route path="/quran/:surahId" element={<SurahDetail />} />
                <Route path="/qibla" element={<Qibla />} />
                <Route path="/ai-mentor" element={<AiMentor />} />
                <Route path="/oruc-takibi" element={<FastingTracker />} />
                <Route path="/settings/notifications" element={<NotificationSettings />} />
                <Route path="/settings/location" element={<LocationSettings />} />
                <Route path="/settings/language" element={<LanguageSettings />} />
                <Route path="/settings/legal" element={<LegalSettings />} />
                <Route path="/legal/:type" element={<Legal />} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </div>
    </>
  );
}

export default App;
