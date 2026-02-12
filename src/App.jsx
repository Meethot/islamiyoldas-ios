import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import AppLayout from './layouts/AppLayout';
import SplashScreen from './components/SplashScreen';
import { PrayerTimesProvider, usePrayerTimes } from './context/PrayerTimesContext';
import { useLocation } from './context/LocationContext';

import { initAdMob } from './services/adService';
import { isPremium } from './services/creditService';

import ScrollToTop from './components/ScrollToTop';
import SwipeBackHandler from './components/SwipeBackHandler';
import InterstitialAdManager from './components/InterstitialAdManager';
import ReviewPrompt from './components/ReviewPrompt';

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
const AiMentor = React.lazy(() => import('./pages/AiMentor'));
const FastingTracker = React.lazy(() => import('./pages/FastingTracker'));

function App() {
  return (
    <PrayerTimesProvider>
      <AppContent />
    </PrayerTimesProvider>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const onboardingComplete = localStorage.getItem('onboardingComplete') === 'true';

  // Real data readiness signals
  const { hasLocation, loading: locationLoading } = useLocation();
  const { prayerTimes, loading: prayerLoading } = usePrayerTimes();

  const locationReady = hasLocation && !locationLoading;
  const prayerReady = !!prayerTimes && !prayerLoading;
  const dataReady = locationReady && prayerReady;

  // Dismiss when splash's internal progress completes (or via safety max)
  useEffect(() => {
    if (!dataReady) return;
    // Small delay for splash to fill to 100% visually
    const timer = setTimeout(() => setShowSplash(false), 800);
    return () => clearTimeout(timer);
  }, [dataReady]);

  // Max safety: 8s
  useEffect(() => {
    const max = setTimeout(() => setShowSplash(false), 8000);
    return () => clearTimeout(max);
  }, []);

  // AdMob init
  useEffect(() => { initAdMob(); }, []);

  if (showSplash) return <SplashScreen dataReady={dataReady} />;

  return (
    <>
      {/* Desktop Background / Outer Container */}
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center overflow-hidden font-sans">
        {/* Mobile Device Container */}
        <div className="w-full max-w-md h-[100dvh] bg-background relative shadow-2xl overflow-hidden sm:rounded-[2rem] sm:border-[8px] sm:border-gray-800 dark:sm:border-gray-800">
          <Router>
            <ScrollToTop />
            <SwipeBackHandler />
            <InterstitialAdManager />
            <ReviewPrompt />
            <Suspense fallback={<div className="min-h-screen bg-background" />}>
              <Routes>
                <Route path="/onboarding" element={<Onboarding />} />

                <Route element={<AppLayout />}>
                  <Route path="/" element={onboardingComplete ? <Home /> : <Navigate to="/onboarding" replace />} />
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
                  <Route path="/settings/legal" element={<LegalSettings />} />
                  <Route path="/legal/:type" element={<Legal />} />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </div>
      </div>
    </>
  );
}

export default App;
