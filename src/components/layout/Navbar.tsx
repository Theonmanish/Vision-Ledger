import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Menu, X, LogOut, User } from 'lucide-react';
import { Button } from '../ui/button';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/toast';
import AvatarDropdown from './AvatarDropdown';

const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/verify', label: 'Verify Evidence' },
  { path: '/history', label: 'History' },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      addToast({
        type: 'success',
        title: 'Logged out',
        message: 'You have been successfully logged out',
      });
      setMobileOpen(false);
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Logout failed',
        message: error.message || 'Please try again',
      });
    }
  };

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

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <AvatarDropdown />
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

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

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-b border-white/10 bg-white/[0.05] backdrop-blur-3xl md:hidden"
          >
            <nav className="flex flex-col gap-1 px-4 py-4 safe-x" aria-label="Mobile navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  aria-current={location.pathname === link.path ? 'page' : undefined}
                  className={cn(
                    'rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 min-h-[44px] flex items-center',
                    location.pathname === link.path
                      ? 'border border-white/10 bg-white/[0.08] text-white'
                      : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {user ? (
                <>
                  <div className="flex items-center gap-2 px-4 py-3 mt-2 rounded-xl bg-white/5 border border-white/10">
                    <User className="h-4 w-4 text-white/60" />
                    <span className="text-sm text-white/80 truncate">{user.email}</span>
                  </div>
                  <Button
                    variant="ghost"
                    className="mt-2 w-full min-h-[44px]"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild className="mt-2 w-full min-h-[44px]">
                    <Link to="/verify" onClick={() => setMobileOpen(false)}>
                      Start Verification
                    </Link>
                  </Button>
                  <div className="flex gap-2 mt-2">
                    <Button variant="ghost" className="flex-1 min-h-[44px]" asChild>
                      <Link to="/login" onClick={() => setMobileOpen(false)}>
                        Login
                      </Link>
                    </Button>
                    <Button className="flex-1 min-h-[44px]" asChild>
                      <Link to="/signup" onClick={() => setMobileOpen(false)}>
                        Sign Up
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
