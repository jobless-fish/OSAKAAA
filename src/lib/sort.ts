import { scoreOf, type Genre, type WithDistance } from '../types'
import type { SortKey } from './filters'

/** 묶음 키: 음식 장르 5개 + 특이한 장소 */
export type GroupKey = Genre | 'spot'

/** 타베로그 점수 높은 순. 점수 없는 식당은 그 뒤, 특이한 장소는 맨 뒤 (각각 가까운 순) */
export function byScore(a: WithDistance, b: WithDistance): number {
  const ra = a.type === 'spot' ? 2 : scoreOf(a) == null ? 1 : 0
  const rb = b.type === 'spot' ? 2 : scoreOf(b) == null ? 1 : 0
  if (ra !== rb) return ra - rb
  if (ra > 0) return a.distanceKm - b.distanceKm
  return (scoreOf(b) as number) - (scoreOf(a) as number) || a.distanceKm - b.distanceKm
}

export function byDistance(a: WithDistance, b: WithDistance): number {
  return a.distanceKm - b.distanceKm
}

export interface PlaceGroup {
  key: GroupKey
  items: WithDistance[]
}

const keyOf = (p: WithDistance): GroupKey => (p.type === 'spot' ? 'spot' : p.genre)

/** 장르 순서대로 묶고(특이한 장소는 맨 끝), 묶음 안은 별점순 */
export function groupByGenre(list: WithDistance[], order: Genre[]): PlaceGroup[] {
  const keys: GroupKey[] = [...order, 'spot']
  return keys
    .map((key) => ({ key, items: list.filter((r) => keyOf(r) === key).sort(byScore) }))
    .filter((g) => g.items.length > 0)
}

/** 목록에 보일 순서 그대로 정렬 (카테고리별이면 묶음 순서를 펼친 것) */
export function sortPlaces(list: WithDistance[], key: SortKey, order: Genre[]): WithDistance[] {
  if (key === 'distance') return [...list].sort(byDistance)
  if (key === 'category') return groupByGenre(list, order).flatMap((g) => g.items)
  return [...list].sort(byScore)
}
