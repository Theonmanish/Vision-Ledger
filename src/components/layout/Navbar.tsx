import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Menu, X, Home, FileCheck, History, Layers, Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import AvatarDropdown from './AvatarDropdown';
import NotificationCenter from '../notifications/NotificationCenter';

const NAV_LINKS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/verify', label: 'Verify Evidence', icon: FileCheck },
  { path: '/bulk-verify', label: 'Bulk Verify', icon: Layers },
  { path: '/history', label: 'History', icon: History },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 w-full safe-top">
      <div className="border-b border-white/10 bg-white/[0.04] backdrop-blur-3xl supports-[backdrop-filter]:bg-white/[0.04]">
        <div className="mx-auto flex h-14 min-h-[3.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 safe-x">
          <Link
            to="/"
            className="touch-target flex items-center transition-opacity duration-200 hover:opacity-80"
            aria-label="VisionLedger home"
          >
            <img
              src="/logo.svg"
              alt="VisionLedger"
              className="h-8 w-auto md:h-9"
              width={140}
              height={36}
              decoding="async"
            />
          </Link>

          <nav
            className="hidden md:flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 backdrop-blur-xl"
            aria-label="Main navigation"
          >
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 min-h-[44px] inline-flex items-center',
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white'
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.08] backdrop-blur-md"
                      transition={{
                        type: 'spring',
                        bounce: 0.2,
                        duration: 0.5,
                      }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Notification Bell - Desktop */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hidden md:inline-flex touch-target"
                  onClick={() => setNotificationsOpen(true)}
                  aria-label="Open notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Button>
                <AvatarDropdown />
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" asChild className="hidden md:inline-flex">
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden touch-target"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Side Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.div
              id="mobile-nav"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-50 h-full w-[280px] border-l border-white/10 bg-[#0a0a0a]/95 backdrop-blur-2xl shadow-2xl md:hidden"
              aria-label="Mobile navigation"
            >
              <div className="flex h-full flex-col">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                  <span className="text-sm font-medium text-white/60">Menu</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Close menu"
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto px-4 py-6">
                  <div className="space-y-2">
                    {NAV_LINKS.map((link) => {
                      const Icon = link.icon;
                      const isActive = location.pathname === link.path;

                      return (
                        <Link
                          key={link.path}
                          to={link.path}
                          aria-current={isActive ? 'page' : undefined}
                          className={cn(
                            'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 min-h-[48px]',
                            isActive
                              ? 'border border-white/10 bg-white/[0.08] text-white'
                              : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          {link.label}
                        </Link>
                      );
                    })}

                    {/* Notification Bell - Mobile */}
                    {user && (
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          setNotificationsOpen(true);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/60 transition-all duration-200 min-h-[48px] hover:bg-white/[0.05] hover:text-white"
                      >
                        <div className="relative">
                          <Bell className="h-5 w-5" />
                          {unreadCount > 0 && (
                            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>
                        Notifications
                      </button>
                    )}
                  </div>
                </nav>

                {/* Auth Section */}
                {!user && (
                  <div className="border-t border-white/10 px-4 py-4">
                    <div className="space-y-2">
                      <Button asChild className="w-full min-h-[44px]">
                        <Link to="/login" onClick={() => setMobileOpen(false)}>
                          Login
                        </Link>
                      </Button>
                      <Button variant="outline" asChild className="w-full min-h-[44px]">
                        <Link to="/signup" onClick={() => setMobileOpen(false)}>
                          Sign Up
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notification Center Drawer */}
      <NotificationCenter
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </header>
  );
}
