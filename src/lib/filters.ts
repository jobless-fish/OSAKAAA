import type { Area, Genre, PlaceType } from '../types'

/** 별점순(기본) · 거리순 · 음식 카테고리별 */
export type SortKey = 'score' | 'distance' | 'category'
export type WalkKey = 'all' | '5' | '10' | '15'
export type RatingKey = 'all' | 'scored' | '3.6' | '3.8'

export interface FilterState {
  type: PlaceType | 'all'
  area: Area | 'all'
  genre: Genre | 'all'
  rating: RatingKey
  day: string
  /** 도보 N분 이내만 (숙소 기준 추정 도보 시간) */
  walk: WalkKey
  sort: SortKey
}

export const DEFAULT_FILTERS: FilterState = {
  type: 'all',
  area: 'all',
  genre: 'all',
  rating: 'all',
  day: 'all',
  walk: 'all',
  sort: 'score',
}

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'score', label: '별점순' },
  { key: 'distance', label: '거리순' },
  { key: 'category', label: '음식 카테고리별' },
]

/** 도보 빠른 필터. 도보 시간은 walkMinutes 추정치 (5분 ≈ 직선 308m, 10분 ≈ 직선 615m, 15분 ≈ 직선 920m) */
export const WALK_OPTIONS: { key: WalkKey; label: string }[] = [
  { key: 'all', label: '거리 전체' },
  { key: '5', label: '도보 5분 이내' },
  { key: '10', label: '도보 10분 이내' },
  { key: '15', label: '도보 15분 이내' },
]
