import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart } from 'lucide-react';

function FloatingHeart({ delay, duration, left, size }: { delay: number; duration: number; left: string; size: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left, bottom: '-20px' }}
      initial={{ y: 0, opacity: 0, rotate: 0 }}
      animate={{
        y: [0, -120, -280, -400],
        opacity: [0, 0.7, 0.5, 0],
        rotate: [0, -15, 10, -5],
        x: [0, 15, -10, 20],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatDelay: duration * 0.5,
        ease: 'easeOut',
      }}
    >
      <Heart
        style={{ width: size, height: size }}
        className="text-pink-400/60 fill-pink-400/40"
      />
    </motion.div>
  );
}

export function ValentineBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('valentine-banner-dismissed');
    if (stored) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('valentine-banner-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden z-[60]"
        >
          <div className="relative bg-gradient-to-r from-rose-900/90 via-pink-800/90 to-rose-900/90 border-b border-pink-500/20">
            <div className="absolute inset-0 overflow-hidden">
              <FloatingHeart delay={0} duration={4} left="5%" size={12} />
              <FloatingHeart delay={1.5} duration={5} left="15%" size={10} />
              <FloatingHeart delay={0.8} duration={4.5} left="30%" size={8} />
              <FloatingHeart delay={2} duration={3.8} left="50%" size={11} />
              <FloatingHeart delay={0.5} duration={4.2} left="65%" size={9} />
              <FloatingHeart delay={1.8} duration={5.2} left="80%" size={10} />
              <FloatingHeart delay={1} duration={4} left="92%" size={12} />
            </div>

            <div className="relative flex items-center justify-center py-2.5 px-12">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  <Heart className="w-4 h-4 text-pink-300 fill-pink-300" />
                </motion.div>
                <span className="text-xs sm:text-sm font-medium text-pink-100 tracking-wide">
                  <span className="hidden sm:inline">Sevgililer Günü'ne Özel %30'a Varan İndirim Başladı!</span>
                  <span className="sm:hidden">%30'a Varan İndirim!</span>
                  <span className="ml-2 text-white font-bold">14 ŞUBAT</span>
                </span>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
                >
                  <Heart className="w-4 h-4 text-pink-300 fill-pink-300" />
                </motion.div>
              </div>
              <button
                onClick={handleDismiss}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-pink-300/60 hover:text-pink-100 transition-colors rounded-full hover:bg-white/10"
                data-testid="button-dismiss-valentine"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ValentineHearts() {
  const [viewHeight, setViewHeight] = useState(800);

  useEffect(() => {
    setViewHeight(window.innerHeight);
    const handleResize = () => setViewHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hearts = [
    { delay: 0, duration: 6, left: '3%', size: 14 },
    { delay: 2, duration: 7, left: '12%', size: 10 },
    { delay: 4, duration: 5.5, left: '25%', size: 12 },
    { delay: 1, duration: 6.5, left: '40%', size: 8 },
    { delay: 3, duration: 7.5, left: '55%', size: 11 },
    { delay: 5, duration: 6, left: '70%', size: 9 },
    { delay: 2.5, duration: 5, left: '85%', size: 13 },
    { delay: 4.5, duration: 6.8, left: '95%', size: 10 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-[5] overflow-hidden">
      {hearts.map((heart, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: heart.left, bottom: '-30px' }}
          initial={{ y: 0, opacity: 0 }}
          animate={{
            y: [0, -viewHeight * 0.4, -viewHeight * 0.7, -viewHeight],
            opacity: [0, 0.15, 0.1, 0],
            x: [0, 20, -15, 25],
            rotate: [0, 20, -15, 10],
          }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Infinity,
            repeatDelay: 3,
            ease: 'easeOut',
          }}
        >
          <Heart
            style={{ width: heart.size, height: heart.size }}
            className="text-pink-500/30 fill-pink-500/20"
          />
        </motion.div>
      ))}
    </div>
  );
}
