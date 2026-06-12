import { motion } from 'motion/react';

const wipeEase = [0.83, 0, 0.17, 1] as const;

export default function WipeTransition() {
  return (
    <div className="fixed inset-0 z-[120] pointer-events-none overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute top-0 -left-[8vw] h-full w-[116vw] origin-left bg-black will-change-transform"
        initial={{ x: '-116vw', skewX: -8 }}
        animate={{ x: '116vw', skewX: -8 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.68, ease: wipeEase }}
      />
      <motion.div
        className="absolute top-0 -left-[8vw] h-full w-[116vw] origin-left bg-brand-blue will-change-transform"
        initial={{ x: '-116vw', skewX: -8 }}
        animate={{ x: '116vw', skewX: -8 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.58, ease: wipeEase, delay: 0.08 }}
      />
    </div>
  );
}
