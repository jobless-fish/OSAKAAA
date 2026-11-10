export type Genre = 'meat' | 'noodle' | 'japanese' | 'asian' | 'western'
export type Area = 'near' | 'umeda' | 'temma' | 'namba' | 'west' | 'tennoji' | 'east' | 'south' | 'southwest' | 'bay'
export type FoodType = 'meal' | 'snack' | 'bar'
/** 식당이 아닌 장소: 특이한 장소(볼거리) · 주류 상점 · 면세점 · 라이브 바 */
export type PoiType = 'spot' | 'liquor' | 'taxfree' | 'livebar'
export const POI_TYPES: readonly PoiType[] = ['spot', 'livebar', 'liquor', 'taxfree']
export type PlaceType = FoodType | PoiType
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

/** 식당이 아닌 장소 (이름은 처음 만든 '특이한 장소'에서 그대로 씀) */
export interface Spot extends PlaceBase {
  type: PoiType
  /** 대표 사진 (타베로그 등 출처가 있을 때만) */
  image?: string | null
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

export const isSpot = (p: Place): p is Spot => (POI_TYPES as readonly string[]).includes(p.type)
export const scoreOf = (p: Place): number | null => (isSpot(p) ? null : p.tabelogScore)
