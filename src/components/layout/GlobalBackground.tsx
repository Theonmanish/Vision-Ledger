import { memo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

function GlobalBackgroundInner() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[#09090B]" />
        <div className="absolute -right-40 -top-20 h-64 w-96 rounded-full bg-[#2563EB]/20 blur-[6rem]" />
        <div className="absolute -left-40 top-[45%] h-64 w-96 rounded-full bg-cyan-500/10 blur-[6rem]" />
        <div className="absolute inset-0 bg-noise opacity-20" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden motion-reduce:hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[#09090B]" />

      <div className="absolute -right-60 -top-10 blur-xl max-md:opacity-60">
        <motion.div
          animate={{ x: [0, 30, 0], opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="h-[10rem] w-[60rem] max-w-[120vw] rounded-full bg-gradient-to-b from-[#2563EB] to-[#3B82F6] blur-[6rem]"
        />
        <motion.div
          animate={{ x: [0, -20, 0], opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="h-[10rem] w-[90rem] max-w-[140vw] rounded-full bg-gradient-to-b from-[#1D4ED8] to-[#2563EB] blur-[6rem]"
        />
        <motion.div
          animate={{ x: [0, 15, 0], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="h-[10rem] w-[60rem] max-w-[120vw] rounded-full bg-gradient-to-b from-[#3B82F6] to-[#60A5FA] blur-[6rem]"
        />
      </div>

      <div className="absolute -left-72 top-[45%] blur-xl max-md:opacity-50">
        <motion.div
          animate={{ x: [0, 20, 0], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="h-[14rem] w-[70rem] max-w-[130vw] rounded-full bg-gradient-to-b from-cyan-500 to-blue-500 blur-[8rem]"
        />
      </div>

      <div className="absolute -right-80 bottom-[-10rem] blur-xl max-md:opacity-50">
        <motion.div
          animate={{ x: [0, 25, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="h-[14rem] w-[80rem] max-w-[140vw] rounded-full bg-gradient-to-b from-[#1D4ED8] to-[#3B82F6] blur-[8rem]"
        />
      </div>

      <div className="absolute inset-0 bg-noise opacity-30" />
    </div>
  );
}

const GlobalBackground = memo(GlobalBackgroundInner);
export default GlobalBackground;
