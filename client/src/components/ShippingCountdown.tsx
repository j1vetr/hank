import { useState, useEffect } from 'react';
import { Truck, Clock } from 'lucide-react';

export function ShippingCountdown() {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number } | null>(null);
  const [nextShippingDay, setNextShippingDay] = useState<string | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();

      const isShippingDay = day === 1 || day === 5;
      const cutoffHour = 16;

      if (isShippingDay && hour < cutoffHour) {
        const cutoff = new Date(now);
        cutoff.setHours(cutoffHour, 0, 0, 0);
        const diff = cutoff.getTime() - now.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        setTimeLeft({ hours, minutes });
        setNextShippingDay(null);
      } else {
        setTimeLeft(null);
        const nextDay = day === 1 || (day > 1 && day < 5) ? 'Cuma' : 'Pazartesi';
        setNextShippingDay(nextDay);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (hours: number, minutes: number) => {
    if (hours > 0) {
      return `${hours} saat ${minutes} dakika`;
    }
    return `${minutes} dakika`;
  };

  if (timeLeft) {
    return (
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Truck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
        </div>
        <p className="text-xs sm:text-sm">
          <span className="text-emerald-400 font-bold">{formatTime(timeLeft.hours, timeLeft.minutes)}</span>
          <span className="text-white/70"> içinde sipariş verirsen aynı gün kargoda!</span>
        </p>
      </div>
    );
  }

  if (nextShippingDay) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center">
          <Truck className="w-5 h-5 text-white/60" />
        </div>
        <div className="flex flex-col">
          <span className="text-white/80 text-xs sm:text-sm">
            Sonraki aynı gün kargo
          </span>
          <span className="text-white font-medium text-sm">
            {nextShippingDay} 16:00'a kadar
          </span>
        </div>
      </div>
    );
  }

  return null;
}

export function ShippingCountdownBanner() {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [nextShippingDay, setNextShippingDay] = useState<string | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();

      const isShippingDay = day === 1 || day === 5;
      const cutoffHour = 16;

      if (isShippingDay && hour < cutoffHour) {
        const cutoff = new Date(now);
        cutoff.setHours(cutoffHour, 0, 0, 0);
        const diff = cutoff.getTime() - now.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
        setNextShippingDay(null);
      } else {
        setTimeLeft(null);
        const nextDay = day === 1 || (day > 1 && day < 5) ? 'Cuma' : 'Pazartesi';
        setNextShippingDay(nextDay);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (timeLeft) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-600 text-white py-2.5 text-center">
        <p className="text-xs sm:text-sm font-medium tracking-wide">
          <span className="inline-flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-bold text-base sm:text-lg">{pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
            {' '}içinde sipariş ver, aynı gün kargoda!
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-zinc-900 text-white py-2 text-center border-b border-zinc-800">
      <p className="text-xs sm:text-sm font-medium tracking-wide">
        <span className="inline-flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Aynı gün kargo: <span className="font-bold">{nextShippingDay}</span> 16:00'a kadar verilen siparişlerde
        </span>
      </p>
    </div>
  );
}
