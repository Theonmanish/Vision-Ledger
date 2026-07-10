import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

export default function InstallPrompt() {
  const { canInstall, install, dismiss } = useInstallPrompt();

  return (
    <AnimatePresence>
      {canInstall && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-labelledby="install-prompt-title"
          aria-describedby="install-prompt-desc"
          className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-md safe-bottom sm:inset-x-auto sm:right-6 sm:bottom-6"
        >
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#111113]/95 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2563EB]/15">
              <img
                src="/icons/icon-96.png"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-lg"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p id="install-prompt-title" className="text-sm font-semibold text-white">
                Install VisionLedger
              </p>
              <p id="install-prompt-desc" className="mt-1 text-xs leading-relaxed text-white/55">
                Add to your home screen for quick access and offline browsing of visited pages.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={() => void install()}>
                  <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Install
                </Button>
                <Button variant="ghost" size="sm" onClick={dismiss}>
                  Not now
                </Button>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="touch-target flex shrink-0 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
