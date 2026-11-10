import type { Area, Genre, PlaceType } from '../types'

export type SortKey = 'distance' | 'score' | 'name'
export type RatingKey = 'all' | 'scored' | '3.4' | '3.5'

export interface FilterState {
  type: PlaceType | 'all'
  area: Area | 'all'
  genre: Genre | 'all'
  rating: RatingKey
  day: string
  groupOnly: boolean
  userOnly: boolean
  sort: SortKey
}

export const DEFAULT_FILTERS: FilterState = {
  type: 'all',
  area: 'all',
  genre: 'all',
  rating: 'all',
  day: 'all',
  groupOnly: false,
  userOnly: false,
  sort: 'distance',
}

