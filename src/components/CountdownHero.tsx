import React, { useState, useEffect } from 'react';
import { Draw, SlotDefinition } from '../types/lottery';
import { SLOTS_CONFIG } from '../data/seedDraws';
import { LotteryBall } from './LotteryBall';
import { Clock, ArrowRight, Calendar, Database, Sparkles } from 'lucide-react';

interface CountdownHeroProps {
  latestDraw?: Draw;
  totalDrawsCount: number;
  onNavigateToPredictions: (slot?: string) => void;
}

export const CountdownHero: React.FC<CountdownHeroProps> = ({
  latestDraw,
  totalDrawsCount,
  onNavigateToPredictions,
}) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [nextSlot, setNextSlot] = useState<SlotDefinition>(SLOTS_CONFIG[0]);

  useEffect(() => {
    function updateCountdown() {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();
      const nowTotalSeconds = currentHours * 3600 + currentMinutes * 60 + currentSeconds;

      // Find next slot today or tomorrow's first slot
      let targetSlot = SLOTS_CONFIG[0];
      let targetTimeSeconds = 0;
      let foundToday = false;

      for (const slot of SLOTS_CONFIG) {
        const [h, m] = slot.time.split(':').map(Number);
        const slotSeconds = h * 3600 + m * 60;
        if (slotSeconds > nowTotalSeconds) {
          targetSlot = slot;
          targetTimeSeconds = slotSeconds;
          foundToday = true;
          break;
        }
      }

      let diffSeconds = 0;
      if (foundToday) {
        diffSeconds = targetTimeSeconds - nowTotalSeconds;
      } else {
        // Next draw is tomorrow's first slot (10:00)
        targetSlot = SLOTS_CONFIG[0];
        const [h, m] = targetSlot.time.split(':').map(Number);
        const slotSeconds = h * 3600 + m * 60;
        diffSeconds = 24 * 3600 - nowTotalSeconds + slotSeconds;
      }

      setNextSlot(targetSlot);
      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;

      setTimeLeft({ hours, minutes, seconds });
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Latest Draw Left Column (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 font-semibold text-[#0F3E2E] bg-emerald-50 px-2 py-0.5 rounded">
              <Database className="w-3.5 h-3.5 text-[#0F3E2E]" />
              Dernier tirage certifié · Loto Matrice Plus
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {latestDraw?.drawDate || 'Date inconnue'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-700 uppercase">
              {latestDraw?.drawName || 'Tirage'} ({latestDraw?.drawTime})
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 tracking-tight">
              Résultats officiels & numéros sortis
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              5 numéros tirés parmi 90. Analyse descriptive calculée sur {totalDrawsCount.toLocaleString('fr-FR')} tirages archivés.
            </p>
          </div>

          {/* Lottery Balls Grid */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
              5 Numéros Gagnants (WIN) :
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              {latestDraw?.numbers.map((num, i) => (
                <LotteryBall
                  key={i}
                  number={num}
                  variant="emerald"
                  size="lg"
                  label={`N°${i + 1}`}
                />
              ))}
            </div>

            {latestDraw?.machineNumbers && latestDraw.machineNumbers.length === 5 && (
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-1">
                  5 Numéros Machine (MAC) :
                </div>
                <div className="flex items-center gap-2">
                  {latestDraw.machineNumbers.map((num, i) => (
                    <LotteryBall
                      key={i}
                      number={num}
                      variant="cold"
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            Source unique : <span className="font-semibold text-emerald-800">Loto Matrice Plus (Historique Côte d'Ivoire)</span> · Horodatage : {latestDraw?.fetchedAt?.slice(0, 16)}
          </div>
        </div>

        {/* Next Draw & Countdown Right Column (5 cols on lg) */}
        <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-200 pt-5 lg:pt-0 lg:pl-6 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-slate-500">
              Prochain tirage officiel
            </span>
            <span className="px-2 py-0.5 bg-amber-50 text-[#B45309] border border-amber-200 rounded font-semibold text-[11px]">
              {nextSlot.name} · {nextSlot.time}
            </span>
          </div>

          {/* Interactive Countdown */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 text-center">
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Compte à rebours avant clôture
            </div>
            <div className="flex items-center justify-center gap-2 font-mono tabular-nums text-2xl sm:text-3xl font-bold text-[#0F3E2E]">
              <div className="flex flex-col items-center">
                <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[10px] font-sans font-normal text-slate-400">heures</span>
              </div>
              <span className="text-slate-300 -mt-3">:</span>
              <div className="flex flex-col items-center">
                <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-[10px] font-sans font-normal text-slate-400">min</span>
              </div>
              <span className="text-slate-300 -mt-3">:</span>
              <div className="flex flex-col items-center">
                <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-[10px] font-sans font-normal text-slate-400">sec</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToPredictions(nextSlot.slot)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F3E2E] hover:bg-[#0A291E] text-white font-semibold text-xs sm:text-sm rounded transition-colors shadow-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#fe932c]" />
            <span>Consulter les recommandations de {nextSlot.time}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
