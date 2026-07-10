import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, History, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/toast';
import { Button } from '../ui/button';

export default function AvatarDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      addToast({
        type: 'success',
        title: 'Logged out',
        message: 'You have been successfully logged out',
      });
      navigate('/');
      setIsOpen(false);
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Logout failed',
        message: error.message || 'Please try again',
      });
    }
  };

  const getInitials = (email: string | undefined) => {
    return email ? email.charAt(0).toUpperCase() : 'U';
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <span className="text-white font-semibold text-sm">
          {getInitials(user.email)}
        </span>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 rounded-xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {getInitials(user.email)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-white/50">Signed in</p>
                </div>
              </div>
            </div>

            <div className="p-2">
              <button
                onClick={() => {
                  navigate('/history');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-white/80 hover:bg-white/5 transition-colors"
              >
                <History className="h-4 w-4" />
                History
              </button>

              <button
                onClick={() => {
                  navigate('/verify');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-white/80 hover:bg-white/5 transition-colors"
              >
                <FileCheck className="h-4 w-4" />
                Verify Evidence
              </button>
            </div>

            <div className="p-2 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
