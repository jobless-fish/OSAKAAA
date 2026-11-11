import { hasType, isSpot, POI_TYPES, scoreOf, type Genre, type PlaceType, type PoiType, type WithDistance } from '../types'
import type { SortKey } from './filters'

/** 묶음 키: 음식 장르 5개 + 식당이 아닌 장소 종류 */
export type GroupKey = Genre | PoiType

/** 타베로그 점수 높은 순. 점수 없는 식당은 그 뒤, 식당이 아닌 장소는 맨 뒤 (각각 가까운 순) */
export function byScore(a: WithDistance, b: WithDistance): number {
  const ra = isSpot(a) ? 2 : scoreOf(a) == null ? 1 : 0
  const rb = isSpot(b) ? 2 : scoreOf(b) == null ? 1 : 0
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

/** 묶음 키. 종류 필터가 켜져 있고 태그로 그 종류에 들어온 곳이면 그 종류 묶음에 넣는다 */
const keyOf = (p: WithDistance, prefer?: PlaceType | 'all'): GroupKey =>
  isSpot(p) ? (prefer && prefer !== 'all' && hasType(p, prefer) ? (prefer as PoiType) : p.type) : p.genre

/** 장르 순서대로 묶고(식당이 아닌 장소는 종류별로 맨 끝), 묶음 안은 별점순 */
export function groupByGenre(list: WithDistance[], order: Genre[], prefer?: PlaceType | 'all'): PlaceGroup[] {
  const keys: GroupKey[] = [...order, ...POI_TYPES]
  return keys
    .map((key) => ({ key, items: list.filter((r) => keyOf(r, prefer) === key).sort(byScore) }))
    .filter((g) => g.items.length > 0)
}

/** 목록에 보일 순서 그대로 정렬 (카테고리별이면 묶음 순서를 펼친 것) */
export function sortPlaces(list: WithDistance[], key: SortKey, order: Genre[], prefer?: PlaceType | 'all'): WithDistance[] {
  if (key === 'distance') return [...list].sort(byDistance)
  if (key === 'category') return groupByGenre(list, order, prefer).flatMap((g) => g.items)
  return [...list].sort(byScore)
}
