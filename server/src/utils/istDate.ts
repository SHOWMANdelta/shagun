/**
 * Computes calendar dates specifically in Asia/Kolkata (UTC+05:30)
 * to prevent boundary drift around midnight.
 */

export function getTodayIST(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date()); // Formats as YYYY-MM-DD
}

export function getCurrentTimeIST(): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date());
}

export function isFutureDateIST(dateString: string): boolean {
  const today = getTodayIST();
  return dateString > today;
}

export function daysBetweenIST(fromDateStr: string, toDateStr: string): number {
  const from = new Date(fromDateStr + 'T00:00:00Z');
  const to = new Date(toDateStr + 'T00:00:00Z');
  const diffTime = to.getTime() - from.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
