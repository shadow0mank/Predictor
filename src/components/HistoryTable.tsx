import React, { useState, useMemo } from 'react';
import { Draw, DrawSlot } from '../types/lottery';
import { SLOTS_CONFIG } from '../data/seedDraws';
import { LotteryBall } from './LotteryBall';
import {
  Search,
  Download,
  PlusCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
  EyeOff,
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
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [filterNumber, setFilterNumber] = useState<number | 'all'>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [showMachineNumbers, setShowMachineNumbers] = useState(true);
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Draw Modal Form state
  const [newDrawDate, setNewDrawDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newDrawSlot, setNewDrawSlot] = useState<DrawSlot>('morning');
  const [newDrawName, setNewDrawName] = useState('AKWABA');
  const [newNum1, setNewNum1] = useState('');
  const [newNum2, setNewNum2] = useState('');
  const [newNum3, setNewNum3] = useState('');
  const [newNum4, setNewNum4] = useState('');
  const [newNum5, setNewNum5] = useState('');
  const [addError, setAddError] = useState('');

  const pageSize = 20;

  // Available years in dataset
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    draws.forEach((d) => {
      if (d.drawDate) {
        years.add(d.drawDate.slice(0, 4));
      }
    });
    return Array.from(years).sort().reverse();
  }, [draws]);

  // Filtered draws list
  const filteredDraws = useMemo(() => {
    return draws.filter((d) => {
      // Slot filter
      if (selectedSlot !== 'all' && d.slot !== selectedSlot) return false;

      // Year filter
      if (selectedYear !== 'all' && !d.drawDate.startsWith(selectedYear)) return false;

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
        const matchesTirage = d.tirage?.toLowerCase().includes(query);
        const matchesNumber = d.numbers.some((n) => String(n) === query);
        const matchesMac = d.machineNumbers?.some((n) => String(n) === query);
        if (!matchesName && !matchesDate && !matchesTime && !matchesTirage && !matchesNumber && !matchesMac) {
          return false;
        }
      }

      return true;
    });
  }, [draws, selectedSlot, selectedYear, filterNumber, dateFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredDraws.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedDraws = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDraws.slice(start, start + pageSize);
  }, [filteredDraws, currentPage]);

  const handleExportCSV = () => {
    const header = 'id,date,heure,tranche,nom_tirage,tirage_no,gagnants,machines,source\n';
    const rows = filteredDraws
      .map(
        (d) =>
          `"${d.id}","${d.drawDate}","${d.drawTime}","${d.slot}","${d.drawName}","${d.tirage || ''}","${d.numbers.join('-')}","${(d.machineNumbers || []).join('-')}","${d.source}"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `historique_loto_matrice_plus_ci_${new Date().toISOString().slice(0, 10)}.csv`);
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
      id: `lmp-ci-${newDrawDate}-${Date.now()}`,
      drawDate: newDrawDate,
      drawTime: slotDef.time,
      slot: newDrawSlot,
      drawIndex: 1,
      drawName: newDrawName.trim().toUpperCase() || 'AKWABA',
      numbers: nums.sort((a, b) => a - b),
      source: "Loto Matrice Plus (Historique Côte d'Ivoire)",
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

  const oldestDate = draws[draws.length - 1]?.drawDate || '2020-01-01';
  const latestDate = draws[0]?.drawDate || '2026-11-03';

  return (
    <div className="space-y-6">
      {/* Certified Source Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-4 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[#0F3E2E] text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="font-heading font-bold text-sm text-[#0F3E2E]">
              Source Unique Certifiée : Loto Matrice Plus (Historique Côte d'Ivoire)
            </div>
            <div className="text-xs text-emerald-800">
              {draws.length.toLocaleString('fr-FR')} tirages officiels archivés du <span className="font-mono font-semibold">{oldestDate}</span> au <span className="font-mono font-semibold">{latestDate}</span>.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => setShowMachineNumbers(!showMachineNumbers)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-emerald-300 text-emerald-900 rounded hover:bg-emerald-100/50 transition-colors cursor-pointer"
          >
            {showMachineNumbers ? <EyeOff className="w-3.5 h-3.5 text-emerald-700" /> : <Eye className="w-3.5 h-3.5 text-emerald-700" />}
            <span>{showMachineNumbers ? 'Masquer Machines' : 'Afficher Machines'}</span>
          </button>
        </div>
      </div>

      {/* Control Actions & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-900 tracking-tight">
              Registre des Tirages Officiels · Côte d'Ivoire
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Extraction brute de la rubrique « Historique Côte d'Ivoire » de l'application mobile.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded cursor-pointer transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Ajouter manuellement</span>
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
              placeholder="Rechercher par nom (Akwaba, Diamant...), date, numéro..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 pl-9 pr-3 text-xs border border-slate-300 rounded bg-white text-slate-900 focus:outline-hidden focus:border-[#0F3E2E]"
            />
          </div>

          {/* Year Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setPage(1);
              }}
              className="w-full h-9 px-2 border border-slate-300 rounded bg-white text-slate-900 focus:outline-hidden focus:border-[#0F3E2E]"
            >
              <option value="all">Toutes les années (2020-2026)</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Année {yr}
                </option>
              ))}
            </select>
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
              <option value="all">Toutes les plages horaires</option>
              <option value="morning">Matin (07h, 08h, 10h)</option>
              <option value="noon">Midi (13h)</option>
              <option value="afternoon">Après-midi (16h)</option>
              <option value="evening">Soirée (18h, 21h, 22h, 23h)</option>
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
              <option value="all">Filtrer par numéro gagnant (1..90)</option>
              {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  Contient le N°{n}
                </option>
              ))}
            </select>
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
                <th className="px-4 py-3">Heure & Tirage CI</th>
                <th className="px-4 py-3">5 Numéros Gagnants (WIN)</th>
                {showMachineNumbers && <th className="px-4 py-3">Numéros Machine (MAC)</th>}
                <th className="px-4 py-3">Somme</th>
                <th className="px-4 py-3">Source Officielle</th>
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
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading font-bold text-slate-900">
                            {d.drawName}
                          </span>
                          {d.tirage && (
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1 rounded">
                              N°{d.tirage}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {d.drawTime}
                        </span>
                      </td>

                      {/* 5 Winning Balls */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {d.numbers.map((n) => {
                            const isFilteredMatch = filterNumber !== 'all' && n === filterNumber;
                            return (
                              <LotteryBall
                                key={n}
                                number={n}
                                variant={isFilteredMatch ? 'hot' : 'emerald'}
                                size="sm"
                              />
                            );
                          })}
                        </div>
                      </td>

                      {/* Machine Numbers (MAC) */}
                      {showMachineNumbers && (
                        <td className="px-4 py-3">
                          {d.machineNumbers && d.machineNumbers.length === 5 ? (
                            <div className="flex items-center gap-1.5">
                              {d.machineNumbers.map((n, i) => (
                                <LotteryBall
                                  key={i}
                                  number={n}
                                  variant="cold"
                                  size="sm"
                                  tooltip={`Machine N°${n}`}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </td>
                      )}

                      {/* Sum */}
                      <td className="px-4 py-3 font-semibold text-slate-700">
                        {sum}
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3 text-[11px] text-emerald-800 font-sans font-medium truncate max-w-xs">
                        Loto Matrice Plus
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={showMachineNumbers ? 6 : 5} className="px-4 py-8 text-center text-slate-500 font-sans">
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
            sur <span className="font-semibold text-slate-900">{filteredDraws.length.toLocaleString('fr-FR')}</span> tirages
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
                  <label className="font-semibold text-slate-700">Nom du tirage :</label>
                  <input
                    type="text"
                    value={newDrawName}
                    onChange={(e) => setNewDrawName(e.target.value)}
                    placeholder="AKWABA, DIAMANT..."
                    required
                    className="w-full h-8 px-2 border border-slate-300 rounded uppercase"
                  />
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
