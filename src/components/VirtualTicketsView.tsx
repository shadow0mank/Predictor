import React, { useState, useMemo } from 'react';
import {
  Ticket,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Wallet,
  Trophy,
  Filter,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Draw, DrawSlot, TicketBetType, VirtualTicket } from '../types/lottery';
import {
  getStoredTickets,
  deleteVirtualTicket,
  createVirtualTicket,
  syncAndEvaluateAllTickets,
  LONACI_BET_RULES,
} from '../data/ticketStorage';
import { LotteryBall } from './LotteryBall';
import { SLOTS_CONFIG } from '../data/seedDraws';

interface VirtualTicketsViewProps {
  draws: Draw[];
  onNavigateToPredictions?: () => void;
  onNavigateToSimulator?: () => void;
}

export const VirtualTicketsView: React.FC<VirtualTicketsViewProps> = ({
  draws,
  onNavigateToPredictions,
  onNavigateToSimulator,
}) => {
  const [tickets, setTickets] = useState<VirtualTicket[]>(() => syncAndEvaluateAllTickets(draws));
  const [statusFilter, setStatusFilter] = useState<'all' | 'Gagnant' | 'En attente' | 'Non gagnant'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Manual ticket form state
  const [manualSlot, setManualSlot] = useState<DrawSlot>('morning');
  const [manualBetType, setManualBetType] = useState<TicketBetType>('2N');
  const [manualStake, setManualStake] = useState<number>(1000);
  const [manualNumbersStr, setManualNumbersStr] = useState<string>('24, 68');
  const [manualDate, setManualDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Synchronize tickets with draws
  const handleSyncTickets = () => {
    const updated = syncAndEvaluateAllTickets(draws);
    setTickets(updated);
  };

  // Delete ticket
  const handleDelete = (id: string) => {
    const updated = deleteVirtualTicket(id);
    setTickets(updated);
  };

  // Handle manual ticket submission
  const handleCreateManualTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const nums = manualNumbersStr
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 90);

    const rule = LONACI_BET_RULES[manualBetType];
    if (nums.length < rule.minNums) {
      alert(`Veuillez entrer au moins ${rule.minNums} numéro(s) valide(s) pour la formule ${manualBetType}.`);
      return;
    }

    const slotDef = SLOTS_CONFIG.find((s) => s.slot === manualSlot) || SLOTS_CONFIG[0];

    createVirtualTicket({
      targetDate: manualDate,
      targetSlot: manualSlot,
      targetTime: slotDef.time,
      targetGameName: slotDef.name,
      numbers: nums.slice(0, 5),
      betType: manualBetType,
      stakeFCFA: manualStake,
      sourceMethod: 'Ticket Manuel (Joueur)',
    });

    const updated = syncAndEvaluateAllTickets(draws);
    setTickets(updated);
    setShowCreateModal(false);
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    if (statusFilter === 'all') return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  // Financial and performance metrics
  const metrics = useMemo(() => {
    const totalCount = tickets.length;
    const totalStaked = tickets.reduce((sum, t) => sum + (t.stakeFCFA || 0), 0);
    const totalGains = tickets.reduce((sum, t) => sum + (t.gainFCFA || 0), 0);
    const netBalance = totalGains - totalStaked;
    const winnersCount = tickets.filter((t) => t.status === 'Gagnant').length;
    const evaluatedCount = tickets.filter((t) => t.status !== 'En attente').length;
    const winRate = evaluatedCount > 0 ? (winnersCount / evaluatedCount) * 100 : 0;

    return {
      totalCount,
      totalStaked,
      totalGains,
      netBalance,
      winnersCount,
      winRate: Math.round(winRate),
    };
  }, [tickets]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Overview Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded bg-[#0F3E2E] text-white flex items-center gap-1.5 shadow-xs">
                <Ticket className="w-3.5 h-3.5 text-[#FE932C]" />
                GESTIONNAIRE DE TICKETS
              </span>
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
                Mes Tickets Virtuels & Suivi des Gains
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Enregistrez vos paris virtuels créés à partir des méthodes d'analyse ou du simulateur. Les résultats sont confrontés automatiquement aux tirages officiels de la Lonaci (Loto Matrice Plus) avec calcul des gains en FCFA.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            <button
              onClick={handleSyncTickets}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Vérifier les tickets contre les derniers tirages sortis"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualiser les résultats</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#0F3E2E] hover:bg-[#0A291E] text-white rounded-lg text-xs font-bold font-heading flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#FE932C]" />
              <span>Créer un Ticket Manuel</span>
            </button>
          </div>
        </div>

        {/* Financial Metrics Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-[11px] font-sans font-semibold text-slate-400 block uppercase tracking-wider">
              Tickets Enregistrés
            </span>
            <div className="text-lg sm:text-xl font-bold text-slate-900">
              {metrics.totalCount}
            </div>
            <div className="text-[10px] text-slate-500 font-sans">
              {metrics.winnersCount} ticket(s) gagnant(s) ({metrics.winRate}%)
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <span className="text-[11px] font-sans font-semibold text-slate-400 block uppercase tracking-wider">
              Total Misé Virtuel
            </span>
            <div className="text-lg sm:text-xl font-bold text-slate-800">
              {metrics.totalStaked.toLocaleString('fr-FR')} <span className="text-xs">FCFA</span>
            </div>
            <div className="text-[10px] text-slate-500 font-sans">
              Mises cumulées
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1">
            <span className="text-[11px] font-sans font-semibold text-emerald-800 block uppercase tracking-wider">
              Total Gains Remportés
            </span>
            <div className="text-lg sm:text-xl font-extrabold text-[#0F3E2E]">
              {metrics.totalGains.toLocaleString('fr-FR')} <span className="text-xs">FCFA</span>
            </div>
            <div className="text-[10px] text-emerald-700 font-sans">
              Selon cotes officielles Lonaci
            </div>
          </div>

          <div
            className={`p-3.5 rounded-lg border space-y-1 ${
              metrics.netBalance >= 0
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : 'bg-rose-50/60 border-rose-200 text-rose-950'
            }`}
          >
            <span className="text-[11px] font-sans font-semibold block uppercase tracking-wider opacity-80">
              Solde Net Simulatif
            </span>
            <div
              className={`text-lg sm:text-xl font-extrabold ${
                metrics.netBalance >= 0 ? 'text-[#0F3E2E]' : 'text-rose-700'
              }`}
            >
              {metrics.netBalance >= 0 ? '+' : ''}
              {metrics.netBalance.toLocaleString('fr-FR')} <span className="text-xs">FCFA</span>
            </div>
            <div className="text-[10px] font-sans opacity-75">
              {metrics.netBalance >= 0 ? 'Rentabilité positive' : 'Déficit théorique'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Quick Discovery */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-medium">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#0F3E2E] text-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous ({tickets.length})
          </button>
          <button
            onClick={() => setStatusFilter('Gagnant')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              statusFilter === 'Gagnant'
                ? 'bg-emerald-700 text-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gagnants ({tickets.filter((t) => t.status === 'Gagnant').length})
          </button>
          <button
            onClick={() => setStatusFilter('En attente')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              statusFilter === 'En attente'
                ? 'bg-amber-600 text-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            En Attente ({tickets.filter((t) => t.status === 'En attente').length})
          </button>
          <button
            onClick={() => setStatusFilter('Non gagnant')}
            className={`px-3 py-1.5 rounded transition-colors cursor-pointer ${
              statusFilter === 'Non gagnant'
                ? 'bg-slate-700 text-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Non Gagnants ({tickets.filter((t) => t.status === 'Non gagnant').length})
          </button>
        </div>

        {/* Quick links to create tickets from methods */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          {onNavigateToPredictions && (
            <button
              onClick={onNavigateToPredictions}
              className="text-[#0F3E2E] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Créer depuis les Méthodes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {onNavigateToSimulator && (
            <button
              onClick={onNavigateToSimulator}
              className="text-amber-700 hover:underline flex items-center gap-1 cursor-pointer ml-2"
            >
              <span>Créer depuis le Simulateur</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tickets List Grid */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Ticket className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-slate-800 text-base">
              Aucun ticket enregistré dans cette catégorie
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Vous pouvez enregistrer un ticket virtuel directement depuis l'espace <strong>Prédictions</strong> (sur n'importe quelle méthode), depuis le <strong>Simulateur de Boules</strong>, ou en cliquant sur « Créer un Ticket Manuel » ci-dessus.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#0F3E2E] text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Créer mon Premier Ticket
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => {
            const rule = LONACI_BET_RULES[ticket.betType];
            const isWinner = ticket.status === 'Gagnant';
            const isPending = ticket.status === 'En attente';

            return (
              <div
                key={ticket.id}
                className={`bg-white border rounded-xl p-4.5 flex flex-col justify-between gap-3 shadow-xs transition-all relative overflow-hidden ${
                  isWinner
                    ? 'border-emerald-300 ring-1 ring-emerald-200 bg-gradient-to-b from-emerald-50/40 via-white to-white'
                    : isPending
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Top Ticket Header: Serial & Bet Type */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {ticket.id.slice(0, 14)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          isWinner
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : isPending
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <div className="text-xs font-heading font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
                      <span className="text-[#0F3E2E]">{rule.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">(Cote x{ticket.multiplier})</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(ticket.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                    title="Supprimer ce ticket"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Target Draw Info */}
                <div className="flex items-center justify-between text-xs font-mono text-slate-600 bg-slate-50/80 p-2 rounded border border-slate-200/60">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Date & Tirage</span>
                    <strong className="text-slate-800">{ticket.targetDate}</strong> · {ticket.targetTime}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-sans">Jeu Officiel</span>
                    <strong className="text-[#0F3E2E]">{ticket.targetGameName}</strong>
                  </div>
                </div>

                {/* Ticket Numbers Display */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700">Numéros Joués :</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Origine : <strong className="text-slate-700">{ticket.sourceMethod}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {ticket.numbers.map((num) => {
                      const isMatched = ticket.matchedNumbers?.includes(num);

                      return (
                        <div key={num} className="relative">
                          <LotteryBall
                            number={num}
                            variant={isMatched ? 'emerald' : 'default'}
                            size="md"
                          />
                          {isMatched && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[8px] font-black shadow-xs">
                              ✓
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Official Results & Payout Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-sans">Mise engagée</span>
                    <span className="font-bold text-slate-800">
                      {ticket.stakeFCFA.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-sans">
                      {isWinner ? 'Gain Réalisé' : isPending ? 'Gain Potentiel' : 'Résultat'}
                    </span>
                    {isWinner ? (
                      <span className="font-extrabold text-sm text-[#0F3E2E] bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                        +{ticket.gainFCFA?.toLocaleString('fr-FR')} FCFA
                      </span>
                    ) : isPending ? (
                      <span className="text-amber-800 font-semibold text-xs">
                        Max {(ticket.stakeFCFA * rule.multiplier).toLocaleString('fr-FR')} FCFA
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs italic">
                        0 FCFA (0/{rule.requiredHits})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Ticket Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#0F3E2E]" />
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Créer un Nouveau Ticket Virtuel
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualTicket} className="space-y-4 text-xs">
              {/* Target Date & Slot */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Date du Tirage :</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono font-medium focus:ring-1 focus:ring-[#0F3E2E]"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Créneau Horaire :</label>
                  <select
                    value={manualSlot}
                    onChange={(e) => setManualSlot(e.target.value as DrawSlot)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-medium focus:ring-1 focus:ring-[#0F3E2E] cursor-pointer"
                  >
                    {SLOTS_CONFIG.map((s) => (
                      <option key={s.slot} value={s.slot}>
                        {s.time} · {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bet Type Formula */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Formule de Jeu Lonaci :</label>
                <div className="grid grid-cols-5 gap-1 font-mono font-bold">
                  {(['1N', '2N', '3N', '4N', '5N'] as const).map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setManualBetType(type)}
                      className={`py-2 text-center rounded border transition-colors cursor-pointer ${
                        manualBetType === type
                          ? 'bg-[#0F3E2E] text-white border-[#0F3E2E]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {LONACI_BET_RULES[manualBetType].label} (Cote multiplicatrice x{LONACI_BET_RULES[manualBetType].multiplier})
                </div>
              </div>

              {/* Numbers Input */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Numéros du Ticket (1 à 90, séparés par des virgules) :
                </label>
                <input
                  type="text"
                  value={manualNumbersStr}
                  onChange={(e) => setManualNumbersStr(e.target.value)}
                  placeholder="Ex: 24, 68, 11"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:ring-1 focus:ring-[#0F3E2E]"
                  required
                />
                <p className="text-[10px] text-slate-400 font-sans">
                  Entrez les numéros de votre choix. Pour le 1N = 1 numéro ; 2N = 2 numéros ou plus.
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
                    value={manualStake}
                    onChange={(e) => setManualStake(Math.max(100, parseInt(e.target.value, 10) || 100))}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:ring-1 focus:ring-[#0F3E2E]"
                  />
                  <span className="font-mono font-bold text-slate-600">FCFA</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F3E2E] hover:bg-[#0A291E] text-white rounded font-heading font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Enregistrer le Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
