import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import GlobalBackground from './components/layout/GlobalBackground';
import OfflineBanner from './components/layout/OfflineBanner';
import InstallPrompt from './components/layout/InstallPrompt';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ToastProvider } from './components/ui/toast';

const Landing = lazy(() => import('./pages/Landing'));
const Verify = lazy(() => import('./pages/Verify'));
const BulkVerify = lazy(() => import('./pages/BulkVerify'));
const Results = lazy(() => import('./pages/Results'));
const History = lazy(() => import('./pages/History'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const EmailVerification = lazy(() => import('./pages/EmailVerification'));

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-white/60 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ToastProvider>
          <BrowserRouter>
            <div className="relative min-h-screen bg-[#0a0a0a]">
              <GlobalBackground />
              <OfflineBanner />
              <Navbar />

              <main className="relative z-10">
                <Suspense fallback={<LoadingScreen />}>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<EmailVerification />} />
                    <Route
                      path="/verify"
                      element={
                        <ProtectedRoute>
                          <Verify />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/bulk-verify"
                      element={
                        <ProtectedRoute>
                          <BulkVerify />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/results/:id"
                      element={
                        <ProtectedRoute>
                          <Results />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/history"
                      element={
                        <ProtectedRoute>
                          <History />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </Suspense>
              </main>

              <Footer />
              <InstallPrompt />
            </div>
          </BrowserRouter>
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
