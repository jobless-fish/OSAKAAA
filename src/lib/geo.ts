const R = 6371

/** 두 좌표 사이 직선거리(km) */
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/** 도보 시간 추정: 실제 길은 직선보다 약 1.3배, 분속 80m 가정 */
export function walkMinutes(km: number): number {
  return Math.max(1, Math.round((km * 1.3 * 1000) / 80))
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
}

export function formatWalk(min: number): string {
  if (min > 40) return '전철 추천'
  return `도보 약 ${min}분`
}
