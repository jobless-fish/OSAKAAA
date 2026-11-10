import type { Area, Genre, PlaceType } from '../types'

/** 별점순(기본) · 거리순 · 음식 카테고리별 */
export type SortKey = 'score' | 'distance' | 'category'
export type RatingKey = 'all' | 'scored' | '3.6' | '3.8'

export interface FilterState {
  type: PlaceType | 'all'
  area: Area | 'all'
  genre: Genre | 'all'
  rating: RatingKey
  day: string
  sort: SortKey
}

export const DEFAULT_FILTERS: FilterState = {
  type: 'all',
  area: 'all',
  genre: 'all',
  rating: 'all',
  day: 'all',
  sort: 'score',
}

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'score', label: '별점순' },
  { key: 'distance', label: '거리순' },
  { key: 'category', label: '음식 카테고리별' },
]
