import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/verify', label: 'Verify Evidence' },
  { path: '/history', label: 'History' },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
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

          <div className="hidden md:flex items-center">
            <Button asChild size="default">
              <Link to="/verify">Start Verification</Link>
            </Button>
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

              <Button asChild className="mt-2 w-full min-h-[44px]">
                <Link
                  to="/verify"
                  onClick={() => setMobileOpen(false)}
                >
                  Start Verification
                </Link>
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
