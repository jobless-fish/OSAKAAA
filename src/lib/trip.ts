export interface TripDay {
  date: string
  label: string
}

export const TRIP_DAYS: TripDay[] = [
  { date: '2026-11-13', label: '11/13 (금)' },
  { date: '2026-11-14', label: '11/14 (토)' },
  { date: '2026-11-15', label: '11/15 (일)' },
  { date: '2026-11-16', label: '11/16 (월)' },
  { date: '2026-11-17', label: '11/17 (화)' },
]

export function closedLabels(closedDates: string[]): string[] {
  return TRIP_DAYS.filter((d) => closedDates.includes(d.date)).map((d) => d.label)
}

export function isOpenOn(closedDates: string[], date: string): boolean {
  return !closedDates.includes(date)
}
