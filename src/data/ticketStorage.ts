/**
 * Virtual Ticket Storage & Evaluation Service
 * Manages player-created virtual tickets across prediction methods and draw simulations.
 * Evaluates tickets against certified Lonaci / Loto Matrice Plus official draw results.
 */

import { Draw, TicketBetType, VirtualTicket } from '../types/lottery';

const TICKETS_STORAGE_KEY = 'loto_bonheur_virtual_tickets_v1';

export const LONACI_BET_RULES: Record<
  TicketBetType,
  { label: string; multiplier: number; requiredHits: number; minNums: number; maxNums: number }
> = {
  '1N': {
    label: '1N · Banker Simple',
    multiplier: 18,
    requiredHits: 1,
    minNums: 1,
    maxNums: 1,
  },
  '2N': {
    label: '2N · Two Sure Couplé',
    multiplier: 240,
    requiredHits: 2,
    minNums: 2,
    maxNums: 5,
  },
  '3N': {
    label: '3N · Permutation 3 Nombres',
    multiplier: 2100,
    requiredHits: 3,
    minNums: 3,
    maxNums: 5,
  },
  '4N': {
    label: '4N · Permutation 4 Nombres',
    multiplier: 18000,
    requiredHits: 4,
    minNums: 4,
    maxNums: 5,
  },
  '5N': {
    label: '5N · Quinté / Gros Lot',
    multiplier: 100000,
    requiredHits: 5,
    minNums: 5,
    maxNums: 5,
  },
};

/**
 * Loads stored virtual tickets from LocalStorage
 */
export function getStoredTickets(): VirtualTicket[] {
  try {
    const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return [];
}

/**
 * Saves tickets array to LocalStorage
 */
export function saveAllTickets(tickets: VirtualTicket[]): void {
  try {
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
  } catch (err) {
    console.warn('LocalStorage save failed for tickets', err);
  }
}

/**
 * Creates and registers a new virtual ticket
 */
export function createVirtualTicket(
  ticketData: Omit<VirtualTicket, 'id' | 'createdAt' | 'status' | 'matchedNumbers' | 'officialDrawNumbers' | 'gainFCFA' | 'multiplier'>
): VirtualTicket {
  const rule = LONACI_BET_RULES[ticketData.betType];
  const newTicket: VirtualTicket = {
    ...ticketData,
    id: `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    status: 'En attente',
    multiplier: rule.multiplier,
  };

  const current = getStoredTickets();
  const updated = [newTicket, ...current];
  saveAllTickets(updated);

  return newTicket;
}

/**
 * Evaluates a single ticket against available draws
 */
export function evaluateTicketAgainstHistory(ticket: VirtualTicket, draws: Draw[]): VirtualTicket {
  // Try to find the matching official draw for this target date and slot/time
  const matchedDraw = draws.find((d) => {
    const dateMatch = d.drawDate === ticket.targetDate;
    const slotMatch = d.slot === ticket.targetSlot;
    const timeMatch = ticket.targetTime ? d.drawTime.startsWith(ticket.targetTime.slice(0, 2)) : false;
    return dateMatch && (slotMatch || timeMatch);
  });

  if (!matchedDraw) {
    // Check if draw has occurred in the past (date before today or older)
    return {
      ...ticket,
      status: 'En attente',
      matchedNumbers: [],
      officialDrawNumbers: undefined,
      gainFCFA: 0,
    };
  }

  const realNumbers = matchedDraw.numbers;
  const realSet = new Set(realNumbers);
  const matchedNumbers = ticket.numbers.filter((n) => realSet.has(n));

  const rule = LONACI_BET_RULES[ticket.betType];
  const isWon = matchedNumbers.length >= rule.requiredHits;
  const gainFCFA = isWon ? ticket.stakeFCFA * rule.multiplier : 0;

  return {
    ...ticket,
    status: isWon ? 'Gagnant' : 'Non gagnant',
    matchedNumbers,
    officialDrawNumbers: realNumbers,
    gainFCFA,
    multiplier: rule.multiplier,
  };
}

/**
 * Evaluates all tickets against the latest certified draw history
 */
export function syncAndEvaluateAllTickets(draws: Draw[]): VirtualTicket[] {
  const tickets = getStoredTickets();
  const evaluated = tickets.map((t) => evaluateTicketAgainstHistory(t, draws));
  saveAllTickets(evaluated);
  return evaluated;
}

/**
 * Deletes a ticket by ID
 */
export function deleteVirtualTicket(id: string): VirtualTicket[] {
  const current = getStoredTickets();
  const updated = current.filter((t) => t.id !== id);
  saveAllTickets(updated);
  return updated;
}
