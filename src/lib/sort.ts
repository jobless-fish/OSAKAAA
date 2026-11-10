import type { Genre, WithDistance } from '../types'
import type { SortKey } from './filters'

/** 타베로그 점수 높은 순. 점수 없는 곳은 맨 뒤, 같은 점수면 가까운 순 */
export function byScore(a: WithDistance, b: WithDistance): number {
  const sa = a.tabelogScore
  const sb = b.tabelogScore
  if (sa == null && sb == null) return a.distanceKm - b.distanceKm
  if (sa == null) return 1
  if (sb == null) return -1
  return sb - sa || a.distanceKm - b.distanceKm
}

export function byDistance(a: WithDistance, b: WithDistance): number {
  return a.distanceKm - b.distanceKm
}

export interface GenreGroup {
  genre: Genre
  items: WithDistance[]
}

/** 장르 순서대로 묶고, 묶음 안은 별점순 */
export function groupByGenre(list: WithDistance[], order: Genre[]): GenreGroup[] {
  return order
    .map((genre) => ({ genre, items: list.filter((r) => r.genre === genre).sort(byScore) }))
    .filter((g) => g.items.length > 0)
}

/** 목록에 보일 순서 그대로 정렬 (카테고리별이면 묶음 순서를 펼친 것) */
export function sortPlaces(list: WithDistance[], key: SortKey, order: Genre[]): WithDistance[] {
  if (key === 'distance') return [...list].sort(byDistance)
  if (key === 'category') return groupByGenre(list, order).flatMap((g) => g.items)
  return [...list].sort(byScore)
}
