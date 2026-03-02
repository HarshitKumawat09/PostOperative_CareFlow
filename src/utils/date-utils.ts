// 📅 DATE UTILITY FUNCTIONS
// Safe date handling for components

export function safeDate(date: any): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  return new Date(date);
}

export function safeLocaleDateString(date: any): string {
  return safeDate(date).toLocaleDateString();
}

export function safeLocaleTimeString(date: any): string {
  return safeDate(date).toLocaleTimeString();
}

export function safeLocaleDateTimeString(date: any): string {
  return safeDate(date).toLocaleString();
}

export function safeGetTime(date: any): number {
  return safeDate(date).getTime();
}
