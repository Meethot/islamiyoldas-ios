import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Learn from './pages/Learn';
import Tracking from './pages/Tracking';
import Profile from './pages/Profile';
import Stories from './pages/Stories';
import Dhikr from './pages/Dhikr';
import Qibla from './pages/Qibla';
import Settings from './pages/Settings';
import Legal from './pages/Legal';
import AppLayout from './layouts/AppLayout';
import SplashScreen from './components/SplashScreen';
import Murakabe from './pages/Murakabe';
import SleepMode from './pages/SleepMode';
import DuaKosesi from './pages/DuaKosesi';
import Quran from './pages/Quran';
import SurahDetail from './pages/SurahDetail';
import { PrayerTimesProvider } from './context/PrayerTimesContext';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const onboardingComplete = localStorage.getItem('onboardingComplete') === 'true';

  useEffect(() => {
    // Splash Timer
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) return <SplashScreen />;

  return (
    <PrayerTimesProvider>
      <Router>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />

          <Route element={<AppLayout />}>
            <Route path="/" element={onboardingComplete ? <Home /> : <Navigate to="/onboarding" replace />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dhikr" element={<Dhikr />} />
            <Route path="/tefekkur" element={<Murakabe />} />
            <Route path="/uyku" element={<SleepMode />} />
            <Route path="/dua" element={<DuaKosesi />} />
            <Route path="/quran" element={<Quran />} />
            <Route path="/quran/:surahId" element={<SurahDetail />} />
            <Route path="/qibla" element={<Qibla />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/legal/:type" element={<Legal />} />
          </Route>
        </Routes>
      </Router>
    </PrayerTimesProvider>
  );
}

export default App;
