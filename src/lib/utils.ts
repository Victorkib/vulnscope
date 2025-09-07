import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: string | Date, language: string = 'en'): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor(
    (now.getTime() - targetDate.getTime()) / 1000
  );

  // Language-specific translations
  const translations = {
    en: {
      justNow: 'just now',
      minute: 'minute',
      minutes: 'minutes',
      hour: 'hour',
      hours: 'hours',
      day: 'day',
      days: 'days',
      week: 'week',
      weeks: 'weeks',
      month: 'month',
      months: 'months',
      year: 'year',
      years: 'years',
      ago: 'ago',
    },
    es: {
      justNow: 'ahora mismo',
      minute: 'minuto',
      minutes: 'minutos',
      hour: 'hora',
      hours: 'horas',
      day: 'día',
      days: 'días',
      week: 'semana',
      weeks: 'semanas',
      month: 'mes',
      months: 'meses',
      year: 'año',
      years: 'años',
      ago: 'atrás',
    },
    fr: {
      justNow: 'à l\'instant',
      minute: 'minute',
      minutes: 'minutes',
      hour: 'heure',
      hours: 'heures',
      day: 'jour',
      days: 'jours',
      week: 'semaine',
      weeks: 'semaines',
      month: 'mois',
      months: 'mois',
      year: 'année',
      years: 'années',
      ago: 'il y a',
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  if (diffInSeconds < 60) {
    return t.justNow;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes > 1 ? t.minutes : t.minute} ${t.ago}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours > 1 ? t.hours : t.hour} ${t.ago}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays > 1 ? t.days : t.day} ${t.ago}`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks > 1 ? t.weeks : t.week} ${t.ago}`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths > 1 ? t.months : t.month} ${t.ago}`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears > 1 ? t.years : t.year} ${t.ago}`;
}

export function getSeverityBadgeColor(severity: string): string {
  switch (severity.toUpperCase()) {
    case 'CRITICAL':
      return 'bg-red-500 text-white border-red-600';
    case 'HIGH':
      return 'bg-orange-500 text-white border-orange-600';
    case 'MEDIUM':
      return 'bg-yellow-500 text-white border-yellow-600';
    case 'LOW':
      return 'bg-green-500 text-white border-green-600';
    default:
      return 'bg-gray-500 text-white border-gray-600';
  }
}

export function getCvssColor(score: number): string {
  if (score >= 9.0) return 'text-red-600';
  if (score >= 7.0) return 'text-orange-600';
  if (score >= 4.0) return 'text-yellow-600';
  return 'text-green-600';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return prefix
    ? `${prefix}_${timestamp}_${randomStr}`
    : `${timestamp}_${randomStr}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
