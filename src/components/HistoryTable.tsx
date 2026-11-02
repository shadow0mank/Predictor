import React, { useState, useMemo } from 'react';
import { Draw, DrawSlot } from '../types/lottery';
import { SLOTS_CONFIG } from '../data/seedDraws';
import { LotteryBall } from './LotteryBall';
import {
  Search,
  Filter,
  Download,
  PlusCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Database,
  Calendar,
  X,
} from 'lucide-react';

interface HistoryTableProps {
  draws: Draw[];
  onAddDraw: (newDraw: Draw) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  draws,
  onAddDraw,
  onRefresh,
  isRefreshing = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<DrawSlot | 'all'>('all');
  const [filterNumber, setFilterNumber] = useState<number | 'all'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Draw Modal Form state
  const [newDrawDate, setNewDrawDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newDrawSlot, setNewDrawSlot] = useState<DrawSlot>('morning');
  const [newNum1, setNewNum1] = useState('');
  const [newNum2, setNewNum2] = useState('');
  const [newNum3, setNewNum3] = useState('');
  const [newNum4, setNewNum4] = useState('');
  const [newNum5, setNewNum5] = useState('');
  const [addError, setAddError] = useState('');

  const pageSize = 15;

  // Filtered draws list
  const filteredDraws = useMemo(() => {
    return draws.filter((d) => {
      // Slot filter
      if (selectedSlot !== 'all' && d.slot !== selectedSlot) return false;

      // Date filter
      if (dateFilter && d.drawDate !== dateFilter) return false;

      // Number filter (must contain specific number)
      if (filterNumber !== 'all' && !d.numbers.includes(filterNumber)) return false;

      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesName = d.drawName.toLowerCase().includes(query);
        const matchesDate = d.drawDate.includes(query);
        const matchesTime = d.drawTime.includes(query);
        const matchesNumber = d.numbers.some((n) => String(n) === query);
        if (!matchesName && !matchesDate && !matchesTime && !matchesNumber) {
          return false;
        }
      }

      return true;
    });
  }, [draws, selectedSlot, filterNumber, dateFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredDraws.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedDraws = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDraws.slice(start, start + pageSize);
  }, [filteredDraws, currentPage]);

  const handleExportCSV = () => {
    const header = 'id,date,heure,tranche,nom_tirage,n1,n2,n3,n4,n5,source\n';
    const rows = filteredDraws
      .map(
        (d) =>
          `"${d.id}","${d.drawDate}","${d.drawTime}","${d.slot}","${d.drawName}",${d.numbers.join(',')},"${d.source}"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `loto_bonheur_ci_historique_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateDraw = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    const nums = [newNum1, newNum2, newNum3, newNum4, newNum5].map((n) => parseInt(n, 10));
    if (nums.some(isNaN)) {
      setAddError('Veuillez renseigner les 5 numéros.');
      return;
    }
    if (nums.some((n) => n < 1 || n > 90)) {
      setAddError('Chaque numéro doit être compris entre 1 et 90.');
      return;
    }
    const unique = new Set(nums);
    if (unique.size !== 5) {
      setAddError('Les 5 numéros doivent être strictement distincts.');
      return;
    }

    const slotDef = SLOTS_CONFIG.find((s) => s.slot === newDrawSlot) || SLOTS_CONFIG[0];
    const newDraw: Draw = {
      id: `manual-${Date.now()}`,
      drawDate: newDrawDate,
      drawTime: slotDef.time,
      slot: newDrawSlot,
      drawIndex: 1,
      drawName: slotDef.name,
      numbers: nums.sort((a, b) => a - b),
      source: 'Saisie manuelle certifiée',
      fetchedAt: new Date().toISOString(),
    };

    onAddDraw(newDraw);
    setShowAddModal(false);
    setNewNum1('');
    setNewNum2('');
    setNewNum3('');
    setNewNum4('');
    setNewNum5('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Actions */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-900 tracking-tight">
              Historique des Tirages · Loto Bonheur Côte d'Ivoire
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Registre officiel des résultats depuis 2020. Dépouillement vérifiable et horodaté.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded cursor-pointer transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Saisir un tirage</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exporter CSV</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0F3E2E] hover:bg-[#0A291E] rounded cursor-pointer transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center text-xs">
          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par date, tirage (Akwaba...), numéro..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 pl-9 pr-3 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-hidden focus:border-[#0F3E2E]"
            />
          </div>

          {/* Slot Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedSlot}
              onChange={(e) => {
                setSelectedSlot(e.target.value as any);
                setPage(1);
              }}
              className="w-full h-9 px-3 border border-slate-300 rounded bg-white text-slate-900 focus:outline-hidden focus:border-[#0F3E2E]"
            >
              <option value="all">Toutes les tranches horaires</option>
              {SLOTS_CONFIG.map((s) => (
                <option key={s.slot} value={s.slot}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Specific Number Filter */}
          <div className="lg:col-span-3">
            <select
              value={filterNumber}
              onChange={(e) => {
                setFilterNumber(e.target.value === 'all' ? 'all' : Number(e.target.value));
                setPage(1);
              }}
              className="w-full h-9 px-3 border border-slate-300 rounded bg-white text-slate-900 focus:outline-hidden focus:border-[#0F3E2E]"
            >
              <option value="all">Filtrer par numéro contenu (1 à 90)</option>
              {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  Contient le numéro {n}
                </option>
              ))}
            </select>
          </div>

          {/* Specific Date Filter */}
          <div className="lg:col-span-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 px-3 border border-slate-300 rounded bg-white text-slate-900 focus:outline-hidden focus:border-[#0F3E2E]"
              title="Filtrer par date exacte"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F8FAFC] text-slate-600 font-mono uppercase text-[11px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Heure / Tirage</th>
                <th className="px-4 py-3">Numéros Gagnants (5/90)</th>
                <th className="px-4 py-3">Somme</th>
                <th className="px-4 py-3">Source & Contrôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
              {paginatedDraws.length > 0 ? (
                paginatedDraws.map((d) => {
                  const sum = d.numbers.reduce((a, b) => a + b, 0);
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      {/* Date */}
                      <td className="px-4 py-3 text-slate-600 font-semibold whitespace-nowrap">
                        {d.drawDate}
                      </td>

                      {/* Slot / Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-heading font-bold text-slate-900">
                          {d.drawName}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-1.5 font-mono">
                          ({d.drawTime})
                        </span>
                      </td>

                      {/* 5 Winning Balls */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {d.numbers.map((n) => {
                            const isFilteredMatch = filterNumber !== 'all' && n === filterNumber;
                            return (
                              <LotteryBall
                                key={n}
                                number={n}
                                variant={isFilteredMatch ? 'hot' : 'default'}
                                size="sm"
                              />
                            );
                          })}
                        </div>
                      </td>

                      {/* Sum */}
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {sum}
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3 text-[11px] text-slate-400 truncate max-w-xs">
                        {d.source}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-sans">
                    Aucun tirage ne correspond aux filtres sélectionnés.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Affichage de <span className="font-semibold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> à{' '}
            <span className="font-semibold text-slate-900">
              {Math.min(currentPage * pageSize, filteredDraws.length)}
            </span>{' '}
            sur <span className="font-semibold text-slate-900">{filteredDraws.length}</span> tirages
          </div>

          <div className="flex items-center gap-1 font-mono">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              aria-label="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-semibold text-slate-700">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              aria-label="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Draw Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-heading font-semibold text-base text-slate-900">
                Saisir un Nouveau Tirage Réel
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDraw} className="space-y-4 text-xs">
              {addError && (
                <div className="p-2.5 bg-red-50 text-red-800 rounded border border-red-200 font-sans">
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Date :</label>
                  <input
                    type="date"
                    value={newDrawDate}
                    onChange={(e) => setNewDrawDate(e.target.value)}
                    required
                    className="w-full h-8 px-2 border border-slate-300 rounded"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tranche horaire :</label>
                  <select
                    value={newDrawSlot}
                    onChange={(e) => setNewDrawSlot(e.target.value as DrawSlot)}
                    className="w-full h-8 px-2 border border-slate-300 rounded"
                  >
                    {SLOTS_CONFIG.map((s) => (
                      <option key={s.slot} value={s.slot}>
                        {s.name} ({s.time})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">
                  Les 5 numéros gagnants (1 à 90) :
                </label>
                <div className="grid grid-cols-5 gap-2 font-mono">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    placeholder="N1"
                    value={newNum1}
                    onChange={(e) => setNewNum1(e.target.value)}
                    required
                    className="h-9 px-2 text-center border border-slate-300 rounded font-bold"
                  />
                  <input
                    type="number"
                    min="1"
                    max="90"
                    placeholder="N2"
                    value={newNum2}
                    onChange={(e) => setNewNum2(e.target.value)}
                    required
                    className="h-9 px-2 text-center border border-slate-300 rounded font-bold"
                  />
                  <input
                    type="number"
                    min="1"
                    max="90"
                    placeholder="N3"
                    value={newNum3}
                    onChange={(e) => setNewNum3(e.target.value)}
                    required
                    className="h-9 px-2 text-center border border-slate-300 rounded font-bold"
                  />
                  <input
                    type="number"
                    min="1"
                    max="90"
                    placeholder="N4"
                    value={newNum4}
                    onChange={(e) => setNewNum4(e.target.value)}
                    required
                    className="h-9 px-2 text-center border border-slate-300 rounded font-bold"
                  />
                  <input
                    type="number"
                    min="1"
                    max="90"
                    placeholder="N5"
                    value={newNum5}
                    onChange={(e) => setNewNum5(e.target.value)}
                    required
                    className="h-9 px-2 text-center border border-slate-300 rounded font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0F3E2E] text-white rounded font-semibold hover:bg-[#0A291E]"
                >
                  Valider et intégrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
