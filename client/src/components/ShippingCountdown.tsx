import { useState, useEffect } from 'react';
import { Truck, Clock } from 'lucide-react';

export function ShippingCountdown() {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [nextShippingDay, setNextShippingDay] = useState<string | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const second = now.getSeconds();

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
        let daysUntilNext = 0;
        
        if (day === 1 && hour >= cutoffHour) {
          daysUntilNext = 4;
        } else if (day === 5 && hour >= cutoffHour) {
          daysUntilNext = 3;
        } else if (day === 0) {
          daysUntilNext = 1;
        } else if (day === 2) {
          daysUntilNext = 3;
        } else if (day === 3) {
          daysUntilNext = 2;
        } else if (day === 4) {
          daysUntilNext = 1;
        } else if (day === 6) {
          daysUntilNext = 2;
        }

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
      <div className="flex items-center gap-2 text-emerald-400">
        <Clock className="w-4 h-4" />
        <span className="text-xs sm:text-sm font-medium">
          <span className="font-bold">{pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
          {' '}içinde sipariş ver, aynı gün kargoda!
        </span>
      </div>
    );
  }

  if (nextShippingDay) {
    return (
      <div className="flex items-center gap-2 text-white/80">
        <Truck className="w-4 h-4" />
        <span className="text-xs sm:text-sm">
          Sonraki aynı gün kargo: <span className="font-bold">{nextShippingDay}</span> 16:00'a kadar
        </span>
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
