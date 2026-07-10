import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import GlobalBackground from './components/layout/GlobalBackground';
import OfflineBanner from './components/layout/OfflineBanner';
import InstallPrompt from './components/layout/InstallPrompt';
import LoadingScreen from './components/shared/LoadingScreen';
import { Container } from './components/ui/container';

const Landing = lazy(() => import('./pages/Landing'));
const Verify = lazy(() => import('./pages/Verify'));
const Results = lazy(() => import('./pages/Results'));
const HistoryPage = lazy(() => import('./pages/History'));

function PageLoader() {
  return (
    <Container className="py-20">
      <LoadingScreen message="Loading..." />
    </Container>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden bg-[#09090B] text-white">
        <GlobalBackground />
        <OfflineBanner />
        <Navbar />

        <main id="main-content" className="relative z-10 flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/results/:id" element={<Results />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
        <InstallPrompt />
      </div>
    </BrowserRouter>
  );
}
