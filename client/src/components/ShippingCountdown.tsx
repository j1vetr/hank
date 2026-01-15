import { useState, useEffect } from 'react';
import { Truck, Clock } from 'lucide-react';

export function ShippingCountdown() {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isWeekend, setIsWeekend] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const day = now.getDay(); // 0 = Pazar, 1 = Pazartesi, ..., 6 = Cumartesi
      const hour = now.getHours();
      const cutoffHour = 16;

      // Hafta içi mi? (Pazartesi-Cuma = 1-5)
      const isWeekday = day >= 1 && day <= 5;

      if (isWeekday && hour < cutoffHour) {
        // Hafta içi ve 16:00'dan önce - geri sayım göster
        const cutoff = new Date(now);
        cutoff.setHours(cutoffHour, 0, 0, 0);
        const diff = cutoff.getTime() - now.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
        setIsWeekend(false);
      } else {
        // Hafta sonu veya 16:00'dan sonra
        setTimeLeft(null);
        setIsWeekend(true);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000); // Her saniye güncelle
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (timeLeft) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center">
          <Truck className="w-5 h-5 text-white/60" />
        </div>
        <p className="text-sm sm:text-base text-white/80">
          <span className="text-white font-bold">{pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span> içinde sipariş ver, aynı gün kargoda!
        </p>
      </div>
    );
  }

  if (isWeekend) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center">
          <Truck className="w-5 h-5 text-white/60" />
        </div>
        <div className="flex flex-col">
          <span className="text-white/80 text-xs sm:text-sm">
            Aynı gün kargo
          </span>
          <span className="text-white font-medium text-sm">
            Pazartesi 16:00'a kadar verilen siparişlerde
          </span>
        </div>
      </div>
    );
  }

  return null;
}

export function ShippingCountdownBanner() {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [isWeekend, setIsWeekend] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const day = now.getDay(); // 0 = Pazar, 1 = Pazartesi, ..., 6 = Cumartesi
      const hour = now.getHours();
      const cutoffHour = 16;

      // Hafta içi mi? (Pazartesi-Cuma = 1-5)
      const isWeekday = day >= 1 && day <= 5;

      if (isWeekday && hour < cutoffHour) {
        // Hafta içi ve 16:00'dan önce - geri sayım göster
        const cutoff = new Date(now);
        cutoff.setHours(cutoffHour, 0, 0, 0);
        const diff = cutoff.getTime() - now.getTime();

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({ hours, minutes, seconds });
        setIsWeekend(false);
      } else {
        // Hafta sonu veya 16:00'dan sonra
        setTimeLeft(null);
        setIsWeekend(true);
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
          Aynı gün kargo: <span className="font-bold">Pazartesi</span> 16:00'a kadar verilen siparişlerde
        </span>
      </p>
    </div>
  );
}
