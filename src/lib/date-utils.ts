export function formatDate(date: string | Date, language: string = 'en', timezone: string = 'UTC'): string {
  const d = new Date(date);
  return d.toLocaleDateString(language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: timezone,
  });
}

export function formatDateTime(date: string | Date, language: string = 'en', timezone: string = 'UTC'): string {
  const d = new Date(date);
  return d.toLocaleString(language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  });
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
      minute: 'm ago',
      minutes: 'm ago',
      hour: 'h ago',
      hours: 'h ago',
      day: 'd ago',
      days: 'd ago',
      week: 'w ago',
      weeks: 'w ago',
      month: 'mo ago',
      months: 'mo ago',
    },
    es: {
      justNow: 'ahora mismo',
      minute: 'm atrás',
      minutes: 'm atrás',
      hour: 'h atrás',
      hours: 'h atrás',
      day: 'd atrás',
      days: 'd atrás',
      week: 's atrás',
      weeks: 's atrás',
      month: 'mes atrás',
      months: 'meses atrás',
    },
    fr: {
      justNow: 'à l\'instant',
      minute: 'm il y a',
      minutes: 'm il y a',
      hour: 'h il y a',
      hours: 'h il y a',
      day: 'j il y a',
      days: 'j il y a',
      week: 's il y a',
      weeks: 's il y a',
      month: 'mois il y a',
      months: 'mois il y a',
    },
  };

  const t = translations[language as keyof typeof translations] || translations.en;

  if (diffInSeconds < 60) {
    return t.justNow;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}${t.minute}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}${t.hour}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}${t.day}`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}${t.week}`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}${t.month}`;
}

export function isToday(date: string | Date): boolean {
  const today = new Date();
  const targetDate = new Date(date);
  return (
    today.getDate() === targetDate.getDate() &&
    today.getMonth() === targetDate.getMonth() &&
    today.getFullYear() === targetDate.getFullYear()
  );
}

export function isYesterday(date: string | Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = new Date(date);
  return (
    yesterday.getDate() === targetDate.getDate() &&
    yesterday.getMonth() === targetDate.getMonth() &&
    yesterday.getFullYear() === targetDate.getFullYear()
  );
}

export function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
}

export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}
