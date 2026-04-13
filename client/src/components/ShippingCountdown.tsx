import { useState, useEffect } from 'react';
import { Truck, Clock } from 'lucide-react';

interface ShippingInfo {
  hours: number;
  minutes: number;
  seconds: number;
  label: string;
  isSameDay: boolean;
}

function calculateShippingInfo(): ShippingInfo {
  const now = new Date();
  const day = now.getDay(); // 0 = Pazar, 1 = Pazartesi, ..., 5 = Cuma, 6 = Cumartesi
  const hour = now.getHours();
  const cutoffHour = 16;

  let targetDate: Date;
  let label: string;
  let isSameDay: boolean;

  // Hafta içi mi? (Pazartesi-Cuma = 1-5)
  const isWeekday = day >= 1 && day <= 5;
  const isBeforeCutoff = hour < cutoffHour;

  if (isWeekday && isBeforeCutoff) {
    // Hafta içi ve 16:00'dan önce - aynı gün kargo
    targetDate = new Date(now);
    targetDate.setHours(cutoffHour, 0, 0, 0);
    label = 'aynı gün kargoda';
    isSameDay = true;
  } else if (day >= 1 && day <= 4 && !isBeforeCutoff) {
    // Pazartesi-Perşembe 16:00'dan sonra - yarın kargo
    targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 1);
    targetDate.setHours(cutoffHour, 0, 0, 0);
    label = 'yarın kargoda';
    isSameDay = false;
  } else {
    // Cuma 16:00'dan sonra, Cumartesi veya Pazar - Pazartesi kargo
    targetDate = new Date(now);
    
    if (day === 5 && !isBeforeCutoff) {
      // Cuma 16:00'dan sonra - 3 gün ekle (Pazartesi)
      targetDate.setDate(targetDate.getDate() + 3);
    } else if (day === 6) {
      // Cumartesi - 2 gün ekle (Pazartesi)
      targetDate.setDate(targetDate.getDate() + 2);
    } else if (day === 0) {
      // Pazar - 1 gün ekle (Pazartesi)
      targetDate.setDate(targetDate.getDate() + 1);
    }
    
    targetDate.setHours(cutoffHour, 0, 0, 0);
    label = 'Pazartesi kargoda';
    isSameDay = false;
  }

  const diff = targetDate.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, label, isSameDay };
}

export function ShippingCountdown() {
  const [info, setInfo] = useState<ShippingInfo | null>(null);

  useEffect(() => {
    const update = () => setInfo(calculateShippingInfo());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (!info) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-700/50 flex items-center justify-center">
        <Truck className="w-5 h-5 text-white/60" />
      </div>
      <p className="text-sm sm:text-base text-white/80">
        <span className="text-white font-bold">{pad(info.hours)}:{pad(info.minutes)}:{pad(info.seconds)}</span> içinde sipariş ver, {info.label}!
      </p>
    </div>
  );
}

export function ShippingCountdownBanner() {
  const [info, setInfo] = useState<ShippingInfo | null>(null);

  useEffect(() => {
    const update = () => setInfo(calculateShippingInfo());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (!info) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${info.isSameDay ? 'bg-pink-600' : 'bg-zinc-900 border-b border-zinc-800'} text-white py-2.5 text-center`}>
      <p className="text-xs sm:text-sm font-medium tracking-wide">
        <span className="inline-flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="font-bold text-base sm:text-lg">{pad(info.hours)}:{pad(info.minutes)}:{pad(info.seconds)}</span>
          {' '}içinde sipariş ver, {info.label}!
        </span>
      </p>
    </div>
  );
}
