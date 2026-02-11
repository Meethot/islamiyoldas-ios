import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import AppLayout from './layouts/AppLayout';
import SplashScreen from './components/SplashScreen';
import { PrayerTimesProvider } from './context/PrayerTimesContext';

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
  const [showSplash, setShowSplash] = useState(true);
  const onboardingComplete = localStorage.getItem('onboardingComplete') === 'true';

  useEffect(() => {
    // Splash Timer
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // AdMob başlat
  useEffect(() => { initAdMob(); }, []);

  if (showSplash) return <SplashScreen />;

  return (
    <PrayerTimesProvider>
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
                  {/* /settings removed - Profile now handles settings navigation */}
                  <Route path="/settings/notifications" element={<NotificationSettings />} />
                  {/* /settings/appearance removed - now direct toggle in Profile */}
                  <Route path="/settings/location" element={<LocationSettings />} />
                  <Route path="/settings/legal" element={<LegalSettings />} />
                  <Route path="/legal/:type" element={<Legal />} />
                </Route>
              </Routes>
            </Suspense>
          </Router>
        </div>
      </div>
    </PrayerTimesProvider>
  );
}

export default App;
