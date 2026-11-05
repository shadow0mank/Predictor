import React, { useState } from 'react';
import { Ticket, CheckCircle2 } from 'lucide-react';
import { DrawSlot, TicketBetType } from '../types/lottery';
import { createVirtualTicket, LONACI_BET_RULES } from '../data/ticketStorage';
import { LotteryBall } from './LotteryBall';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialNumbers: number[];
  initialSlot: DrawSlot;
  initialSlotTime: string;
  initialGameName: string;
  initialDate: string;
  sourceMethodName: string;
  onTicketCreated?: () => void;
}

export const CreateTicketModal: React.FC<CreateTicketModalProps> = ({
  isOpen,
  onClose,
  initialNumbers,
  initialSlot,
  initialSlotTime,
  initialGameName,
  initialDate,
  sourceMethodName,
  onTicketCreated,
}) => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>(initialNumbers);
  const [betType, setBetType] = useState<TicketBetType>(
    initialNumbers.length === 1 ? '1N' : initialNumbers.length === 2 ? '2N' : '2N'
  );
  const [stake, setStake] = useState<number>(1000);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const rule = LONACI_BET_RULES[betType];

  const handleToggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      if (selectedNumbers.length > rule.minNums) {
        setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
      }
    } else {
      if (selectedNumbers.length < rule.maxNums) {
        setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    createVirtualTicket({
      targetDate: initialDate,
      targetSlot: initialSlot,
      targetTime: initialSlotTime,
      targetGameName: initialGameName,
      numbers: selectedNumbers,
      betType,
      stakeFCFA: stake,
      sourceMethod: sourceMethodName,
    });

    setIsSuccess(true);
    if (onTicketCreated) onTicketCreated();

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F3E2E] flex items-center justify-center text-white">
              <Ticket className="w-4 h-4 text-[#FE932C]" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900">
                Créer un Ticket Virtuel
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Source : <strong className="text-[#0F3E2E]">{sourceMethodName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="text-base font-heading font-bold text-slate-900">
              Ticket Virtuel Enregistré !
            </div>
            <p className="text-xs text-slate-500">
              Retrouvez ce ticket et son statut dans l'onglet « Mes Tickets ».
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Draw Context Card */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between font-mono text-[11px]">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans">Tirage Ciblé</span>
                <strong className="text-slate-800">{initialDate}</strong> · {initialSlotTime}
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-sans">Jeu Officiel</span>
                <strong className="text-[#0F3E2E]">{initialGameName}</strong>
              </div>
            </div>

            {/* Formula Type Selection */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Formule de Jeu Lonaci :</label>
              <div className="grid grid-cols-5 gap-1 font-mono font-bold">
                {(['1N', '2N', '3N', '4N', '5N'] as const).map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => {
                      setBetType(type);
                      const tRule = LONACI_BET_RULES[type];
                      if (selectedNumbers.length < tRule.minNums) {
                        setSelectedNumbers(initialNumbers.slice(0, tRule.minNums));
                      }
                    }}
                    className={`py-1.5 text-center rounded border transition-colors cursor-pointer ${
                      betType === type
                        ? 'bg-[#0F3E2E] text-white border-[#0F3E2E]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {rule.label} (Cote x{rule.multiplier} en cas de gain)
              </div>
            </div>

            {/* Selected Numbers */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">
                Numéros du Ticket ({selectedNumbers.length} sélectionnés) :
              </label>
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 rounded border border-slate-200 min-h-[50px]">
                {initialNumbers.map((num) => {
                  const isChecked = selectedNumbers.includes(num);
                  return (
                    <button
                      type="button"
                      key={num}
                      onClick={() => handleToggleNumber(num)}
                      className={`cursor-pointer transition-transform ${isChecked ? 'scale-105' : 'opacity-40 grayscale'}`}
                    >
                      <LotteryBall number={num} variant={isChecked ? 'emerald' : 'default'} size="md" />
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400">
                Cliquez sur une boule pour l'activer ou la désactiver pour ce ticket.
              </p>
            </div>

            {/* Stake Input */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Mise (FCFA) :</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={stake}
                  onChange={(e) => setStake(Math.max(100, parseInt(e.target.value, 10) || 100))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:ring-1 focus:ring-[#0F3E2E]"
                />
                <span className="font-mono font-bold text-slate-600">FCFA</span>
              </div>
              <div className="flex gap-1.5 pt-1">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setStake(amt)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-mono font-bold"
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Potential Gain Preview */}
            <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-900 font-sans">Gain Potentiel :</span>
              <strong className="text-[#0F3E2E] text-sm font-extrabold">
                {(stake * rule.multiplier).toLocaleString('fr-FR')} FCFA
              </strong>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0F3E2E] hover:bg-[#0A291E] text-white rounded font-heading font-bold shadow-xs cursor-pointer"
              >
                Valider & Enregistrer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
