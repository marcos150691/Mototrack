import { MaintenanceItem } from '../types';

/**
 * Safely adds months to an ISO date string (YYYY-MM-DD), avoiding Daylight Saving Time shifts.
 */
export function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

export interface MaintenanceStatus {
  percent: number;
  remainingKm?: number;
  remainingDays?: number;
  isUrgent: boolean; // percent >= 90
  isWarning: boolean; // percent >= 70 && percent < 90
  statusText: string;
  nextDueText: string;
  triggerType: 'km' | 'period' | 'both';
}

/**
 * Calculates current wear percentage, remaining metrics, and user-facing status.
 */
export function calculateMaintenanceStatus(
  item: MaintenanceItem,
  currentKm: number,
  currentDateStr: string = '2026-05-27'
): MaintenanceStatus {
  const triggerType = item.triggerType || 'km';
  const kmInterval = item.intervalKm || 0;
  
  // 1. Kilometer stats
  const kmDriven = Math.max(0, currentKm - item.lastCompletedKm);
  const kmPercent = kmInterval > 0 ? Math.min(100, Math.round((kmDriven / kmInterval) * 100)) : 0;
  const remainingKm = Math.max(0, item.nextDueKm - currentKm);

  // 2. Period stats
  let periodPercent = 0;
  let remainingDays: number | undefined = undefined;
  
  const lastCompletedDate = item.lastCompletedDate || '2026-05-20';
  const nextDueDate = item.nextDueDate || addMonths(lastCompletedDate, item.intervalMonths || 6);

  const lastTime = new Date(lastCompletedDate + 'T12:00:00').getTime();
  const nextTime = new Date(nextDueDate + 'T12:00:00').getTime();
  const currentTime = new Date(currentDateStr + 'T12:00:00').getTime();

  const totalPeriodMs = nextTime - lastTime;
  const elapsedPeriodMs = currentTime - lastTime;

  if (totalPeriodMs > 0) {
    periodPercent = Math.min(100, Math.max(0, Math.round((elapsedPeriodMs / totalPeriodMs) * 100)));
  }
  
  const remainingDaysMs = nextTime - currentTime;
  remainingDays = Math.max(0, Math.ceil(remainingDaysMs / (1000 * 60 * 60 * 24)));

  // Combine reports
  let percent = 0;
  let statusText = '';
  let nextDueText = '';

  if (triggerType === 'km') {
    percent = kmPercent;
    nextDueText = `${item.nextDueKm.toLocaleString('pt-BR')} km`;
    statusText = remainingKm === 0 ? 'Excedido / Trocar Já' : `Faltam ${remainingKm.toLocaleString('pt-BR')} km`;
  } else if (triggerType === 'period') {
    percent = periodPercent;
    const formattedDate = new Date(nextDueDate + 'T12:00:00').toLocaleDateString('pt-BR');
    nextDueText = formattedDate;
    statusText = remainingDays === 0 ? 'Vencido / Trocar Já' : `Faltam ${remainingDays} dias`;
  } else {
    // BOTH
    percent = Math.max(kmPercent, periodPercent);
    const formattedDate = new Date(nextDueDate + 'T12:00:00').toLocaleDateString('pt-BR');
    nextDueText = `${item.nextDueKm.toLocaleString('pt-BR')} km ou ${formattedDate}`;
    
    if (remainingKm === 0 || remainingDays === 0) {
      statusText = 'Limite atingido / Trocar Já';
    } else {
      statusText = `Faltam ${remainingKm.toLocaleString('pt-BR')} km ou ${remainingDays} dias`;
    }
  }

  const isUrgent = percent >= 90;
  const isWarning = percent >= 70 && percent < 90;

  return {
    percent,
    remainingKm,
    remainingDays,
    isUrgent,
    isWarning,
    statusText,
    nextDueText,
    triggerType,
  };
}
