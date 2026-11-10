export type Genre = 'meat' | 'noodle' | 'japanese' | 'asian' | 'western'
export type Area = 'near' | 'umeda' | 'temma' | 'namba' | 'west' | 'tennoji' | 'east' | 'south' | 'southwest' | 'bay'
export type FoodType = 'meal' | 'snack' | 'bar'
/** 'spot' = 특이한 장소 (식당이 아닌 볼거리) */
export type PlaceType = FoodType | 'spot'
export type GroupFit = 'ok' | 'maybe' | 'no'

interface PlaceBase {
  id: string
  nameKo: string
  nameJa: string
  area: Area
  station: string
  hours: string
  closedDates: string[]
  closedNote: string | null
  address: string
  lat: number
  lng: number
  geocode: { provider: string; matched: string }
}

export interface Restaurant extends PlaceBase {
  type: FoodType
  genre: Genre
  genreText: string
  tabelogScore: number | null
  budget: string
  reserve: string
  seats: string
  group: GroupFit
  groupNote: string
  tabelogUrl: string
  courseUrl: string | null
  image: string
}

export interface Spot extends PlaceBase {
  type: 'spot'
  icon: string
  spotKind: string
  description: string
  fee: string
  tip: string | null
  infoUrl: string
  infoLabel: string
}

export type Place = Restaurant | Spot

export interface Lodging {
  name: string
  address: string
  addressEn: string
  lat: number
  lng: number
}

export interface Dataset {
  updated: string
  lodging: Lodging
  restaurants: Restaurant[]
  spots: Spot[]
}

export type WithDistance = Place & {
  distanceKm: number
  walkMin: number
}

export const isSpot = (p: Place): p is Spot => p.type === 'spot'
export const scoreOf = (p: Place): number | null => (p.type === 'spot' ? null : p.tabelogScore)
