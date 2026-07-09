import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion } from 'motion/react';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import Landing from './pages/Landing';
import Verify from './pages/Verify';
import Results from './pages/Results';
import HistoryPage from './pages/History';

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#09090B] text-white">
        {/* Global Animated Background */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[#09090B]" />

          {/* Top Right */}
          <div className="absolute -right-60 -top-10 blur-xl">
            <motion.div
              animate={{ x: [0, 30, 0], opacity: [0.6, 0.8, 0.6] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="h-[10rem] w-[60rem] rounded-full bg-gradient-to-b from-[#2563EB] to-[#3B82F6] blur-[6rem]"
            />

            <motion.div
              animate={{ x: [0, -20, 0], opacity: [0.5, 0.7, 0.5] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              className="h-[10rem] w-[90rem] rounded-full bg-gradient-to-b from-[#1D4ED8] to-[#2563EB] blur-[6rem]"
            />

            <motion.div
              animate={{ x: [0, 15, 0], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              className="h-[10rem] w-[60rem] rounded-full bg-gradient-to-b from-[#3B82F6] to-[#60A5FA] blur-[6rem]"
            />
          </div>

          {/* Middle Left */}
          <div className="absolute -left-72 top-[45%] blur-xl">
            <motion.div
              animate={{ x: [0, 20, 0], opacity: [0.25, 0.45, 0.25] }}
              transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
              className="h-[14rem] w-[70rem] rounded-full bg-gradient-to-b from-cyan-500 to-blue-500 blur-[8rem]"
            />
          </div>

          {/* Bottom Right */}
          <div className="absolute -right-80 bottom-[-10rem] blur-xl">
            <motion.div
              animate={{ x: [0, 25, 0], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
              className="h-[14rem] w-[80rem] rounded-full bg-gradient-to-b from-[#1D4ED8] to-[#3B82F6] blur-[8rem]"
            />
          </div>

          <div className="absolute inset-0 bg-noise opacity-30" />
        </div>

        <Navbar />

        <main className="relative z-10 flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/results/:id" element={<Results />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}